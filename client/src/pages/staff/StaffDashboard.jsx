import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PhoneCall,
  Play,
  CheckCircle,
  SkipForward,
  RotateCcw,
  Users,
  Clock,
  Layers,
  Monitor,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  UserPlus,
  FileCheck2,
} from 'lucide-react';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import Modal from '../../components/Modal';

const StaffDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [completeNotes, setCompleteNotes] = useState('');
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [walkinModalOpen, setWalkinModalOpen] = useState(false);
  const [walkinSubmitting, setWalkinSubmitting] = useState(false);
  const [walkinError, setWalkinError] = useState('');
  const [walkinForm, setWalkinForm] = useState({
    name: '',
    email: '',
    phone: '',
    documentType: 'national_id',
    documentNumber: '',
    serviceId: '',
    notes: '',
  });
  const [feedbackMsg, setFeedbackMsg] = useState({ text: '', type: '' });

  const fetchDashboard = async () => {
    try {
      const [res, svcRes] = await Promise.all([
        api.get('/staff/dashboard'),
        api.get('/queue/services'),
      ]);
      if (res.data.success) {
        setDashboardData(res.data.data);
      }
      if (svcRes.data.success) {
        setServices(svcRes.data.data);
      }
    } catch (err) {
      console.warn('Staff dashboard fetch notice:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterWalkin = async (e) => {
    e.preventDefault();
    setWalkinError('');

    if (!walkinForm.name || !walkinForm.email) {
      setWalkinError('Full legal name and email address are required.');
      return;
    }

    if (!walkinForm.documentNumber) {
      setWalkinError('Please enter the official identification document number.');
      return;
    }

    setWalkinSubmitting(true);
    try {
      const res = await api.post('/staff/register-customer', walkinForm);
      if (res.data.success) {
        const tokenMsg = res.data.data?.token
          ? ` and issued Token #${res.data.data.token.tokenNumber}`
          : '';
        showFeedback(
          `Customer ${walkinForm.name} verified with ${walkinForm.documentType.toUpperCase()}${tokenMsg}!`
        );
        setWalkinModalOpen(false);
        setWalkinForm({
          name: '',
          email: '',
          phone: '',
          documentType: 'national_id',
          documentNumber: '',
          serviceId: '',
          notes: '',
        });
        await fetchDashboard();
      }
    } catch (err) {
      setWalkinError(err.response?.data?.message || 'Error registering customer with documents');
    } finally {
      setWalkinSubmitting(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Socket real-time sync
  useEffect(() => {
    if (!socket) return;

    const handleQueueSync = () => {
      fetchDashboard();
    };

    socket.on('queue:updated', handleQueueSync);
    socket.on('counter:updated', handleQueueSync);
    socket.on('token:status_changed', handleQueueSync);

    return () => {
      socket.off('queue:updated', handleQueueSync);
      socket.off('counter:updated', handleQueueSync);
      socket.off('token:status_changed', handleQueueSync);
    };
  }, [socket]);

  const showFeedback = (text, type = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg({ text: '', type: '' }), 4000);
  };

  // Actions
  const handleCallNext = async (specificTokenId = null) => {
    setActionLoading(true);
    try {
      const res = await api.post('/staff/call-next', {
        counterId: dashboardData?.counter?._id,
        specificTokenId,
      });
      if (res.data.success) {
        showFeedback(`Called ${res.data.data.tokenNumber} to counter!`);
        await fetchDashboard();
      }
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Error calling token', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartService = async (tokenId) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/staff/start-service/${tokenId}`);
      if (res.data.success) {
        showFeedback(`Service in progress for ${res.data.data.tokenNumber}`);
        await fetchDashboard();
      }
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Error starting service', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteService = async () => {
    const tokenId = dashboardData?.currentlyServing?._id;
    if (!tokenId) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/staff/complete-service/${tokenId}`, {
        notes: completeNotes,
      });
      if (res.data.success) {
        setCompleteModalOpen(false);
        setCompleteNotes('');
        showFeedback(`Service completed for ${res.data.data.tokenNumber}`);
        await fetchDashboard();
      }
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Error completing service', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkipToken = async (tokenId) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/staff/skip-token/${tokenId}`);
      if (res.data.success) {
        showFeedback(`Token ${res.data.data.tokenNumber} skipped`);
        await fetchDashboard();
      }
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Error skipping token', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecallToken = async (tokenId) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/staff/recall-token/${tokenId}`);
      if (res.data.success) {
        showFeedback(`Token ${res.data.data.tokenNumber} recalled to counter!`);
        await fetchDashboard();
      }
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Error recalling token', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!dashboardData?.counter?._id) return;
    try {
      await api.post('/staff/set-counter', {
        counterId: dashboardData.counter._id,
        status: newStatus,
      });
      await fetchDashboard();
      showFeedback(`Counter status updated to ${newStatus}`);
    } catch (err) {
      showFeedback('Failed to update counter status', 'error');
    }
  };

  const counter = dashboardData?.counter;
  const currentlyServing = dashboardData?.currentlyServing;
  const waitingTokens = dashboardData?.waitingTokens || [];
  const skippedTokens = dashboardData?.skippedTokens || [];
  const stats = dashboardData?.stats;

  return (
    <div className="space-y-6">
      {/* Top Operational Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-subtle flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {counter ? counter.name : 'Counter Standby'}
            </h1>
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                counter?.status === 'open'
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : counter?.status === 'break'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {counter?.status || 'Open'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Operator: <b className="text-slate-700">{user?.name}</b> • Supported Services:{' '}
            {counter?.supportedServices?.map((s) => s.name || s.code).join(', ') || 'All Services'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => navigate('/staff/counter')}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition-all hover:scale-105 active:scale-95 shadow-xs"
          >
            <Monitor className="w-4 h-4 text-indigo-600" />
            <span>Switch Counter</span>
          </button>

          <button
            onClick={() => {
              setWalkinError('');
              setWalkinModalOpen(true);
            }}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Register Walk-In Client</span>
          </button>

          {/* Counter Status Buttons */}
          <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 w-full sm:w-auto justify-center">
            {['open', 'break', 'closed'].map((statusOption) => (
              <button
                key={statusOption}
                onClick={() => handleStatusChange(statusOption)}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all text-center ${
                  counter?.status === statusOption
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {statusOption}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Floating feedback message */}
      {feedbackMsg.text && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200 ${
            feedbackMsg.type === 'error'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-teal-50 text-teal-700 border border-teal-200'
          }`}
        >
          {feedbackMsg.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Waiting In Line"
          value={stats?.waitingCount || 0}
          subtitle="Awaiting call"
          icon={Users}
          color="indigo"
          badge={stats?.waitingCount > 5 ? 'High Volume' : 'Normal'}
        />
        <StatCard
          title="Currently Serving"
          value={currentlyServing ? currentlyServing.tokenNumber : 'None'}
          subtitle={currentlyServing?.customer?.name || 'Counter vacant'}
          icon={Monitor}
          color="teal"
          badge={currentlyServing?.status || 'Idle'}
        />
        <StatCard
          title="Skipped for Recall"
          value={stats?.skippedCount || 0}
          subtitle="Available to recall"
          icon={RotateCcw}
          color="amber"
        />
        <StatCard
          title="Completed Today"
          value={counter?.totalServedToday || stats?.completedCount || 0}
          subtitle="Processed by this counter"
          icon={CheckCircle}
          color="purple"
        />
      </div>

      {/* Primary Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1-col: Currently Serving / Call Next Action Box */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Customer At Counter
              </span>
              {currentlyServing && (
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                  {currentlyServing.service?.code}
                </span>
              )}
            </div>

            {currentlyServing ? (
              <div className="py-6 text-center space-y-4">
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase">Token Number</span>
                  <h2 className="text-5xl font-black text-slate-900 font-mono tracking-tight mt-1">
                    {currentlyServing.tokenNumber}
                  </h2>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Customer:</span>
                    <b className="text-slate-800">{currentlyServing.customer?.name}</b>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Phone:</span>
                    <span className="text-slate-700">{currentlyServing.customer?.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Service:</span>
                    <b className="text-indigo-600">{currentlyServing.service?.name}</b>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">State:</span>
                    <span className="font-bold capitalize text-slate-800">{currentlyServing.status}</span>
                  </div>
                </div>

                {/* Operations buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {currentlyServing.status === 'called' && (
                    <button
                      onClick={() => handleStartService(currentlyServing._id)}
                      disabled={actionLoading}
                      className="col-span-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all"
                    >
                      <Play className="w-4 h-4" /> Start Service
                    </button>
                  )}

                  {currentlyServing.status === 'in_progress' && (
                    <button
                      onClick={() => setCompleteModalOpen(true)}
                      disabled={actionLoading}
                      className="col-span-2 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 transition-all"
                    >
                      <CheckCircle className="w-4 h-4" /> Complete Service
                    </button>
                  )}

                  <button
                    onClick={() => handleRecallToken(currentlyServing._id)}
                    disabled={actionLoading}
                    className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Recall Chime
                  </button>

                  <button
                    onClick={() => handleSkipToken(currentlyServing._id)}
                    disabled={actionLoading}
                    className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <SkipForward className="w-3.5 h-3.5" /> Skip Customer
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <PhoneCall className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Counter is Vacant</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Call the next customer waiting in line to begin service.
                  </p>
                </div>

                <button
                  onClick={() => handleCallNext()}
                  disabled={actionLoading || waitingTokens.length === 0}
                  className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    waitingTokens.length === 0
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30'
                  }`}
                >
                  <PhoneCall className="w-4 h-4" />
                  {waitingTokens.length === 0 ? 'No Customers Waiting' : 'Call Next Token Now'}
                </button>
              </div>
            )}
          </div>

          {/* Quick Notice */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-500 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Average branch service time currently tracking at ~8 minutes.</span>
          </div>
        </div>

        {/* Right 2-cols: Active Queue Management Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Active Waiting Queue ({waitingTokens.length})
                </h3>
                <p className="text-xs text-slate-400">Ordered by earliest arrival time</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 text-slate-500 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-100">
                    <th className="py-3 px-4">Pos</th>
                    <th className="py-3 px-4">Token</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Waiting Time</th>
                    <th className="py-3 px-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {waitingTokens.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No customers currently waiting in the active queue.
                      </td>
                    </tr>
                  ) : (
                    waitingTokens.map((t, idx) => (
                      <tr key={t._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-400">#{idx + 1}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {t.tokenNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-900">{t.customer?.name}</span>
                          <span className="block text-[10px] text-slate-400">{t.customer?.phone || 'No phone'}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                            style={{ backgroundColor: t.service?.color || '#4f46e5' }}
                          >
                            {t.service?.code}
                          </span>
                          <span className="block text-[11px] text-slate-500 mt-0.5">{t.service?.name}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          <span className="font-medium">{t.waitingMinutes}m ago</span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleCallNext(t._id)}
                            disabled={actionLoading || currentlyServing !== null}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                              currentlyServing !== null
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white'
                            }`}
                          >
                            Call This
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Skipped Tokens Panel */}
          {skippedTokens.length > 0 && (
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-subtle">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                  Skipped Tokens Available for Recall ({skippedTokens.length})
                </h4>
              </div>

              <div className="flex flex-wrap gap-2">
                {skippedTokens.map((sk) => (
                  <div
                    key={sk._id}
                    className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-900">{sk.tokenNumber}</span>
                      <span className="text-slate-500 ml-1.5 font-medium">({sk.customer?.name})</span>
                    </div>
                    <button
                      onClick={() => handleRecallToken(sk._id)}
                      disabled={actionLoading}
                      className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-[11px] transition-colors"
                    >
                      Recall
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Complete Service Notes Modal */}
      <Modal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        title="Complete Customer Service"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            You are marking service for{' '}
            <b className="text-slate-900 font-mono">{currentlyServing?.tokenNumber}</b> (
            {currentlyServing?.customer?.name}) as completed.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Resolution or Service Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={completeNotes}
              onChange={(e) => setCompleteNotes(e.target.value)}
              placeholder="e.g. KYC documents verified and address updated successfully in CBS..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setCompleteModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleCompleteService}
              disabled={actionLoading}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors"
            >
              {actionLoading ? 'Saving...' : 'Mark Completed'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Walk-in Customer KYC Registration Modal */}
      <Modal
        isOpen={walkinModalOpen}
        onClose={() => setWalkinModalOpen(false)}
        title="Register Walk-in Client with Official Documents"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleRegisterWalkin} className="space-y-4">
          {walkinError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{walkinError}</span>
            </div>
          )}

          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center gap-2.5 text-xs text-indigo-950">
            <FileCheck2 className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <p className="font-bold">Official Document Verification Protocol</p>
              <p className="text-[11px] text-indigo-700 mt-0.5">
                Staff member {user?.name} will be recorded as the official verification authority for this client account.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Legal Name *
              </label>
              <input
                type="text"
                required
                value={walkinForm.name}
                onChange={(e) => setWalkinForm({ ...walkinForm, name: e.target.value })}
                placeholder="e.g. Michael Chen"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Email Address *
              </label>
              <input
                type="email"
                required
                value={walkinForm.email}
                onChange={(e) => setWalkinForm({ ...walkinForm, email: e.target.value })}
                placeholder="client@gmail.com"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone Number
              </label>
              <input
                type="tel"
                value={walkinForm.phone}
                onChange={(e) => setWalkinForm({ ...walkinForm, phone: e.target.value })}
                placeholder="+1 (555) 019-3322"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Document Type *
              </label>
              <select
                value={walkinForm.documentType}
                onChange={(e) => setWalkinForm({ ...walkinForm, documentType: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="national_id">National ID Card / SSN</option>
                <option value="passport">Government Passport</option>
                <option value="driver_license">Driver's License</option>
                <option value="pan_card">Tax ID / PAN Card</option>
                <option value="voter_id">Voter Identity Card</option>
                <option value="other">Other Official Government ID</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Official Document ID / Serial Number *
            </label>
            <input
              type="text"
              required
              value={walkinForm.documentNumber}
              onChange={(e) => setWalkinForm({ ...walkinForm, documentNumber: e.target.value.toUpperCase() })}
              placeholder="e.g. A92819482 or DL-88219491"
              className="w-full px-3 py-2 text-xs font-mono uppercase border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Immediate Queue Token Service (Optional)
              </label>
              <select
                value={walkinForm.serviceId}
                onChange={(e) => setWalkinForm({ ...walkinForm, serviceId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Do Not Issue Token (Account Creation Only)</option>
                {services.map((svc) => (
                  <option key={svc.id || svc._id} value={svc.id || svc._id}>
                    {svc.name} ({svc.prefix}***)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Desk Verification Notes
              </label>
              <input
                type="text"
                value={walkinForm.notes}
                onChange={(e) => setWalkinForm({ ...walkinForm, notes: e.target.value })}
                placeholder="e.g. Original physical ID inspected at Counter"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setWalkinModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={walkinSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all"
            >
              {walkinSubmitting ? 'Registering & Verifying...' : 'Complete Verification & Onboard'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StaffDashboard;
