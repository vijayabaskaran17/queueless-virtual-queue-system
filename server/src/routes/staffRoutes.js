const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/staffController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// All staff routes require authentication and staff or admin role
router.use(protect);
router.use(authorizeRoles('staff', 'admin'));

router.get('/dashboard', getStaffDashboard);
router.post('/call-next', callNextToken);
router.post('/start-service/:id', startService);
router.post('/complete-service/:id', completeService);
router.post('/skip-token/:id', skipToken);
router.post('/recall-token/:id', recallToken);
router.post('/set-counter', setCounterStatus);
router.post('/register-customer', registerWalkinCustomer);
router.post('/request-counter-switch', requestCounterSwitch);
router.get('/counter-switch-request', getMyPendingCounterSwitchRequest);
router.delete('/counter-switch-request', cancelCounterSwitchRequest);

module.exports = router;
