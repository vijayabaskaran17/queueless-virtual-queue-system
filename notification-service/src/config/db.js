const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/queueless';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log(`[Notification Service] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    console.error(`[Notification Service] MongoDB Connection Warning: ${error.message}`);
    console.warn('[Notification Service] Service started in resilient mode. Retrying connection...');
    return false;
  }
};

module.exports = connectDB;
