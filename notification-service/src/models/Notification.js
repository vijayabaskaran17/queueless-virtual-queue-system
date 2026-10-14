const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['info', 'alert', 'success', 'warning', 'called'],
      default: 'info',
    },
    token: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Token',
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    channels: {
      type: [String],
      enum: ['in-app', 'sms', 'email'],
      default: ['in-app'],
    },
    deliveryStatus: {
      type: String,
      enum: ['sent', 'delivered', 'pending', 'failed'],
      default: 'delivered',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
