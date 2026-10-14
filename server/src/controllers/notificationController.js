const Notification = require('../models/Notification');
const notificationClient = require('../services/notificationClient');

// @desc    Get current user notifications (Proxied to Notification Microservice via REST)
// @route   GET /api/notifications
// @access  Private
const getMyNotifications = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const remoteData = await notificationClient.fetchUserNotifications(authHeader);
      if (remoteData) {
        return res.status(200).json(remoteData);
      }
    }

    // Fallback: Query local database
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
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const remoteData = await notificationClient.markNotificationRead(req.params.id, authHeader);
      if (remoteData) {
        return res.status(200).json(remoteData);
      }
    }

    // Fallback: Local database update
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(200).json({
      success: true,
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
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const remoteData = await notificationClient.markAllNotificationsRead(authHeader);
      if (remoteData) {
        return res.status(200).json(remoteData);
      }
    }

    // Fallback: Local database update
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error marking all read',
    });
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
};
