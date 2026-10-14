const jwt = require('jsonwebtoken');
const User = require('../models/User');
const StaffInvitation = require('../models/StaffInvitation');
const Organization = require('../models/Organization');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'queueless_jwt_secret_production_key_2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @desc    Verify a single-use staff invitation token
// @route   GET /api/auth/invitations/verify/:token
// @access  Public
const verifyStaffInvitation = async (req, res) => {
  try {
    let rawToken = req.params.token || req.params[0] || req.query.token || req.query.invitation;

    // Check if the originalUrl has invitation or token query param or path
    if (!rawToken || rawToken.includes('http') || rawToken.includes('/')) {
      const urlMatch = req.originalUrl.match(/(?:invitation|token)=([a-zA-Z0-9_-]+)/i);
      if (urlMatch) {
        rawToken = urlMatch[1];
      }
    }

    if (!rawToken) {
      return res.status(400).json({
        success: false,
        errorType: 'MISSING_TOKEN',
        message: 'Invitation token is required',
      });
    }

    let token = String(rawToken).trim();
    if (token.includes('invitation=') || token.includes('token=')) {
      const match = token.match(/(?:invitation|token)=([a-zA-Z0-9_-]+)/i);
      if (match) token = match[1];
    }
    token = token.replace(/^[/#?]+|[/#?]+$/g, '').trim();

    const invitation = await StaffInvitation.findOne({ token })
      .populate('organization', 'name code description status requireEmployeeId')
      .populate('invitedBy', 'name email');

    if (!invitation) {
      return res.status(404).json({
        success: false,
        errorType: 'INVALID',
        message: 'This staff invitation link is invalid or could not be found.',
      });
    }

    if (invitation.status === 'accepted') {
      return res.status(400).json({
        success: false,
        errorType: 'ALREADY_USED',
        message: 'This staff invitation has already been accepted and used to activate an account. Please sign in instead.',
      });
    }

    if (invitation.status === 'revoked') {
      return res.status(400).json({
        success: false,
        errorType: 'REVOKED',
        message: 'This staff invitation has been revoked by the organization administrator.',
      });
    }

    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(400).json({
        success: false,
        errorType: 'EXPIRED',
        message: `This staff invitation expired on ${new Date(invitation.expiresAt).toLocaleDateString()}. Please request a new invitation from your administrator.`,
      });
    }

    if (!invitation.organization || invitation.organization.status !== 'verified') {
      return res.status(400).json({
        success: false,
        errorType: 'ORG_SUSPENDED',
        message: 'The organization associated with this invitation is currently suspended or unverified.',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        token: invitation.token,
        email: invitation.email,
        role: invitation.role,
        notes: invitation.notes,
        suggestedEmployeeId: invitation.suggestedEmployeeId,
        expiresAt: invitation.expiresAt,
        organization: {
          id: invitation.organization._id,
          name: invitation.organization.name,
          code: invitation.organization.code,
          requireEmployeeId: invitation.organization.requireEmployeeId,
        },
        invitedBy: invitation.invitedBy?.name || 'Administrator',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error validating staff invitation',
    });
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role,
      invitationToken,
      employeeId,
      documentType,
      documentNumber,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    const lowerEmail = email.toLowerCase().trim();

    const userExists = await User.findOne({ email: lowerEmail });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in.',
      });
    }

    // Strict Security & Permission Enforcement (Requirement 9: Never allow public users to self-assign staff or admin)
    if (role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Security Clearance Error: Administrator accounts cannot be self-registered.',
      });
    }

    let assignedRole = 'customer';
    let assignedOrganization = null;
    let validatedInvitation = null;

    if (role === 'staff') {
      if (!invitationToken) {
        return res.status(403).json({
          success: false,
          errorType: 'INVITATION_REQUIRED',
          message: 'Access Denied: Staff accounts require a verified single-use invitation from an authorized organization administrator.',
        });
      }

      let cleanToken = String(invitationToken).trim();
      const match = cleanToken.match(/(?:invitation|token)=([a-zA-Z0-9_-]+)/i);
      if (match) cleanToken = match[1];
      cleanToken = cleanToken.replace(/^[/#?]+|[/#?]+$/g, '').trim();

      validatedInvitation = await StaffInvitation.findOne({ token: cleanToken })
        .populate('organization');

      if (!validatedInvitation) {
        return res.status(404).json({
          success: false,
          errorType: 'INVALID',
          message: 'This staff invitation link is invalid or could not be found.',
        });
      }

      if (validatedInvitation.status === 'accepted') {
        return res.status(400).json({
          success: false,
          errorType: 'ALREADY_USED',
          message: 'This staff invitation has already been accepted and used to activate an account.',
        });
      }

      if (validatedInvitation.status === 'revoked') {
        return res.status(400).json({
          success: false,
          errorType: 'REVOKED',
          message: 'This staff invitation has been revoked by the organization administrator.',
        });
      }

      if (validatedInvitation.expiresAt && validatedInvitation.expiresAt < new Date()) {
        validatedInvitation.status = 'expired';
        await validatedInvitation.save();
        return res.status(400).json({
          success: false,
          errorType: 'EXPIRED',
          message: 'This staff invitation link has expired. Please request a new invitation.',
        });
      }

      // Requirement 1: Allow the email address specified in a valid staff invitation
      if (validatedInvitation.email.toLowerCase() !== lowerEmail) {
        return res.status(400).json({
          success: false,
          message: `This invitation was issued specifically for ${validatedInvitation.email}. You cannot activate it with ${lowerEmail}.`,
        });
      }

      // Check organization policy on employee ID
      if (validatedInvitation.organization?.requireEmployeeId && !employeeId) {
        return res.status(400).json({
          success: false,
          message: 'Your organization requires an Employee ID for staff activation.',
        });
      }

      assignedRole = 'staff';
      assignedOrganization = validatedInvitation.organization?._id;
    }

    const user = await User.create({
      name,
      email: lowerEmail,
      password,
      phone: phone || '',
      role: assignedRole,
      organization: assignedOrganization,
      employeeId: employeeId || validatedInvitation?.suggestedEmployeeId || '',
      invitation: validatedInvitation ? validatedInvitation._id : null,
      documentType: documentType || 'none',
      documentNumber: documentNumber || '',
    });

    // Atomically mark invitation as accepted
    if (validatedInvitation) {
      validatedInvitation.status = 'accepted';
      validatedInvitation.acceptedAt = new Date();
      validatedInvitation.acceptedBy = user._id;
      await validatedInvitation.save();
    }

    const token = generateToken(user._id);

    const populatedUser = await User.findById(user._id)
      .populate('organization', 'name code')
      .populate('assignedCounter');

    res.status(201).json({
      success: true,
      token,
      user: {
        id: populatedUser._id,
        name: populatedUser.name,
        email: populatedUser.email,
        role: populatedUser.role,
        phone: populatedUser.phone,
        organization: populatedUser.organization,
        employeeId: populatedUser.employeeId,
        assignedCounter: populatedUser.assignedCounter,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration',
    });
  }
};

// @desc    Login user & get token with role-specific security & validation
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password, role: portalRole } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address format',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate('assignedCounter')
      .populate('organization', 'name code');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. No registered account matches this email.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact administration.',
      });
    }

    // Role-specific validation & security barriers
    if (portalRole) {
      if (portalRole === 'customer') {
        if (user.role !== 'customer') {
          return res.status(403).json({
            success: false,
            message: `Notice: This account has '${user.role}' privileges. Please sign in via the ${user.role.toUpperCase()} portal.`,
          });
        }
      } else if (portalRole === 'staff') {
        // Staff portal security validation: Strictly allow ONLY staff accounts
        if (user.role !== 'staff') {
          return res.status(403).json({
            success: false,
            message: 'Access Denied: Staff clearance required. Administrator accounts must authenticate via the Executive Administration portal.',
          });
        }
      } else if (portalRole === 'admin') {
        // Administrator portal security validation
        if (user.role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Access Denied: High-level Administrator clearance required. Unauthorized login attempts are logged for security compliance.',
          });
        }
      }
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        organization: user.organization,
        employeeId: user.employeeId,
        assignedCounter: user.assignedCounter,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login',
    });
  }
};

// @desc    Get currently authenticated user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('assignedCounter')
      .populate('organization', 'name code');

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        organization: user.organization,
        employeeId: user.employeeId,
        assignedCounter: user.assignedCounter,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching user profile',
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, phone, password, employeeId } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (employeeId !== undefined) user.employeeId = employeeId;
    if (password) user.password = password;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        employeeId: user.employeeId,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating profile',
    });
  }
};

module.exports = {
  verifyStaffInvitation,
  register,
  login,
  getMe,
  updateProfile,
};
