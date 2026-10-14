const mongoose = require('mongoose');

const counterSwitchRequestSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    currentCounter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Counter',
      default: null,
    },
    targetCounter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Counter',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
    adminFeedback: {
      type: String,
      trim: true,
      default: '',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CounterSwitchRequest', counterSwitchRequestSchema);
