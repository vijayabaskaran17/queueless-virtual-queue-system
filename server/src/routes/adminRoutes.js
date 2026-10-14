const express = require('express');
const router = express.Router();
const {
  getAnalytics,
  getUsers,
  updateUser,
  createService,
  updateService,
  getCounters,
  createCounter,
  updateCounter,
  getQueueLogs,
  getQueueSettings,
  updateQueueSettings,
  getStaffInvitations,
  createStaffInvitation,
  revokeStaffInvitation,
  getOrganizationDetails,
  getCounterSwitchRequests,
  approveCounterSwitchRequest,
  rejectCounterSwitchRequest,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(protect);

// Allow staff to view counters list as well
router.get('/counters', authorizeRoles('admin', 'staff'), getCounters);

// Admin-only management endpoints
router.use(authorizeRoles('admin'));

router.get('/analytics', getAnalytics);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.post('/services', createService);
router.put('/services/:id', updateService);
router.post('/counters', createCounter);
router.put('/counters/:id', updateCounter);
router.get('/logs', getQueueLogs);
router.get('/settings', getQueueSettings);
router.put('/settings', updateQueueSettings);

// Counter Switch Requests (Staff -> Admin Approval)
router.get('/counter-switch-requests', getCounterSwitchRequests);
router.post('/counter-switch-requests/:id/approve', approveCounterSwitchRequest);
router.put('/counter-switch-requests/:id/approve', approveCounterSwitchRequest); // REST PUT alias
router.post('/counter-switch-requests/:id/reject', rejectCounterSwitchRequest);
router.put('/counter-switch-requests/:id/reject', rejectCounterSwitchRequest); // REST PUT alias

// Organization Staff Invitations
router.get('/invitations', getStaffInvitations);
router.post('/invitations', createStaffInvitation);
router.delete('/invitations/:id', revokeStaffInvitation);
router.get('/organization', getOrganizationDetails);

module.exports = router;
