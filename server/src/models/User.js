const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['customer', 'staff', 'admin'],
      default: 'customer',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    assignedCounter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Counter',
      default: null,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
    },
    employeeId: {
      type: String,
      trim: true,
      default: '',
    },
    invitation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StaffInvitation',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    documentType: {
      type: String,
      enum: [
        'employee_badge',
        'passport',
        'national_id',
        'driver_license',
        'pan_card',
        'voter_id',
        'other',
        'none',
      ],
      default: 'none',
    },
    documentNumber: {
      type: String,
      trim: true,
      default: '',
    },
    documentVerifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    documentVerifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
