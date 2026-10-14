require('dotenv').config();
process.env.TZ = process.env.TZ || 'Asia/Kolkata';
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const initSocketHandler = require('./sockets/socketHandler');
const { initSocketEmitter } = require('./sockets/socketEmitter');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas / Local MongoDB
connectDB().then(async (connected) => {
  if (connected) {
    try {
      const User = require('./models/User');
      const count = await User.countDocuments();
      if (count === 0) {
        console.log('[QueueLess Server] Fresh deployment detected with empty database. Seeding initial accounts & counters...');
        const seedData = require('./scripts/seed');
        await seedData(true);
      }
    } catch (seedErr) {
      console.warn('[QueueLess Server] Startup auto-seed notice:', seedErr.message);
    }
  }
});

const server = http.createServer(app);

// Initialize Socket.IO
// Initialize Socket.IO with flexible CORS for Render & local dev
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed = (process.env.CLIENT_URL || 'http://localhost:5173')
        .split(',')
        .map((o) => o.trim());
      if (
        allowed.includes('*') ||
        allowed.includes(origin) ||
        origin.endsWith('.onrender.com') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Setup Socket.IO emitter and connection handlers
initSocketEmitter(io);
initSocketHandler(io);

server.listen(PORT, () => {
  console.log(`[QueueLess Server] Running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
});
