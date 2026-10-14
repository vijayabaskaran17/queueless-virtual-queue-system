import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ticket,
  Clock,
  Users,
  Layers,
  ArrowRight,
  PlusCircle,
  Sparkles,
  CreditCard,
  Banknote,
  Building2,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import TokenCard from '../../components/TokenCard';
import QueueProgress from '../../components/QueueProgress';
import Modal from '../../components/Modal';

const iconMap = {
  CreditCard,
  Banknote,
  Building2,
  TrendingUp,
  Layers,
};

const CustomerDashboard = () => {
  const { user } = useAuth();
  const { socket, joinService } = useSocket();
  const navigate = useNavigate();

  const [activeData, setActiveData] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningService, setJoiningService] = useState(null);
  const [serviceNotes, setServiceNotes] = useState('');
  const [submittingToken, setSubmittingToken] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellingTokenId, setCancellingTokenId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    try {
      setErrorMsg('');
      const [activeRes, servicesRes] = await Promise.all([
        api.get('/queue/my-active'),
        api.get('/queue/services'),
      ]);

      if (activeRes.data.success) {
        setActiveData(activeRes.data.data);
        if (activeRes.data.data?.token?.service?._id) {
          joinService(activeRes.data.data.token.service._id);
        }
      }

      if (servicesRes.data.success) {
        setServices(servicesRes.data.data);
      }
    } catch (err) {
      console.warn('Dashboard fetch notice:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Listen for real-time queue events
  useEffect(() => {
    if (!socket) return;

    const handleQueueUpdated = () => {
      fetchData();
    };

    const handleTokenStatusChanged = () => {
      fetchData();
    };

    socket.on('queue:updated', handleQueueUpdated);
    socket.on('token:status_changed', handleTokenStatusChanged);

    return () => {
      socket.off('queue:updated', handleQueueUpdated);
      socket.off('token:status_changed', handleTokenStatusChanged);
    };
  }, [socket]);

  const handleJoinQueue = async (e) => {
    e.preventDefault();
    if (!joiningService) return;
    setSubmittingToken(true);
    setErrorMsg('');

    try {
      const res = await api.post('/queue/join', {
        serviceId: joiningService.id || joiningService._id,
        notes: serviceNotes,
      });

      if (res.data.success) {
        setJoiningService(null);
        setServiceNotes('');
        await fetchData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to join queue.');
    } finally {
      setSubmittingToken(false);
    }
  };

  const handleCancelToken = async () => {
    if (!cancellingTokenId) return;
    try {
      await api.put(`/queue/cancel/${cancellingTokenId}`);
      setCancelModalOpen(false);
      setCancellingTokenId(null);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel token');
    }
  };

  const activeToken = activeData?.token;
  const queuePos = activeData?.queuePosition;
  const estWait = activeData?.estimatedWaitTime;
  const nowServing = activeData?.currentlyServing;

  return (
    <div className="space-y-8">
      {/* Personalized Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-premium relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Digital Branch Services</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Track your queue position in real time or join a new counter queue without waiting on your feet.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={() => navigate('/customer/services')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            Join a Queue
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Token"
          value={activeToken ? activeToken.tokenNumber : 'None'}
          subtitle={activeToken ? activeToken.service?.name : 'No active ticket'}
          icon={Ticket}
          color="indigo"
          badge={activeToken ? activeToken.status : 'Idle'}
        />
        <StatCard
          title="Queue Position"
          value={activeToken && activeToken.status === 'waiting' ? `#${queuePos || 1}` : '-'}
          subtitle={activeToken ? `${(queuePos || 1) - 1} ahead in line` : 'Not in line'}
          icon={Users}
          color="teal"
        />
        <StatCard
          title="Estimated Wait"
          value={activeToken && activeToken.status === 'waiting' ? `~${estWait || 5}m` : '0m'}
          subtitle="Dynamic empirical time"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Now Serving"
          value={nowServing || 'None'}
          subtitle={activeData?.servingCounter || 'All counters standby'}
          icon={Layers}
          color="purple"
        />
      </div>

      {/* Active Token Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Ticket className="w-5 h-5 text-indigo-600" />
            Your Live Token
          </h2>
          {activeToken && (
            <button
              onClick={() => navigate('/customer/active')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Focused View <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {activeToken ? (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
              <QueueProgress status={activeToken.status} queuePosition={queuePos} />
            </div>
            <TokenCard
              token={activeToken}
              queuePosition={queuePos}
              estimatedWaitTime={estWait}
              currentlyServing={nowServing}
              servingCounter={activeData?.servingCounter}
              onCancel={(id) => {
                setCancellingTokenId(id);
                setCancelModalOpen(true);
              }}
            />
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 border border-slate-200/90 text-center shadow-subtle">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Active Queue Token</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
              You are not currently waiting in any service queue. Browse the service catalog below to generate your digital token instantly.
            </p>
            <button
              onClick={() => navigate('/customer/services')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors"
            >
              Browse Available Services
            </button>
          </div>
        )}
      </div>

      {/* Service Discovery Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Available Banking Services</h2>
            <p className="text-xs text-slate-500">Pick a counter service to generate your digital token</p>
          </div>
          <button
            onClick={() => navigate('/customer/services')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            View All ({services.length})
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((svc) => {
            const IconComponent = iconMap[svc.icon] || Layers;
            return (
              <div
                key={svc.id || svc._id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle hover:shadow-premium hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                      style={{ backgroundColor: svc.color || '#4f46e5' }}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                      {svc.prefix}***
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{svc.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{svc.description}</p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-3 text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <b>{svc.waitingCount || 0}</b> waiting
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      ~{svc.estimatedMinutes || svc.avgDuration}m
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setJoiningService(svc);
                      setErrorMsg('');
                    }}
                    disabled={activeToken !== null}
                    className={`w-full py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                      activeToken !== null
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white'
                    }`}
                  >
                    {activeToken ? 'Token Active' : 'Join Queue'}
                    {!activeToken && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Join Queue Modal */}
      <Modal
        isOpen={!!joiningService}
        onClose={() => setJoiningService(null)}
        title={`Join Queue: ${joiningService?.name}`}
      >
        <form onSubmit={handleJoinQueue} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Token Prefix:</span>
              <b className="font-mono">{joiningService?.prefix}</b>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Currently Waiting:</span>
              <b>{joiningService?.waitingCount || 0} people</b>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Estimated Wait:</span>
              <b className="text-indigo-600">~{joiningService?.estimatedMinutes || 10} minutes</b>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Service Notes or Inquiries (Optional)
            </label>
            <textarea
              rows={3}
              value={serviceNotes}
              onChange={(e) => setServiceNotes(e.target.value)}
              placeholder="e.g. Inquiring about home loan interest rates or new KYC update..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setJoiningService(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingToken}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              {submittingToken ? 'Generating Token...' : 'Confirm & Generate Token'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Active Token?"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to cancel your active queue token? You will lose your current position in line and will need to take a new token.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setCancelModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Keep My Place
            </button>
            <button
              onClick={handleCancelToken}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors"
            >
              Yes, Cancel Token
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerDashboard;
