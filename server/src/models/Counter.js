const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema(
  {
    counterNumber: {
      type: Number,
      required: [true, 'Please provide counter number'],
      unique: true,
      min: 1,
    },
    name: {
      type: String,
      required: [true, 'Please provide counter name'],
      trim: true,
      default: function () {
        return `Counter ${this.counterNumber}`;
      },
    },
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    supportedServices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
      },
    ],
    status: {
      type: String,
      enum: ['open', 'closed', 'break'],
      default: 'open',
    },
    currentServingToken: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Token',
      default: null,
    },
    totalServedToday: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Counter', counterSchema);
