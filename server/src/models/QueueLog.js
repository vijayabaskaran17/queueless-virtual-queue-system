const mongoose = require('mongoose');

const queueLogSchema = new mongoose.Schema(
  {
    token: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Token',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ['created', 'called', 'started', 'completed', 'skipped', 'recalled', 'cancelled'],
      required: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    counter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Counter',
      default: null,
    },
    details: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('QueueLog', queueLogSchema);
