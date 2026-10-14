const jwt = require('jsonwebtoken');
const User = require('../models/User');

const initSocketHandler = (io) => {
  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        // Allow unauthenticated connection for public display monitors if needed
        socket.user = null;
        return next();
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'queueless_jwt_secret_production_key_2026'
      );
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        socket.user = user;
      }
      next();
    } catch (err) {
      console.warn('[Socket Auth Notice]:', err.message);
      // Proceed without user object rather than terminating socket for viewers
      socket.user = null;
      next();
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    if (user) {
      // Join user's personal room for direct notifications
      socket.join(`user:${user._id.toString()}`);
      // Join role room
      socket.join(`role:${user.role}`);

      if (user.role === 'staff' && user.assignedCounter) {
        socket.join(`counter:${user.assignedCounter.toString()}`);
      }
    }

    // Client joins a specific service room to receive real-time queue position updates
    socket.on('join:service', (serviceId) => {
      if (serviceId) {
        socket.join(`service:${serviceId}`);
      }
    });

    socket.on('leave:service', (serviceId) => {
      if (serviceId) {
        socket.leave(`service:${serviceId}`);
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });
};

module.exports = initSocketHandler;
