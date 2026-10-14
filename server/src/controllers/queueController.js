const Service = require('../models/Service');
const Token = require('../models/Token');
const Counter = require('../models/Counter');
const Notification = require('../models/Notification');
const notificationClient = require('../services/notificationClient');
const QueueLog = require('../models/QueueLog');
const QueueSetting = require('../models/QueueSetting');
const { calculateWaitTime } = require('../services/waitTimeEstimator');
const cacheService = require('../services/cacheService');
const {
  emitQueueUpdate,
  emitTokenStatusChange,
  emitNotification,
  emitAdminStats,
} = require('../sockets/socketEmitter');

// @desc    Get all active services with live queue stats
// @route   GET /api/queue/services
// @access  Public
const getServices = async (req, res) => {
  try {
    const services = await Service.find({ isActive: true });

    const servicesWithStats = await Promise.all(
      services.map(async (service) => {
        const waitingCount = await Token.countDocuments({
          service: service._id,
          status: 'waiting',
        });

        const activeCounters = await Counter.countDocuments({
          supportedServices: service._id,
          status: 'open',
        });

        // Currently serving token for this service
        const currentlyServingToken = await Token.findOne({
          service: service._id,
          status: { $in: ['called', 'in_progress'] },
        })
          .sort({ calledAt: -1 })
          .populate('counter', 'counterNumber name');

        const { estimatedMinutes } = await calculateWaitTime(service._id);

        return {
          id: service._id,
          name: service.name,
          code: service.code,
          prefix: service.prefix,
          description: service.description,
          avgDuration: service.avgDuration,
          color: service.color,
          icon: service.icon,
          waitingCount,
          activeCounters,
          estimatedMinutes,
          currentServingNumber: currentlyServingToken ? currentlyServingToken.tokenNumber : null,
          currentServingCounter: currentlyServingToken?.counter?.name || null,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: servicesWithStats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching services',
    });
  }
};

// @desc    Join a queue & generate token
// @route   POST /api/queue/join
// @access  Private (Customer)
const joinQueue = async (req, res) => {
  try {
    const { serviceId, notes } = req.body;
    const userId = req.user._id;

    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a serviceId',
      });
    }

    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Service is not available or inactive',
      });
    }

    // Check if customer already has an active token for this service
    const existingActiveToken = await Token.findOne({
      customer: userId,
      status: { $in: ['waiting', 'called', 'in_progress'] },
    }).populate('service', 'name code');

    if (existingActiveToken) {
      return res.status(400).json({
        success: false,
        message: `You already have an active token (${existingActiveToken.tokenNumber}) for ${existingActiveToken.service.name}. Please wait or cancel it before taking another token.`,
      });
    }

    // Check daily limit if configured
    const setting = (await QueueSetting.findOne()) || { maxTokensPerCustomerPerDay: 5 };
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tokensCreatedToday = await Token.countDocuments({
      customer: userId,
      createdAt: { $gte: today },
    });

    if (tokensCreatedToday >= setting.maxTokensPerCustomerPerDay) {
      return res.status(400).json({
        success: false,
        message: `Daily token limit reached (${setting.maxTokensPerCustomerPerDay} tokens per day).`,
      });
    }

    // Increment service sequence number
    const updatedService = await Service.findByIdAndUpdate(
      serviceId,
      { $inc: { dailyTokenCounter: 1 } },
      { new: true }
    );

    const sequenceNum = updatedService.dailyTokenCounter;
    const tokenNumber = `${service.prefix}${String(sequenceNum).padStart(3, '0')}`;

    const waitStats = await calculateWaitTime(serviceId);

    const token = await Token.create({
      tokenNumber,
      sequenceNumber: sequenceNum,
      service: serviceId,
      customer: userId,
      status: 'waiting',
      joinedAt: new Date(),
      estimatedWaitTime: waitStats.estimatedMinutes,
      notes: notes || '',
    });

    // Populate service details for response
    await token.populate('service', 'name code prefix avgDuration color icon');

    // Create queue log entry
    await QueueLog.create({
      token: token._id,
      action: 'created',
      performedBy: userId,
      details: `Token ${tokenNumber} issued to ${req.user.name}`,
    });

    // Create confirmation in-app notification via Notification Microservice
    const notification = await notificationClient.dispatchNotification({
      recipient: userId,
      title: 'Token Generated Successfully',
      message: `Your token ${tokenNumber} has been generated for ${service.name}. Queue position: #${waitStats.aheadCount + 1}.`,
      type: 'success',
      token: token._id,
      channels: ['in-app', 'sms'],
    });

    // Invalidate caches & emit real-time events
    await cacheService.invalidateServiceQueue(serviceId);
    emitQueueUpdate(serviceId, {
      serviceId,
      action: 'token_joined',
      tokenNumber,
      waitingCount: waitStats.aheadCount + 1,
    });
    emitNotification(userId, notification);
    emitAdminStats({ action: 'token_created', serviceId });

    res.status(201).json({
      success: true,
      data: {
        token,
        queuePosition: waitStats.aheadCount + 1,
        estimatedMinutes: waitStats.estimatedMinutes,
      },
      message: 'Token created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error joining queue',
    });
  }
};

// @desc    Get customer's active token with live position & wait time
// @route   GET /api/queue/my-active
// @access  Private (Customer)
const getMyActiveToken = async (req, res) => {
  try {
    const userId = req.user._id;

    const token = await Token.findOne({
      customer: userId,
      status: { $in: ['waiting', 'called', 'in_progress'] },
    })
      .populate('service', 'name code prefix avgDuration color icon')
      .populate('counter', 'counterNumber name')
      .populate('servedBy', 'name');

    if (!token) {
      return res.status(200).json({
        success: true,
        data: null,
      });
    }

    // Calculate dynamic queue position & wait time
    let queuePosition = 1;
    let aheadCount = 0;
    let waitCalculation = { estimatedMinutes: token.service?.avgDuration || 10 };

    if (token.status === 'waiting') {
      aheadCount = await Token.countDocuments({
        service: token.service._id,
        status: 'waiting',
        joinedAt: { $lt: token.joinedAt },
      });
      queuePosition = aheadCount + 1;
      waitCalculation = await calculateWaitTime(token.service._id, token.joinedAt);
    } else {
      queuePosition = 0; // Currently being served or called
      waitCalculation.estimatedMinutes = 0;
    }

    // Get current serving token for the same service
    const currentServing = await Token.findOne({
      service: token.service._id,
      status: { $in: ['called', 'in_progress'] },
    })
      .sort({ calledAt: -1 })
      .populate('counter', 'counterNumber name');

    // Total waiting in this service
    const totalWaiting = await Token.countDocuments({
      service: token.service._id,
      status: 'waiting',
    });

    res.status(200).json({
      success: true,
      data: {
        token,
        queuePosition,
        aheadCount,
        totalWaiting,
        estimatedWaitTime: waitCalculation.estimatedMinutes,
        currentlyServing: currentServing ? currentServing.tokenNumber : 'None',
        servingCounter: currentServing?.counter?.name || null,
        calculationDetails: {
          aheadCount,
          activeCounters: waitCalculation.activeCounters || 1,
          avgDuration: waitCalculation.avgDuration || 10,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching active token',
    });
  }
};

// @desc    Get customer's token history
// @route   GET /api/queue/my-history
// @access  Private (Customer)
const getMyTokenHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const tokens = await Token.find({
      customer: userId,
      status: { $in: ['completed', 'cancelled', 'skipped'] },
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('service', 'name code color icon')
      .populate('counter', 'counterNumber name')
      .populate('servedBy', 'name');

    res.status(200).json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching token history',
    });
  }
};

// @desc    Cancel an active token
// @route   PUT /api/queue/cancel/:id
// @access  Private (Customer or Admin)
const cancelToken = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const token = await Token.findById(id).populate('service');
    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found',
      });
    }

    // Verify ownership or admin privilege
    if (token.customer.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this token',
      });
    }

    if (token.status === 'completed' || token.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Token cannot be cancelled as it is already ${token.status}`,
      });
    }

    token.status = 'cancelled';
    token.cancelledAt = new Date();
    await token.save();

    await QueueLog.create({
      token: token._id,
      action: 'cancelled',
      performedBy: userId,
      details: `Token ${token.tokenNumber} cancelled by ${req.user.name}`,
    });

    const notification = await notificationClient.dispatchNotification({
      recipient: token.customer,
      title: 'Token Cancelled',
      message: `Your token ${token.tokenNumber} for ${token.service?.name} has been cancelled.`,
      type: 'warning',
      token: token._id,
    });

    await cacheService.invalidateServiceQueue(token.service._id);
    emitQueueUpdate(token.service._id, {
      serviceId: token.service._id,
      action: 'token_cancelled',
      tokenNumber: token.tokenNumber,
    });
    emitTokenStatusChange(token.customer, token);
    emitNotification(token.customer, notification);

    res.status(200).json({
      success: true,
      message: 'Token cancelled successfully',
      data: token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error cancelling token',
    });
  }
};

module.exports = {
  getServices,
  joinQueue,
  getMyActiveToken,
  getMyTokenHistory,
  cancelToken,
};
