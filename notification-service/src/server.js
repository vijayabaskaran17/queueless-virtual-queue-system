require('dotenv').config();
process.env.TZ = process.env.TZ || 'Asia/Kolkata';
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5001;

// Connect to MongoDB
connectDB();

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(` 🔔 QueueLess Notification Microservice Running`);
  console.log(` Port: ${PORT}`);
  console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(` URL: http://localhost:${PORT}`);
  console.log(` Inter-Service Endpoint: POST /api/notifications/dispatch`);
  console.log(`=======================================================`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`[Notification Service Warning]: ${err.message}`);
});
