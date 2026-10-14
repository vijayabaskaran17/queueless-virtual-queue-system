require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const initSocketHandler = require('./sockets/socketHandler');
const { initSocketEmitter } = require('./sockets/socketEmitter');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas / Local MongoDB
connectDB();

const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
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
