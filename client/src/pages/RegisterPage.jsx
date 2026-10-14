import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Layers3,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  AlertCircle,
  Monitor,
  FileCheck2,
  ShieldCheck,
  Building2,
  KeyRound,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  BadgeCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const invitationFromUrl = queryParams.get('invitation') || queryParams.get('token') || '';
  const initialRole = invitationFromUrl || queryParams.get('role') === 'staff' ? 'staff' : 'customer';

  const [activeRole, setActiveRole] = useState(initialRole);

  // Common fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Customer specific
  const [documentType, setDocumentType] = useState('national_id');
  const [documentNumber, setDocumentNumber] = useState('');

  // Staff invitation specific
  const [invitationToken, setInvitationToken] = useState(invitationFromUrl);
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [invitationData, setInvitationData] = useState(null);
  const [validatingInvitation, setValidatingInvitation] = useState(false);
  const [invitationError, setInvitationError] = useState(null);
  const [employeeId, setEmployeeId] = useState('');

  // Form states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Extract raw token whether user pastes full link, query param, or raw token
  const extractToken = (rawInput) => {
    if (!rawInput) return '';
    let str = rawInput.trim();

    if (
      str.includes('http://') ||
      str.includes('https://') ||
      str.includes('localhost') ||
      str.includes('?') ||
      str.includes('&')
    ) {
      try {
        const urlObj = new URL(str.startsWith('http') ? str : `http://${str}`);
        const param = urlObj.searchParams.get('invitation') || urlObj.searchParams.get('token');
        if (param) return param.trim();
      } catch {
        // ignore URL parsing error
      }
    }

    const matchParam = str.match(/(?:invitation|token)=([a-zA-Z0-9_-]+)/i);
    if (matchParam) {
      return matchParam[1].trim();
    }

    if (str.includes('/')) {
      const parts = str.split('/').filter(Boolean);
      const lastPart = parts[parts.length - 1];
      if (lastPart) {
        const subMatch = lastPart.match(/(?:invitation|token)=([a-zA-Z0-9_-]+)/i);
        if (subMatch) return subMatch[1].trim();
        return lastPart.trim();
      }
    }

    return str.trim();
  };

  // Function to verify an invitation token
  const verifyToken = async (tokenToVerify) => {
    const cleanToken = extractToken(tokenToVerify);
    if (!cleanToken) return;
    setValidatingInvitation(true);
    setInvitationError(null);
    setError('');

    try {
      const res = await api.get(`/auth/invitations/verify/${encodeURIComponent(cleanToken)}`);
      if (res.data.success) {
        const inv = res.data.data;
        setInvitationData(inv);
        setInvitationToken(cleanToken);
        setManualTokenInput(cleanToken);
        setEmail(inv.email);
        if (inv.suggestedEmployeeId) {
          setEmployeeId(inv.suggestedEmployeeId);
        }
      }
    } catch (err) {
      setInvitationData(null);
      const errRes = err.response?.data;
      setInvitationError({
        type: errRes?.errorType || 'ERROR',
        message: errRes?.message || 'Invalid or expired staff invitation link.',
      });
    } finally {
      setValidatingInvitation(false);
    }
  };

  // Auto-verify token from URL on mount or URL change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlToken = params.get('invitation') || params.get('token');
    const roleParam = params.get('role');

    if (urlToken) {
      setActiveRole('staff');
      const cleanToken = extractToken(urlToken);
      setInvitationToken(cleanToken);
      setManualTokenInput(cleanToken);
      verifyToken(cleanToken);
    } else if (roleParam === 'staff') {
      setActiveRole('staff');
    } else if (roleParam === 'customer') {
      setActiveRole('customer');
    }
  }, [location.search]);

  const handleRoleSwitch = (newRole) => {
    setActiveRole(newRole);
    setError('');
    navigate(`?role=${newRole}`, { replace: true });
  };

  const handleManualTokenSubmit = (e) => {
    e.preventDefault();
    if (!manualTokenInput.trim()) return;
    const cleanToken = extractToken(manualTokenInput);
    verifyToken(cleanToken);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      if (activeRole === 'staff') {
        if (!invitationToken || !invitationData) {
          setError('A verified organization invitation is required to activate a staff account.');
          setLoading(false);
          return;
        }

        if (invitationData.organization?.requireEmployeeId && !employeeId.trim()) {
          setError('Your organization requires an Employee ID for staff activation.');
          setLoading(false);
          return;
        }

        await register({
          name: name.trim(),
          email: invitationData.email,
          password,
          phone: phone.trim(),
          role: 'staff',
          invitationToken,
          employeeId: employeeId.trim(),
        });

        navigate('/staff', { replace: true });
      } else {
        // Customer registration flow
        await register({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password,
          phone: phone.trim(),
          role: 'customer',
          documentType,
          documentNumber: documentNumber.trim(),
        });

        navigate('/customer', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-lg space-y-5">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white">
              <Layers3 className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              Queue<span className="text-indigo-600">Less</span>
            </span>
          </Link>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
            Account Registration Gateway
          </h2>
          <p className="text-xs text-slate-500">
            {activeRole === 'staff'
              ? 'Activate your official organization staff account via single-use invitation'
              : 'Create a customer profile to take virtual tokens and track live queues'}
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-subtle grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => handleRoleSwitch('customer')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeRole === 'customer'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Customer Account</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleSwitch('staff')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeRole === 'staff'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Staff Member (Invitation)</span>
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl p-7 sm:p-8 border border-slate-200/90 shadow-premium">
          {/* ================= CUSTOMER REGISTRATION ================= */}
          {activeRole === 'customer' && (
            <>
              <div className="mb-5 p-3.5 rounded-2xl border border-indigo-200 bg-indigo-50/70 text-indigo-950 flex items-start gap-3 text-xs">
                <FileCheck2 className="w-5 h-5 shrink-0 text-indigo-600" />
                <div>
                  <p className="font-extrabold">Customer Digital Pass Verification</p>
                  <p className="text-[11px] mt-0.5 opacity-90 leading-snug">
                    Your account grants real-time mobile queue tracking, dynamic wait time estimates, and instant counter turn notifications.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span className="leading-snug">{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Legal Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Contact Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 019-4488"
                        className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Official Document Type
                    </label>
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="national_id">National ID Card / SSN</option>
                      <option value="passport">Government Passport</option>
                      <option value="driver_license">Driver's License</option>
                      <option value="pan_card">Tax ID / PAN Card</option>
                      <option value="voter_id">Voter Identity Card</option>
                      <option value="none">Register without Document</option>
                    </select>
                  </div>
                </div>

                {documentType !== 'none' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Official Document ID Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. P99210482"
                      className="w-full px-3 py-2.5 text-xs font-mono uppercase border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password (Min 6 Characters) *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-0.5 rounded transition-colors"
                      title={showPassword ? 'Hide password' : 'Show password'}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-slate-500 hover:text-slate-700" />
                      ) : (
                        <Eye className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all mt-3 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25"
                >
                  {loading ? 'Creating Profile...' : (
                    <>
                      <span>Complete Customer Registration</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* ================= STAFF INVITATION REGISTRATION ================= */}
          {activeRole === 'staff' && (
            <div className="space-y-5">
              {/* Token Validating Spinner */}
              {validatingInvitation && (
                <div className="p-8 text-center space-y-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <RefreshCw className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-700">
                    Verifying secure organization invitation...
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Validating cryptographic security token and organization clearance
                  </p>
                </div>
              )}

              {/* Token Verification Error Alert */}
              {!validatingInvitation && invitationError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider">
                        {invitationError.type === 'EXPIRED'
                          ? 'Invitation Expired'
                          : invitationError.type === 'ALREADY_USED'
                          ? 'Invitation Already Used'
                          : invitationError.type === 'REVOKED'
                          ? 'Invitation Revoked'
                          : 'Invalid Invitation Link'}
                      </h4>
                      <p className="text-xs mt-1 leading-snug">{invitationError.message}</p>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setInvitationError(null);
                        setInvitationData(null);
                        setInvitationToken('');
                        setManualTokenInput('');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-50"
                    >
                      Enter Different Token
                    </button>
                    <Link
                      to="/login?role=staff"
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 inline-flex items-center gap-1"
                    >
                      Sign In to Staff Desk &rarr;
                    </Link>
                  </div>
                </div>
              )}

              {/* No Token Provided State: Invite Required Gateway */}
              {!validatingInvitation && !invitationData && !invitationError && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 text-teal-950 flex items-start gap-3 text-xs">
                    <KeyRound className="w-5 h-5 shrink-0 text-teal-600 mt-0.5" />
                    <div>
                      <p className="font-extrabold">Organization Invitation Required</p>
                      <p className="text-[11px] mt-0.5 opacity-90 leading-snug">
                        QueueLess multi-organization architecture requires all staff accounts to be provisioned via an authorized administrator invitation link.
                      </p>
                    </div>
                  </div>

                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-teal-600" />
                      Received an invitation token or link?
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      If you received an invitation token in your work email or chat, enter it below to verify your organization clearance:
                    </p>

                    <form onSubmit={handleManualTokenSubmit} className="space-y-2">
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={manualTokenInput}
                          onChange={(e) => setManualTokenInput(e.target.value)}
                          placeholder="Paste invitation link or token..."
                          className="w-full pl-9 pr-4 py-2.5 text-xs font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-teal-600/20"
                      >
                        <span>Verify & Unlock Staff Form</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  </div>

                  <div className="text-center pt-2">
                    <p className="text-[11px] text-slate-400">
                      Already have an active staff account?{' '}
                      <Link to="/login?role=staff" className="font-bold text-teal-600 hover:underline">
                        Sign in to Staff Operations Console
                      </Link>
                    </p>
                  </div>
                </div>
              )}

              {/* Token Validated: Staff Registration Form */}
              {!validatingInvitation && invitationData && (
                <div className="space-y-4 animate-in fade-in">
                  {/* Verified Organization Header Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 text-teal-950 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-teal-600" />
                        <h3 className="text-sm font-extrabold text-slate-900">
                          {invitationData.organization?.name}
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-teal-600 text-white uppercase tracking-wider">
                        {invitationData.organization?.code}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-teal-900">
                      <span className="inline-flex items-center gap-1 font-semibold text-teal-700">
                        <BadgeCheck className="w-3.5 h-3.5" />
                        Verified Partner Organization
                      </span>
                      <span>•</span>
                      <span>Invited by: <b>{invitationData.invitedBy}</b></span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <Clock className="w-3 h-3" />
                        Expires: {new Date(invitationData.expiresAt).toLocaleDateString()}
                      </span>
                    </div>

                    {invitationData.notes && (
                      <div className="text-[11px] text-teal-800 bg-white/70 px-3 py-1.5 rounded-lg border border-teal-200/50">
                        Role / Designation: <span className="font-semibold">{invitationData.notes}</span>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-in fade-in">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span className="leading-snug">{error}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Full Legal Name *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Rachel Adams"
                          className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Authorized Employee Email Address
                        </label>
                        <span className="text-[10px] text-teal-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Invitation Match Verified
                        </span>
                      </div>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-teal-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          readOnly
                          value={invitationData.email}
                          className="w-full pl-9 pr-4 py-2.5 text-xs font-medium border border-teal-200 rounded-xl bg-teal-50/50 text-slate-800 cursor-not-allowed select-none"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Locked to match the designated recipient of this single-use invitation.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Contact Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+1 (555) 019-4488"
                            className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Employee / Staff ID {invitationData.organization?.requireEmployeeId ? '*' : '(Optional)'}
                        </label>
                        <input
                          type="text"
                          required={invitationData.organization?.requireEmployeeId}
                          value={employeeId}
                          onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                          placeholder="e.g. EMP-9021"
                          className="w-full px-3 py-2.5 text-xs font-mono uppercase border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Password (Min 6 Characters) *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-10 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-0.5 rounded transition-colors"
                          title={showPassword ? 'Hide password' : 'Show password'}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4 text-slate-500 hover:text-slate-700" />
                          ) : (
                            <Eye className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all mt-3 bg-teal-600 hover:bg-teal-700 shadow-teal-600/25"
                    >
                      {loading ? 'Activating Staff Account...' : (
                        <>
                          <span>Activate Account & Join {invitationData.organization?.name}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
            Already have an active account?{' '}
            <Link
              to={`/login?role=${activeRole}`}
              className={`font-bold hover:underline ${
                activeRole === 'staff'
                  ? 'text-teal-600 hover:text-teal-800'
                  : 'text-indigo-600 hover:text-indigo-800'
              }`}
            >
              Sign in to {activeRole === 'staff' ? 'Staff Desk' : 'Customer Portal'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
