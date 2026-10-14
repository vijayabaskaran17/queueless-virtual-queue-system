const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide an organization name'],
      trim: true,
      maxlength: 120,
    },
    code: {
      type: String,
      required: [true, 'Please provide an organization code'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 30,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['verified', 'pending', 'suspended'],
      default: 'verified',
    },
    requireEmployeeId: {
      type: Boolean,
      default: false,
    },
    primaryContactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Organization', organizationSchema);
