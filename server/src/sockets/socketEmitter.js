let ioInstance = null;

const initSocketEmitter = (io) => {
  ioInstance = io;
};

const getIO = () => {
  return ioInstance;
};

// Broadcast queue update to all listeners of a service room and staff/admin
const emitQueueUpdate = (serviceId, payload) => {
  if (!ioInstance) return;
  ioInstance.to(`service:${serviceId}`).emit('queue:updated', payload);
  ioInstance.to('role:staff').emit('queue:updated', payload);
  ioInstance.to('role:admin').emit('queue:updated', payload);
};

// Emit token status change to specific customer
const emitTokenStatusChange = (userId, token) => {
  if (!ioInstance) return;
  ioInstance.to(`user:${userId}`).emit('token:status_changed', token);
};

// Emit notification to user
const emitNotification = (userId, notification) => {
  if (!ioInstance) return;
  ioInstance.to(`user:${userId}`).emit('notification:new', notification);
};

// Emit counter update
const emitCounterUpdate = (counter) => {
  if (!ioInstance) return;
  ioInstance.emit('counter:updated', counter);
};

// Emit admin stats update
const emitAdminStats = (stats) => {
  if (!ioInstance) return;
  ioInstance.to('role:admin').emit('admin:stats_updated', stats);
};

module.exports = {
  initSocketEmitter,
  getIO,
  emitQueueUpdate,
  emitTokenStatusChange,
  emitNotification,
  emitCounterUpdate,
  emitAdminStats,
};
