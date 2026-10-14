const mongoose = require('mongoose');

const queueSettingSchema = new mongoose.Schema(
  {
    maxTokensPerCustomerPerDay: {
      type: Number,
      default: 3,
    },
    businessHoursStart: {
      type: String,
      default: '09:00',
    },
    businessHoursEnd: {
      type: String,
      default: '17:00',
    },
    allowCancellation: {
      type: Boolean,
      default: true,
    },
    autoNotifyApproachingThreshold: {
      type: Number,
      default: 3, // Notify when customer is 3rd in queue
    },
    soundAlertsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('QueueSetting', queueSettingSchema);
