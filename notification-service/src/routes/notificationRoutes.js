const express = require('express');
const router = express.Router();
const {
  dispatchNotification,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getAnalytics,
  getHealth,
  getServiceInfo,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// Public & Inter-Service routes
router.get('/health', getHealth);
router.get('/info', getServiceInfo);
router.get('/analytics', getAnalytics);
router.post('/dispatch', dispatchNotification); // Called by Queue Service via REST

// User authenticated routes
router.get('/', protect, getMyNotifications);
router.put('/:id/read', protect, markAsRead);
router.put('/read-all', protect, markAllAsRead);
router.delete('/:id', protect, deleteNotification);

module.exports = router;
