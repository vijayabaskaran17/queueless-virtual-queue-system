const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
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

// Root health check
app.get('/api/health', (req, res) => {
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
