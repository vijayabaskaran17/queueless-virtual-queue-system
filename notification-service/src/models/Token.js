const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema(
  {
    tokenNumber: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['waiting', 'called', 'in_progress', 'completed', 'skipped', 'cancelled'],
      default: 'waiting',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Token || mongoose.model('Token', tokenSchema);
