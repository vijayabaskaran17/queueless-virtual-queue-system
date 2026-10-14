const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server microservice calls (no origin) and valid browser origins
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/notifications', notificationRoutes);

// Health check endpoints (responds on root, /health, and /api/health)
app.get(['/', '/health', '/api/health'], (req, res) => {
  res.status(200).json({
    status: 'healthy',
    microservice: 'Notification Service',
    port: process.env.PORT || 5001,
    timestamp: new Date().toISOString(),
  });
});

// Centralized error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
