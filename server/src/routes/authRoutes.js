const express = require('express');
const router = express.Router();
const {
  verifyStaffInvitation,
  register,
  login,
  getMe,
  updateProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public endpoints
router.get(['/invitations/verify', '/invitations/verify/:token', '/invitations/verify/*'], verifyStaffInvitation);
router.post('/register', register);
router.post('/login', login);

// Protected endpoints
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;
