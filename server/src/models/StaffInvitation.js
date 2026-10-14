const mongoose = require('mongoose');

const staffInvitationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Please provide an email for the invitation'],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Invitation must be associated with a verified organization'],
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'InvitedBy admin reference is required'],
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['staff'],
      default: 'staff',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired', 'revoked'],
      default: 'pending',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    suggestedEmployeeId: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Helper method to check validity
staffInvitationSchema.methods.isValid = function () {
  if (this.status !== 'pending') return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  return true;
};

module.exports = mongoose.model('StaffInvitation', staffInvitationSchema);
