const Notification = require('../models/Notification');
const Token = require('../models/Token');
const User = require('../models/User');
const axios = require('axios');

// @desc    Dispatch notification (Inter-Service REST API called by Queue Service)
// @route   POST /api/notifications/dispatch
// @access  Internal / Public
const dispatchNotification = async (req, res) => {
  try {
    const { recipient, title, message, type, token, metadata, channels } = req.body;

    if (!recipient || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Recipient, title, and message are required fields',
      });
    }

    // Determine delivery channels (in-app, sms, email)
    const selectedChannels = channels || ['in-app'];
    if (type === 'called') {
      if (!selectedChannels.includes('sms')) selectedChannels.push('sms');
    }

    // Save notification in database
    const notification = await Notification.create({
      recipient,
      title,
      message,
      type: type || 'info',
      token: token || null,
      channels: selectedChannels,
      deliveryStatus: 'delivered',
      metadata: metadata || {},
    });

    console.log(`[Notification Service] Dispatched "${title}" to recipient ${recipient} via [${selectedChannels.join(', ')}]`);

    res.status(201).json({
      success: true,
      service: 'Notification Microservice',
      message: 'Notification dispatched and recorded successfully',
      data: notification,
    });
  } catch (error) {
    console.error(`[Notification Service] Dispatch Error:`, error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Error dispatching notification',
    });
  }
};

// @desc    Get current user notifications
// @route   GET /api/notifications
// @access  Private (JWT protected)
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('token', 'tokenNumber status');

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      service: 'Notification Microservice',
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching notifications',
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or access denied',
      });
    }

    res.status(200).json({
      success: true,
      service: 'Notification Microservice',
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error marking notification read',
    });
  }
};

// @desc    Mark all user notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      service: 'Notification Microservice',
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error marking all read',
    });
  }
};

// @desc    Delete notification (CRUD Delete)
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or access denied',
      });
    }

    res.status(200).json({
      success: true,
      service: 'Notification Microservice',
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting notification',
    });
  }
};

// @desc    Get notification delivery analytics
// @route   GET /api/notifications/analytics
// @access  Public / Internal
const getAnalytics = async (req, res) => {
  try {
    const total = await Notification.countDocuments();
    const unread = await Notification.countDocuments({ isRead: false });
    const delivered = await Notification.countDocuments({ deliveryStatus: 'delivered' });

    const byType = await Notification.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      service: 'Notification Microservice',
      analytics: {
        totalDispatched: total,
        unreadCount: unread,
        readCount: total - unread,
        deliveredCount: delivered,
        deliveryRate: total > 0 ? `${((delivered / total) * 100).toFixed(1)}%` : '100%',
        distributionByType: byType,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error calculating analytics',
    });
  }
};

// @desc    Check health & Inter-Service Connectivity with Queue Service
// @route   GET /api/notifications/health
// @access  Public
const getHealth = async (req, res) => {
  let queueServiceStatus = 'unreachable';
  const queueServiceUrl = process.env.QUEUE_SERVICE_URL || 'http://localhost:5000';

  try {
    const response = await axios.get(`${queueServiceUrl}/api/health`, { timeout: 3000 });
    if (response.status === 200) {
      queueServiceStatus = 'connected';
    }
  } catch (err) {
    queueServiceStatus = `error: ${err.message}`;
  }

  res.status(200).json({
    service: 'Notification Microservice',
    status: 'healthy',
    port: process.env.PORT || 5001,
    interServiceConnectivity: {
      target: 'Queue Service',
      targetUrl: queueServiceUrl,
      status: queueServiceStatus,
    },
    timestamp: new Date().toISOString(),
  });
};

// @desc    Get service metadata & API capabilities
// @route   GET /api/notifications/info
// @access  Public
const getServiceInfo = (req, res) => {
  res.status(200).json({
    service: 'Notification Microservice',
    version: '1.0.0',
    description: 'Handles cross-channel dispatch, queue alerts, and notification history',
    capabilities: [
      'In-App Notification Dispatch',
      'SMS Simulation',
      'Email Simulation',
      'Read / Unread State Management',
      'Inter-service REST Communication via Axios',
    ],
    endpoints: [
      'POST /api/notifications/dispatch (Inter-Service)',
      'GET /api/notifications (User Notifications)',
      'PUT /api/notifications/:id/read',
      'PUT /api/notifications/read-all',
      'DELETE /api/notifications/:id',
      'GET /api/notifications/analytics',
      'GET /api/notifications/health',
    ],
  });
};

module.exports = {
  dispatchNotification,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getAnalytics,
  getHealth,
  getServiceInfo,
};
