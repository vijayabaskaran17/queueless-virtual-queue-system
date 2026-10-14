const Token = require('../models/Token');
const Counter = require('../models/Counter');
const Service = require('../models/Service');
const User = require('../models/User');
const Notification = require('../models/Notification');
const notificationClient = require('../services/notificationClient');
const QueueLog = require('../models/QueueLog');
const CounterSwitchRequest = require('../models/CounterSwitchRequest');
const cacheService = require('../services/cacheService');
const { calculateWaitTime } = require('../services/waitTimeEstimator');
const {
  emitQueueUpdate,
  emitTokenStatusChange,
  emitNotification,
  emitCounterUpdate,
  emitAdminStats,
  getIO,
} = require('../sockets/socketEmitter');

// @desc    Get staff dashboard overview (assigned counter, active queue, currently serving)
// @route   GET /api/staff/dashboard
// @access  Private (Staff, Admin)
const getStaffDashboard = async (req, res) => {
  try {
    const staffId = req.user._id;

    // Find staff's counter
    let counter = await Counter.findOne({ assignedStaff: staffId })
      .populate('supportedServices')
      .populate({
        path: 'currentServingToken',
        populate: [
          { path: 'customer', select: 'name email phone' },
          { path: 'service', select: 'name code color avgDuration' },
        ],
      });

    // If no counter explicitly assigned to this staff member, find any counter or first counter
    if (!counter) {
      counter = await Counter.findOne()
        .populate('supportedServices')
        .populate({
          path: 'currentServingToken',
          populate: [
            { path: 'customer', select: 'name email phone' },
            { path: 'service', select: 'name code color avgDuration' },
          ],
        });
    }

    // Supported service IDs for this counter
    const serviceIds = counter && counter.supportedServices?.length > 0
      ? counter.supportedServices.map((s) => s._id)
      : (await Service.find({ isActive: true }).select('_id')).map((s) => s._id);

    // Waiting tokens in queue
    const waitingTokens = await Token.find({
      service: { $in: serviceIds },
      status: 'waiting',
    })
      .sort({ joinedAt: 1 })
      .populate('customer', 'name email phone')
      .populate('service', 'name code prefix color avgDuration');

    // Skipped tokens available for recall
    const skippedTokens = await Token.find({
      service: { $in: serviceIds },
      status: 'skipped',
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    })
      .sort({ skippedAt: -1 })
      .limit(10)
      .populate('customer', 'name email phone')
      .populate('service', 'name code prefix color');

    // Recently completed tokens by this counter/staff today
    const completedTokens = await Token.find({
      servedBy: staffId,
      status: 'completed',
      completedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    })
      .sort({ completedAt: -1 })
      .limit(10)
      .populate('customer', 'name')
      .populate('service', 'name code color');

    // Calculate queue waiting time metrics
    const waitingWithDuration = waitingTokens.map((token, index) => {
      const waitMinutes = Math.round((new Date() - new Date(token.joinedAt)) / 60000);
      return {
        ...token.toObject(),
        queuePosition: index + 1,
        waitingMinutes: Math.max(0, waitMinutes),
      };
    });

    res.status(200).json({
      success: true,
      data: {
        counter,
        waitingTokens: waitingWithDuration,
        skippedTokens,
        completedTokens,
        currentlyServing: counter ? counter.currentServingToken : null,
        stats: {
          waitingCount: waitingTokens.length,
          skippedCount: skippedTokens.length,
          completedCount: completedTokens.length,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching staff dashboard',
    });
  }
};

// @desc    Call next token in queue
// @route   POST /api/staff/call-next
// @access  Private (Staff, Admin)
const callNextToken = async (req, res) => {
  try {
    const staffId = req.user._id;
    const { counterId, specificTokenId } = req.body;

    let counter = null;
    if (counterId) {
      counter = await Counter.findById(counterId);
    } else {
      counter = await Counter.findOne({ assignedStaff: staffId });
    }

    if (!counter) {
      return res.status(400).json({
        success: false,
        message: 'No counter assigned. Please select an active counter first.',
      });
    }

    const serviceIds = counter.supportedServices?.length > 0
      ? counter.supportedServices
      : (await Service.find({ isActive: true }).select('_id')).map((s) => s._id);

    let nextToken = null;

    if (specificTokenId) {
      nextToken = await Token.findById(specificTokenId);
    } else {
      // Find oldest waiting token
      nextToken = await Token.findOne({
        service: { $in: serviceIds },
        status: 'waiting',
      }).sort({ joinedAt: 1 });
    }

    if (!nextToken) {
      return res.status(404).json({
        success: false,
        message: 'No customers currently waiting in queue.',
      });
    }

    // Update token status to 'called'
    nextToken.status = 'called';
    nextToken.calledAt = new Date();
    nextToken.counter = counter._id;
    nextToken.servedBy = staffId;
    await nextToken.save();

    // Update Counter currentlyServingToken
    counter.currentServingToken = nextToken._id;
    await counter.save();

    await nextToken.populate('customer', 'name email phone');
    await nextToken.populate('service', 'name code color prefix');
    await nextToken.populate('counter', 'counterNumber name');

    // Log action
    await QueueLog.create({
      token: nextToken._id,
      action: 'called',
      performedBy: staffId,
      counter: counter._id,
      details: `Token ${nextToken.tokenNumber} called to ${counter.name}`,
    });

    // Notify customer via Notification Microservice
    const notification = await notificationClient.dispatchNotification({
      recipient: nextToken.customer._id,
      title: 'It is Your Turn!',
      message: `Token ${nextToken.tokenNumber}: Please proceed to ${counter.name} now.`,
      type: 'called',
      token: nextToken._id,
      channels: ['in-app', 'sms'],
    });

    // Real-time broadcasts
    await cacheService.invalidateServiceQueue(nextToken.service._id);
    emitQueueUpdate(nextToken.service._id, {
      action: 'token_called',
      serviceId: nextToken.service._id,
      tokenNumber: nextToken.tokenNumber,
      counterName: counter.name,
    });
    emitTokenStatusChange(nextToken.customer._id, nextToken);
    emitNotification(nextToken.customer._id, notification);
    emitCounterUpdate(counter);
    emitAdminStats({ action: 'token_called', serviceId: nextToken.service._id });

    res.status(200).json({
      success: true,
      message: `Called token ${nextToken.tokenNumber} to ${counter.name}`,
      data: nextToken,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error calling next token',
    });
  }
};

// @desc    Start service for called token
// @route   POST /api/staff/start-service/:id
// @access  Private (Staff, Admin)
const startService = async (req, res) => {
  try {
    const { id } = req.params;
    const token = await Token.findById(id)
      .populate('customer', 'name email phone')
      .populate('service', 'name code color')
      .populate('counter', 'counterNumber name');

    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found',
      });
    }

    token.status = 'in_progress';
    token.startedAt = new Date();
    await token.save();

    await QueueLog.create({
      token: token._id,
      action: 'started',
      performedBy: req.user._id,
      counter: token.counter?._id,
      details: `Service started for token ${token.tokenNumber}`,
    });

    const notification = await notificationClient.dispatchNotification({
      recipient: token.customer._id,
      title: 'Service Started',
      message: `Your service for token ${token.tokenNumber} is now in progress.`,
      type: 'info',
      token: token._id,
    });

    emitTokenStatusChange(token.customer._id, token);
    emitNotification(token.customer._id, notification);
    emitQueueUpdate(token.service._id, {
      action: 'service_started',
      tokenNumber: token.tokenNumber,
    });

    res.status(200).json({
      success: true,
      message: 'Service marked in progress',
      data: token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error starting service',
    });
  }
};

// @desc    Complete service for current token
// @route   POST /api/staff/complete-service/:id
// @access  Private (Staff, Admin)
const completeService = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const token = await Token.findById(id)
      .populate('customer', 'name email')
      .populate('service', 'name code')
      .populate('counter', 'counterNumber name');

    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found',
      });
    }

    token.status = 'completed';
    token.completedAt = new Date();
    if (notes) token.notes = notes;
    await token.save();

    // Release counter current serving token
    if (token.counter) {
      await Counter.findByIdAndUpdate(token.counter._id, {
        currentServingToken: null,
        $inc: { totalServedToday: 1 },
      });
    }

    await QueueLog.create({
      token: token._id,
      action: 'completed',
      performedBy: req.user._id,
      counter: token.counter?._id,
      details: `Token ${token.tokenNumber} completed. ${notes ? `Notes: ${notes}` : ''}`,
    });

    const notification = await notificationClient.dispatchNotification({
      recipient: token.customer._id,
      title: 'Service Completed',
      message: `Thank you! Your service for token ${token.tokenNumber} has been successfully completed.`,
      type: 'success',
      token: token._id,
    });

    await cacheService.invalidateServiceQueue(token.service._id);
    emitTokenStatusChange(token.customer._id, token);
    emitNotification(token.customer._id, notification);
    emitQueueUpdate(token.service._id, {
      action: 'token_completed',
      tokenNumber: token.tokenNumber,
    });
    emitAdminStats({ action: 'service_completed' });

    res.status(200).json({
      success: true,
      message: 'Service marked as completed',
      data: token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error completing service',
    });
  }
};

// @desc    Skip a called token
// @route   POST /api/staff/skip-token/:id
// @access  Private (Staff, Admin)
const skipToken = async (req, res) => {
  try {
    const { id } = req.params;
    const token = await Token.findById(id)
      .populate('customer', 'name email')
      .populate('service', 'name code')
      .populate('counter', 'counterNumber name');

    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found',
      });
    }

    token.status = 'skipped';
    token.skippedAt = new Date();
    await token.save();

    // Clear counter's current serving token
    if (token.counter) {
      await Counter.findByIdAndUpdate(token.counter._id, {
        currentServingToken: null,
      });
    }

    await QueueLog.create({
      token: token._id,
      action: 'skipped',
      performedBy: req.user._id,
      counter: token.counter?._id,
      details: `Token ${token.tokenNumber} skipped as customer did not respond.`,
    });

    const notification = await notificationClient.dispatchNotification({
      recipient: token.customer._id,
      title: 'Token Skipped',
      message: `Your token ${token.tokenNumber} was skipped because you were unavailable. You may ask staff to recall your token.`,
      type: 'warning',
      token: token._id,
    });

    await cacheService.invalidateServiceQueue(token.service._id);
    emitTokenStatusChange(token.customer._id, token);
    emitNotification(token.customer._id, notification);
    emitQueueUpdate(token.service._id, {
      action: 'token_skipped',
      tokenNumber: token.tokenNumber,
    });

    res.status(200).json({
      success: true,
      message: `Token ${token.tokenNumber} marked as skipped`,
      data: token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error skipping token',
    });
  }
};

// @desc    Recall a skipped or previously called token
// @route   POST /api/staff/recall-token/:id
// @access  Private (Staff, Admin)
const recallToken = async (req, res) => {
  try {
    const { id } = req.params;
    const staffId = req.user._id;

    const token = await Token.findById(id)
      .populate('customer', 'name email')
      .populate('service', 'name code')
      .populate('counter', 'counterNumber name');

    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found',
      });
    }

    let counter = await Counter.findOne({ assignedStaff: staffId });
    if (!counter) {
      counter = token.counter || (await Counter.findOne());
    }

    token.status = 'called';
    token.calledAt = new Date();
    token.recalledCount = (token.recalledCount || 0) + 1;
    token.counter = counter ? counter._id : token.counter;
    token.servedBy = staffId;
    await token.save();

    if (counter) {
      counter.currentServingToken = token._id;
      await counter.save();
    }

    await QueueLog.create({
      token: token._id,
      action: 'recalled',
      performedBy: staffId,
      counter: counter?._id,
      details: `Token ${token.tokenNumber} recalled for the ${token.recalledCount} time`,
    });

    const notification = await notificationClient.dispatchNotification({
      recipient: token.customer._id,
      title: 'FINAL CALL: Token Recalled',
      message: `Token ${token.tokenNumber}: Please proceed immediately to ${counter ? counter.name : 'the counter'}.`,
      type: 'called',
      token: token._id,
      channels: ['in-app', 'sms'],
    });

    emitTokenStatusChange(token.customer._id, token);
    emitNotification(token.customer._id, notification);
    emitQueueUpdate(token.service._id, {
      action: 'token_recalled',
      tokenNumber: token.tokenNumber,
      counterName: counter?.name,
    });

    res.status(200).json({
      success: true,
      message: `Token ${token.tokenNumber} recalled successfully`,
      data: token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error recalling token',
    });
  }
};

// @desc    Update counter status or assign counter to current staff
// @route   POST /api/staff/set-counter
// @access  Private (Staff, Admin)
const setCounterStatus = async (req, res) => {
  try {
    const { counterId, status } = req.body;
    const staffId = req.user._id;

    const counter = await Counter.findById(counterId);
    if (!counter) {
      return res.status(404).json({
        success: false,
        message: 'Counter not found',
      });
    }

    const isAssignedToStaff = counter.assignedStaff && counter.assignedStaff.toString() === staffId.toString();

    // Direct switching without admin approval is restricted for staff
    if (!isAssignedToStaff && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Direct counter switching requires administrator approval. Please submit a switch request.',
      });
    }

    if (req.user.role === 'admin' && !isAssignedToStaff) {
      counter.assignedStaff = staffId;
    }

    if (status && ['open', 'closed', 'break'].includes(status)) {
      counter.status = status;
    }
    await counter.save();

    await Counter.populate(counter, { path: 'supportedServices' });

    emitCounterUpdate(counter);

    res.status(200).json({
      success: true,
      message: `Counter ${counter.name} is now ${counter.status}`,
      data: counter,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating counter status',
    });
  }
};

// @desc    Request to switch to a different counter (requires Admin approval)
// @route   POST /api/staff/request-counter-switch
// @access  Private (Staff, Admin)
const requestCounterSwitch = async (req, res) => {
  try {
    const { targetCounterId, note } = req.body;
    const staffId = req.user._id;

    if (!targetCounterId) {
      return res.status(400).json({
        success: false,
        message: 'Target counter ID is required',
      });
    }

    const targetCounter = await Counter.findById(targetCounterId).populate('supportedServices');
    if (!targetCounter) {
      return res.status(404).json({
        success: false,
        message: 'Target counter not found',
      });
    }

    // Check if staff is already assigned to this counter
    if (targetCounter.assignedStaff && targetCounter.assignedStaff.toString() === staffId.toString()) {
      return res.status(400).json({
        success: false,
        message: `You are already assigned to ${targetCounter.name}.`,
      });
    }

    // Find staff's current counter (if any)
    const currentCounter = await Counter.findOne({ assignedStaff: staffId });

    // Check if staff already has a pending switch request
    const existingPending = await CounterSwitchRequest.findOne({
      staff: staffId,
      status: 'pending',
    }).populate('targetCounter');

    if (existingPending) {
      if (existingPending.targetCounter?._id?.toString() === targetCounterId.toString()) {
        return res.status(400).json({
          success: false,
          message: `A switch request for ${targetCounter.name} is already pending administrator approval.`,
          data: existingPending,
        });
      }
      // If requesting a different counter, cancel previous pending request
      existingPending.status = 'cancelled';
      await existingPending.save();
    }

    const switchRequest = await CounterSwitchRequest.create({
      staff: staffId,
      currentCounter: currentCounter ? currentCounter._id : null,
      targetCounter: targetCounter._id,
      status: 'pending',
      note: note || '',
    });

    const populatedRequest = await CounterSwitchRequest.findById(switchRequest._id)
      .populate('staff', 'name email employeeId phone')
      .populate('currentCounter', 'name counterNumber')
      .populate('targetCounter', 'name counterNumber supportedServices status');

    // Notify all administrators in real time
    const admins = await User.find({ role: 'admin' });
    const currentCounterLabel = currentCounter ? currentCounter.name : 'Unassigned Desk';
    for (const admin of admins) {
      const notif = await notificationClient.dispatchNotification({
        recipient: admin._id,
        title: 'Counter Switch Request',
        message: `${req.user.name} requested to switch from ${currentCounterLabel} to ${targetCounter.name}.`,
        type: 'alert',
        metadata: {
          switchRequestId: switchRequest._id,
          staffId,
          targetCounterId: targetCounter._id,
        },
      });
      emitNotification(admin._id, notif);
    }

    const io = getIO();
    if (io) {
      io.to('role:admin').emit('counter_switch:requested', populatedRequest);
      io.emit('counter:updated', targetCounter);
    }

    res.status(201).json({
      success: true,
      message: `Switch request for ${targetCounter.name} submitted. Awaiting administrator approval.`,
      data: populatedRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error submitting counter switch request',
    });
  }
};

// @desc    Get active pending counter switch request for current staff
// @route   GET /api/staff/counter-switch-request
// @access  Private (Staff, Admin)
const getMyPendingCounterSwitchRequest = async (req, res) => {
  try {
    const staffId = req.user._id;
    const pendingRequest = await CounterSwitchRequest.findOne({
      staff: staffId,
      status: 'pending',
    })
      .populate('targetCounter')
      .populate('currentCounter');

    res.status(200).json({
      success: true,
      data: pendingRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching pending counter switch request',
    });
  }
};

// @desc    Cancel an active pending counter switch request
// @route   DELETE /api/staff/counter-switch-request
// @access  Private (Staff, Admin)
const cancelCounterSwitchRequest = async (req, res) => {
  try {
    const staffId = req.user._id;
    const request = await CounterSwitchRequest.findOne({
      staff: staffId,
      status: 'pending',
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'No pending counter switch request found',
      });
    }

    request.status = 'cancelled';
    await request.save();

    const io = getIO();
    if (io) {
      io.to('role:admin').emit('counter_switch:cancelled', { requestId: request._id, staffId });
    }

    res.status(200).json({
      success: true,
      message: 'Counter switch request cancelled successfully',
      data: request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error cancelling counter switch request',
    });
  }
};

// @desc    Staff register a walk-in customer with official identity document verification and optional queue token
// @route   POST /api/staff/register-customer
// @access  Private (Staff, Admin)
const registerWalkinCustomer = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      documentType,
      documentNumber,
      serviceId,
      notes,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Customer full legal name and email address are required.',
      });
    }

    if (!documentType || documentType === 'none' || !documentNumber) {
      return res.status(400).json({
        success: false,
        message: 'Official identification document type (Passport, National ID, Driver License, etc.) and valid document number are mandatory.',
      });
    }

    // Check if customer exists
    let customer = await User.findOne({ email: email.toLowerCase() });
    if (!customer) {
      const defaultPassword = phone && phone.length >= 6 ? phone : 'Customer@123';
      customer = await User.create({
        name,
        email: email.toLowerCase(),
        password: defaultPassword,
        phone: phone || '',
        role: 'customer',
        documentType,
        documentNumber,
        documentVerifiedBy: req.user._id,
        documentVerifiedAt: new Date(),
      });
    } else {
      customer.documentType = documentType;
      customer.documentNumber = documentNumber;
      customer.documentVerifiedBy = req.user._id;
      customer.documentVerifiedAt = new Date();
      if (phone) customer.phone = phone;
      await customer.save();
    }

    let issuedToken = null;
    let waitStats = null;

    if (serviceId) {
      const service = await Service.findById(serviceId);
      if (service && service.isActive) {
        const updatedService = await Service.findByIdAndUpdate(
          serviceId,
          { $inc: { dailyTokenCounter: 1 } },
          { new: true }
        );
        const sequenceNum = updatedService.dailyTokenCounter;
        const tokenNumber = `${service.prefix}${String(sequenceNum).padStart(3, '0')}`;
        waitStats = await calculateWaitTime(serviceId);

        issuedToken = await Token.create({
          tokenNumber,
          sequenceNumber: sequenceNum,
          service: serviceId,
          customer: customer._id,
          status: 'waiting',
          joinedAt: new Date(),
          estimatedWaitTime: waitStats.estimatedMinutes,
          notes: notes || `Registered by staff ${req.user.name} with verified official doc (${documentType.toUpperCase()}: ${documentNumber})`,
        });

        await QueueLog.create({
          token: issuedToken._id,
          action: 'created',
          performedBy: req.user._id,
          details: `Walk-in customer ${name} verified with ${documentType.toUpperCase()} (${documentNumber}) and issued token ${tokenNumber}`,
        });

        const notification = await notificationClient.dispatchNotification({
          recipient: customer._id,
          title: 'Official Document Verified & Token Issued',
          message: `Official document (${documentType.toUpperCase()}: ${documentNumber}) verified by staff. Your token ${tokenNumber} has been issued.`,
          type: 'success',
          token: issuedToken._id,
        });

        await cacheService.invalidateServiceQueue(serviceId);
        emitQueueUpdate(serviceId, {
          serviceId,
          action: 'token_joined',
          tokenNumber,
        });
        emitNotification(customer._id, notification);
      }
    }

    res.status(201).json({
      success: true,
      message: `Customer ${customer.name} registered and verified with official document (${documentType.toUpperCase()}) successfully.`,
      data: {
        customer: {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          documentType: customer.documentType,
          documentNumber: customer.documentNumber,
          documentVerifiedAt: customer.documentVerifiedAt,
        },
        token: issuedToken,
        queuePosition: waitStats ? waitStats.aheadCount + 1 : null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error registering walk-in customer with official documents',
    });
  }
};

module.exports = {
  getStaffDashboard,
  callNextToken,
  startService,
  completeService,
  skipToken,
  recallToken,
  setCounterStatus,
  registerWalkinCustomer,
  requestCounterSwitch,
  getMyPendingCounterSwitchRequest,
  cancelCounterSwitchRequest,
};
