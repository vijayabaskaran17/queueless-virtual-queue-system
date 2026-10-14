const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide service name'],
      trim: true,
      maxlength: 100,
    },
    code: {
      type: String,
      required: [true, 'Please provide service code'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 10,
    },
    prefix: {
      type: String,
      required: [true, 'Please provide token prefix'],
      uppercase: true,
      trim: true,
      maxlength: 5,
      default: 'A',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    avgDuration: {
      type: Number,
      required: [true, 'Please provide average service duration in minutes'],
      default: 10,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    color: {
      type: String,
      default: '#4f46e5',
    },
    icon: {
      type: String,
      default: 'Layers',
    },
    dailyTokenCounter: {
      type: Number,
      default: 0,
    },
    lastCounterReset: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Service', serviceSchema);
