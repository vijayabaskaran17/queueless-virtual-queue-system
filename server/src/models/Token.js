const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema(
  {
    tokenNumber: {
      type: String,
      required: true,
      index: true,
    },
    sequenceNumber: {
      type: Number,
      required: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['waiting', 'called', 'in_progress', 'completed', 'skipped', 'cancelled'],
      default: 'waiting',
      index: true,
    },
    counter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Counter',
      default: null,
    },
    servedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    calledAt: {
      type: Date,
      default: null,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    skippedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    estimatedWaitTime: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
    recalledCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to help fast lookup of today's active tokens for a user or service
tokenSchema.index({ customer: 1, status: 1 });
tokenSchema.index({ service: 1, status: 1, joinedAt: 1 });

module.exports = mongoose.model('Token', tokenSchema);
