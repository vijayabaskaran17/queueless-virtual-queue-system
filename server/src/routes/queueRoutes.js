const express = require('express');
const router = express.Router();
const {
  getServices,
  joinQueue,
  getMyActiveToken,
  getMyTokenHistory,
  cancelToken,
} = require('../controllers/queueController');
const { protect } = require('../middleware/authMiddleware');

// Public route to view services and live queue lengths
router.get('/services', getServices);

// Protected customer routes
router.post('/join', protect, joinQueue);
router.post('/token', protect, joinQueue); // REST alias
router.get('/my-active', protect, getMyActiveToken);
router.get('/my-token', protect, getMyActiveToken); // REST alias
router.get('/my-history', protect, getMyTokenHistory);
router.put('/cancel/:id', protect, cancelToken);

module.exports = router;
