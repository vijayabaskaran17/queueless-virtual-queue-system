import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Layers3,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  User,
  Monitor,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Read role from query param ?role=staff or ?role=admin
  const queryParams = new URLSearchParams(location.search);
  const initialRole = queryParams.get('role');
  const validInitialRole = ['customer', 'staff', 'admin'].includes(initialRole)
    ? initialRole
    : 'customer';

  const [activeRole, setActiveRole] = useState(validInitialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sync role tab when URL query changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const r = params.get('role');
    if (['customer', 'staff', 'admin'].includes(r) && r !== activeRole) {
      setActiveRole(r);
      setError('');
    }
  }, [location.search]);

  // Helper to switch tab and update URL
  const handleRoleChange = (newRole) => {
    setActiveRole(newRole);
    setError('');
    navigate(`?role=${newRole}`, { replace: true });
  };

  // Auto redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      const map = { customer: '/customer', staff: '/staff', admin: '/admin' };
      navigate(map[user.role] || '/customer', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const roleMeta = {
    customer: {
      title: 'Customer Portal',
      subtitle: 'Self-service digital token tracking & queue entry',
      icon: User,
      badge: 'Public Clearance',
      accentColor: 'indigo',
      btnBg: 'bg-indigo-600 hover:bg-indigo-700',
      activeTab: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30',
      tag: 'Customer Session',
      notice: 'Requires registered customer account. Internal enterprise staff or administrative domains are restricted.',
      placeholder: 'client@gmail.com',
    },
    staff: {
      title: 'Staff Operations Console',
      subtitle: 'Counter desk verification & token processing',
      icon: Monitor,
      badge: 'Staff Clearance',
      accentColor: 'teal',
      btnBg: 'bg-teal-600 hover:bg-teal-700',
      activeTab: 'bg-teal-600 text-white shadow-md shadow-teal-600/30',
      tag: 'Operator Session',
      notice: 'Authorized Organization Staff: Authenticate using your verified employee email credentials.',
      placeholder: 'staff@organization.com',
    },
    admin: {
      title: 'Executive Administration',
      subtitle: 'Branch telemetry, service catalog & audit security',
      icon: ShieldCheck,
      badge: 'Level 1 Clearance',
      accentColor: 'violet',
      btnBg: 'bg-violet-600 hover:bg-violet-700',
      activeTab: 'bg-violet-600 text-white shadow-md shadow-violet-600/30',
      tag: 'Admin Root Session',
      notice: 'Mandatory Domain Policy: Administrators must authenticate exclusively using @queless.admin.com.',
      placeholder: 'admin@queless.admin.com',
    },
  };

  const currentMeta = roleMeta[activeRole];
  const CurrentIcon = currentMeta.icon;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!email || !password) {
      setError('Please provide both email address and password');
      return;
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address format (e.g. name@domain.com)');
      return;
    }

    if (password.length < 6) {
      setError('Password must contain at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Pass the active portal role to enforce strict role separation
      const loggedInUser = await login(email, password, activeRole);
      const roleMap = {
        customer: '/customer',
        staff: '/staff',
        admin: '/admin',
      };
      navigate(roleMap[loggedInUser.role] || '/customer', { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Authentication failed. Please verify credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
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
            Role-Based Authentication Gateway
          </h2>
          <p className="text-xs text-slate-500">
            Select your assigned portal to enforce authorized security clearance
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-subtle grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => handleRoleChange('customer')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeRole === 'customer'
                ? roleMeta.customer.activeTab
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Customer</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange('staff')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeRole === 'staff'
                ? roleMeta.staff.activeTab
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Staff Desk</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange('admin')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeRole === 'admin'
                ? roleMeta.admin.activeTab
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Administrator</span>
          </button>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-7 sm:p-8 border border-slate-200/90 shadow-premium">
          {/* Active Portal Banner */}
          <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-xs text-slate-800">
              <CurrentIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-extrabold text-slate-900">{currentMeta.title}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700 uppercase tracking-wider">
                  {currentMeta.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{currentMeta.notice}</p>
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
                {activeRole === 'customer'
                  ? 'Customer Email Address'
                  : activeRole === 'staff'
                  ? 'Staff Employee Email'
                  : 'Administrator Corporate Email'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={currentMeta.placeholder}
                  className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password Verification
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all mt-3 ${currentMeta.btnBg}`}
            >
              {loading ? (
                <span>Validating {currentMeta.tag}...</span>
              ) : (
                <>
                  <span>Authenticate to {currentMeta.title}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {activeRole === 'customer' && (
            <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
              New customer without an account?{' '}
              <Link to="/register?role=customer" className="font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2">
                Register for queue tokens
              </Link>
            </div>
          )}

          {activeRole === 'staff' && (
            <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-2">
              <div className="text-xs text-slate-700">
                Have a staff invitation link?{' '}
                <Link
                  to="/register?role=staff"
                  className="font-bold text-teal-600 hover:text-teal-800 underline underline-offset-2 inline-flex items-center gap-1"
                >
                  <span>Activate Staff Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <p className="text-[11px] text-slate-400">
                Staff accounts require an official invitation from your organization administrator.
              </p>
            </div>
          )}

          {activeRole === 'admin' && (
            <div className="mt-6 pt-5 border-t border-slate-100 text-center text-[11px] text-slate-400">
              Internal Branch Security: Access is monitored under audit protocol. Executive administrator accounts must be provisioned through system administration.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
