import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ticket,
  Clock,
  Layers,
  ArrowLeft,
  Ban,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
} from 'lucide-react';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import TokenCard from '../../components/TokenCard';
import QueueProgress from '../../components/QueueProgress';
import Modal from '../../components/Modal';

const ActiveTokenPage = () => {
  const navigate = useNavigate();
  const { socket, joinService } = useSocket();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchActive = async () => {
    try {
      const res = await api.get('/queue/my-active');
      if (res.data.success) {
        setData(res.data.data);
        if (res.data.data?.token?.service?._id) {
          joinService(res.data.data.token.service._id);
        }
      }
    } catch (err) {
      console.warn('Active token fetch notice:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActive();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchActive();
    };

    socket.on('queue:updated', handleUpdate);
    socket.on('token:status_changed', handleUpdate);

    return () => {
      socket.off('queue:updated', handleUpdate);
      socket.off('token:status_changed', handleUpdate);
    };
  }, [socket]);

  const handleCancel = async () => {
    if (!data?.token?._id) return;
    setCancelling(true);
    try {
      await api.put(`/queue/cancel/${data.token._id}`);
      setCancelModal(false);
      await fetchActive();
    } catch (err) {
      alert(err.response?.data?.message || 'Error cancelling token');
    } finally {
      setCancelling(false);
    }
  };

  const token = data?.token;
  const queuePos = data?.queuePosition;
  const estWait = data?.estimatedWaitTime;
  const nowServing = data?.currentlyServing;
  const calcDetails = data?.calculationDetails;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/customer')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Overview
        </button>

        <span className="text-xs text-slate-400">
          Last synchronized: {new Date().toLocaleTimeString()}
        </span>
      </div>

      {token ? (
        <div className="space-y-6">
          {/* Main Ticket */}
          <TokenCard
            token={token}
            queuePosition={queuePos}
            estimatedWaitTime={estWait}
            currentlyServing={nowServing}
            servingCounter={data?.servingCounter}
            onCancel={() => setCancelModal(true)}
            showActions={true}
          />

          {/* Stepped Progress Bar */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-subtle">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Real-Time Queue Lifecycle
            </h3>
            <QueueProgress status={token.status} queuePosition={queuePos} />
          </div>

          {/* Transparent Calculation Breakdown */}
          {calcDetails && token.status === 'waiting' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-subtle space-y-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-900 tracking-tight uppercase">
                  Transparent Wait-Time Calculation Formula
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400">Customers Ahead:</span>
                  <p className="text-base font-bold text-slate-800 mt-0.5">{calcDetails.aheadCount}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400">Active Open Counters:</span>
                  <p className="text-base font-bold text-teal-600 mt-0.5">{calcDetails.activeCounters}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400">Empirical Avg Duration:</span>
                  <p className="text-base font-bold text-indigo-600 mt-0.5">~{calcDetails.avgDuration} mins</p>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                Formula: <code className="font-mono text-indigo-900 font-bold">((aheadCount + 1) × avgDuration) ÷ activeCounters</code> = ~{estWait} minutes. Dynamic adjustments reflect actual queue clearances in real time.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center shadow-subtle space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Ticket className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">You Don't Have an Active Token</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When you join any counter queue, you can monitor your position and wait time directly on this screen.
          </p>
          <button
            onClick={() => navigate('/customer/services')}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors"
          >
            Find a Service
          </button>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={cancelModal}
        onClose={() => setCancelModal(false)}
        title="Cancel Active Queue Token"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Cancellation Warning</p>
              <p className="mt-0.5 text-amber-700">
                Cancelling will permanently surrender your spot (#{queuePos}) in line for {token?.service?.name}.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setCancelModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Keep My Place
            </button>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors"
            >
              {cancelling ? 'Cancelling...' : 'Yes, Cancel Token'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ActiveTokenPage;
