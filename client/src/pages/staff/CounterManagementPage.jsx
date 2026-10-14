import React, { useState, useEffect } from 'react';
import {
  Monitor,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  X,
  Send,
  UserCheck,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const CounterManagementPage = () => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [counters, setCounters] = useState([]);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const loadCounters = async () => {
    try {
      const res = await api.get('/admin/counters');
      if (res.data.success) {
        setCounters(res.data.data);
      }
    } catch (err) {
      console.warn('Counters load notice:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRequest = async () => {
    try {
      const res = await api.get('/staff/counter-switch-request');
      if (res.data.success) {
        setPendingRequest(res.data.data);
      }
    } catch (err) {
      console.warn('Pending switch request notice:', err.message);
    }
  };

  useEffect(() => {
    loadCounters();
    loadPendingRequest();
  }, []);

  // Real-time socket sync
  useEffect(() => {
    if (!socket) return;

    const handleSync = () => {
      loadCounters();
      loadPendingRequest();
    };

    socket.on('counter:updated', handleSync);
    socket.on('counter_switch:resolved', handleSync);
    socket.on('counter_switch:requested', handleSync);

    return () => {
      socket.off('counter:updated', handleSync);
      socket.off('counter_switch:resolved', handleSync);
      socket.off('counter_switch:requested', handleSync);
    };
  }, [socket]);

  // Request counter switch from Admin
  const handleRequestSwitch = async (counter) => {
    setSubmittingId(counter._id);
    setMessage({ text: '', type: '' });

    try {
      const res = await api.post('/staff/request-counter-switch', {
        targetCounterId: counter._id,
      });

      if (res.data.success) {
        setMessage({
          type: 'success',
          text: `Switch request for ${counter.name} sent to Administrator. Once approved, your assignment will update automatically.`,
        });
        await loadPendingRequest();
        await loadCounters();
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Error submitting counter switch request',
      });
    } finally {
      setSubmittingId(null);
    }
  };

  // Cancel pending request
  const handleCancelRequest = async () => {
    setCancelling(true);
    try {
      const res = await api.delete('/staff/counter-switch-request');
      if (res.data.success) {
        setMessage({
          type: 'info',
          text: 'Counter switch request was cancelled.',
        });
        setPendingRequest(null);
        await loadCounters();
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Error cancelling request',
      });
    } finally {
      setCancelling(false);
    }
  };

  const userId = user?._id || user?.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Counter Control</h1>
        <p className="text-xs text-slate-500 mt-1">
          Select and manage your active branch counter assignment. Counter switches require Administrator authorization.
        </p>
      </div>

      {/* Floating feedback message */}
      {message.text && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in ${
            message.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : message.type === 'info'
              ? 'bg-slate-50 text-slate-800 border border-slate-200'
              : 'bg-teal-50 text-teal-800 border border-teal-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage({ text: '', type: '' })}
            className="text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Active Pending Request Notification Card */}
      {pendingRequest && (
        <div className="bg-amber-50/80 border border-amber-300 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Counter Switch Request Pending Approval
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 uppercase tracking-wider">
                    Awaiting Admin
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-snug">
                  You requested to switch to{' '}
                  <span className="font-bold text-amber-950">
                    {pendingRequest.targetCounter?.name || 'Counter'}
                  </span>
                  . The branch Administrator has been notified to review and authorize the switch.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={cancelling}
              onClick={handleCancelRequest}
              className="px-3.5 py-2 rounded-xl bg-white border border-amber-300 hover:bg-amber-100/60 text-amber-900 font-bold text-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 shadow-xs"
            >
              <X className="w-3.5 h-3.5" />
              <span>{cancelling ? 'Cancelling...' : 'Cancel Request'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Counters Grid - Covering all 4 services matching Customer Portal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-5">
        {counters.map((c) => {
          // Robust comparison eliminating undefined === undefined bug
          const assignedStaffId = c.assignedStaff?._id || c.assignedStaff;
          const isMine = Boolean(
            assignedStaffId &&
            userId &&
            assignedStaffId.toString() === userId.toString()
          );

          const isTargetOfPendingRequest =
            pendingRequest &&
            (pendingRequest.targetCounter?._id?.toString() === c._id.toString() ||
              pendingRequest.targetCounter?.toString() === c._id.toString());

          const isAssignedToOther = Boolean(
            c.assignedStaff && !isMine
          );

          return (
            <div
              key={c._id}
              className={`bg-white rounded-3xl p-6 border transition-all flex flex-col justify-between ${
                isMine
                  ? 'border-indigo-500 ring-2 ring-indigo-100 shadow-md'
                  : isTargetOfPendingRequest
                  ? 'border-amber-400 ring-2 ring-amber-100 shadow-md'
                  : 'border-slate-200/90 shadow-subtle'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
                      isMine
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : isTargetOfPendingRequest
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'bg-indigo-50 text-indigo-600'
                    }`}
                  >
                    {c.counterNumber}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isMine && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Current Desk
                      </span>
                    )}
                    {isTargetOfPendingRequest && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                        Switch Requested
                      </span>
                    )}
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                        c.status === 'open'
                          ? 'bg-teal-50 text-teal-700 border border-teal-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900">{c.name}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Currently Assigned:{' '}
                  <b className={isMine ? 'text-indigo-600' : 'text-slate-800'}>
                    {isMine
                      ? `${user?.name || 'You'} (You)`
                      : c.assignedStaff?.name || 'Unassigned'}
                  </b>
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
                  <div className="text-slate-500">
                    <span className="font-semibold text-slate-700">Supported Service:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {c.supportedServices?.map((s) => (
                        <span
                          key={s._id}
                          className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100/80 flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                          {s.name || s.code}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-slate-500 pt-2 flex justify-between">
                    <span>Total Served Today:</span>
                    <b className="text-slate-800">{c.totalServedToday || 0}</b>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                {isMine ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 cursor-default"
                  >
                    ✓ You Are Assigned Here
                  </button>
                ) : isTargetOfPendingRequest ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-amber-100 text-amber-900 border border-amber-300 cursor-default flex items-center justify-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>Awaiting Admin Approval...</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleRequestSwitch(c)}
                    disabled={submittingId === c._id}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                      isAssignedToOther
                        ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                    }`}
                  >
                    {submittingId === c._id ? (
                      <span>Sending Request...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Request Switch To This Counter</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CounterManagementPage;
