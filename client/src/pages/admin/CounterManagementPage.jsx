import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Plus,
  Edit2,
  Users,
  CheckCircle2,
  Clock,
  Check,
  X,
  ArrowRight,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { useSocket } from '../../context/SocketContext';

const CounterManagementPage = () => {
  const { socket } = useSocket();

  const [counters, setCounters] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [services, setServices] = useState([]);
  const [switchRequests, setSwitchRequests] = useState([]);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedback, setFeedback] = useState({ text: '', type: '' });

  const [createModal, setCreateModal] = useState(false);
  const [editingCounter, setEditingCounter] = useState(null);

  const [counterNumber, setCounterNumber] = useState(1);
  const [name, setName] = useState('');
  const [assignedStaff, setAssignedStaff] = useState('');
  const [supportedServices, setSupportedServices] = useState([]);
  const [status, setStatus] = useState('open');

  const loadData = async () => {
    try {
      const [cntRes, staffRes, svcRes, reqRes] = await Promise.all([
        api.get('/admin/counters'),
        api.get('/admin/users', { params: { role: 'staff' } }),
        api.get('/queue/services'),
        api.get('/admin/counter-switch-requests', { params: { status: 'pending' } }),
      ]);

      if (cntRes.data.success) setCounters(cntRes.data.data);
      if (staffRes.data.success) setStaffList(staffRes.data.data);
      if (svcRes.data.success) setServices(svcRes.data.data);
      if (reqRes.data.success) setSwitchRequests(reqRes.data.data);
    } catch (err) {
      console.warn('Counters load notice:', err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Real-time socket sync
  useEffect(() => {
    if (!socket) return;

    const handleSync = () => {
      loadData();
    };

    socket.on('counter:updated', handleSync);
    socket.on('counter_switch:requested', handleSync);
    socket.on('counter_switch:resolved', handleSync);
    socket.on('counter_switch:cancelled', handleSync);

    return () => {
      socket.off('counter:updated', handleSync);
      socket.off('counter_switch:requested', handleSync);
      socket.off('counter_switch:resolved', handleSync);
      socket.off('counter_switch:cancelled', handleSync);
    };
  }, [socket]);

  // Admin approves switch request
  const handleApproveSwitch = async (requestId) => {
    setActionLoadingId(requestId);
    setFeedback({ text: '', type: '' });

    try {
      const res = await api.post(`/admin/counter-switch-requests/${requestId}/approve`);
      if (res.data.success) {
        setFeedback({
          type: 'success',
          text: res.data.message || 'Counter switch approved successfully.',
        });
        await loadData();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Error approving switch request',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Admin rejects switch request
  const handleRejectSwitch = async (requestId) => {
    setActionLoadingId(requestId);
    setFeedback({ text: '', type: '' });

    try {
      const res = await api.post(`/admin/counter-switch-requests/${requestId}/reject`, {
        reason: 'Declined by Administrator based on current branch operational requirements.',
      });
      if (res.data.success) {
        setFeedback({
          type: 'info',
          text: 'Counter switch request declined.',
        });
        await loadData();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Error declining switch request',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/counters', {
        counterNumber,
        name: name || `Counter ${counterNumber}`,
        assignedStaff: assignedStaff || null,
        supportedServices,
        status,
      });

      if (res.data.success) {
        setCreateModal(false);
        resetForm();
        await loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating counter');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingCounter) return;
    try {
      const res = await api.put(`/admin/counters/${editingCounter._id}`, {
        name,
        assignedStaff: assignedStaff || null,
        supportedServices,
        status,
      });

      if (res.data.success) {
        setEditingCounter(null);
        resetForm();
        await loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating counter');
    }
  };

  const resetForm = () => {
    setCounterNumber(counters.length + 1);
    setName('');
    setAssignedStaff('');
    setSupportedServices([]);
    setStatus('open');
  };

  const toggleService = (svcId) => {
    if (supportedServices.includes(svcId)) {
      setSupportedServices(supportedServices.filter((id) => id !== svcId));
    } else {
      setSupportedServices([...supportedServices, svcId]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Counter Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure physical branch counters, authorize staff desk switch requests, and set service routings
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setCreateModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Counter
        </button>
      </div>

      {/* Feedback Alert */}
      {feedback.text && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in ${
            feedback.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : feedback.type === 'info'
              ? 'bg-slate-50 text-slate-800 border border-slate-200'
              : 'bg-teal-50 text-teal-800 border border-teal-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback({ text: '', type: '' })}
            className="text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================= PENDING STAFF COUNTER SWITCH REQUESTS ================= */}
      {switchRequests.length > 0 && (
        <div className="bg-amber-50/70 border-2 border-amber-300 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Staff Counter Switch Requests</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold text-[10px]">
                    {switchRequests.length} Pending Approval
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Review staff desk switch requests. Approving will automatically reassign the staff member.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {switchRequests.map((req) => (
              <div
                key={req._id}
                className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{req.staff?.name || 'Staff Member'}</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {req.staff?.email || req.staff?.employeeId || ''}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      Pending
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Current Desk
                      </span>
                      <span className="font-semibold text-slate-700 text-[11px]">
                        {req.currentCounter ? req.currentCounter.name : 'Unassigned'}
                      </span>
                    </div>

                    <ArrowRight className="w-4 h-4 text-amber-500 shrink-0 mx-2" />

                    <div className="flex-1 text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 block">
                        Requested Desk
                      </span>
                      <span className="font-bold text-teal-900 text-[11px]">
                        {req.targetCounter?.name}
                      </span>
                    </div>
                  </div>

                  {req.note && (
                    <p className="text-[11px] text-slate-500 italic bg-amber-50/50 p-2 rounded-lg">
                      Note: "{req.note}"
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={actionLoadingId === req._id}
                    onClick={() => handleRejectSwitch(req._id)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-bold text-xs transition-colors flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Decline</span>
                  </button>

                  <button
                    type="button"
                    disabled={actionLoadingId === req._id}
                    onClick={() => handleApproveSwitch(req._id)}
                    className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{actionLoadingId === req._id ? 'Approving...' : 'Approve Switch'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Counters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {counters.map((c) => (
          <div
            key={c._id}
            className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-subtle flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl">
                  {c.counterNumber}
                </div>
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

              <h3 className="text-base font-bold text-slate-900">{c.name}</h3>
              <p className="text-xs text-slate-500 mt-1">
                Assigned Staff: <b className="text-slate-800">{c.assignedStaff?.name || 'Unassigned'}</b>
              </p>

              <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-2">
                <div>
                  <span className="font-medium text-slate-400">Supported Services:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {c.supportedServices?.map((s) => (
                      <span
                        key={s._id}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700"
                      >
                        {s.name || s.code}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-1 flex justify-between">
                  <span className="text-slate-400">Total Processed:</span>
                  <b className="text-slate-900">{c.totalServedToday || 0} tokens</b>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  setEditingCounter(c);
                  setName(c.name);
                  setCounterNumber(c.counterNumber);
                  setAssignedStaff(c.assignedStaff?._id || '');
                  setSupportedServices(c.supportedServices?.map((s) => s._id || s) || []);
                  setStatus(c.status);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Configuration
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal
        isOpen={createModal || !!editingCounter}
        onClose={() => {
          setCreateModal(false);
          setEditingCounter(null);
        }}
        title={editingCounter ? `Edit Counter: ${editingCounter.name}` : 'Create New Counter'}
      >
        <form onSubmit={editingCounter ? handleUpdate : handleCreate} className="space-y-4">
          {!editingCounter && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Counter Number</label>
              <input
                type="number"
                min="1"
                required
                value={counterNumber}
                onChange={(e) => setCounterNumber(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Counter Display Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Counter 4 - Wealth Desk"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Staff Member</label>
            <select
              value={assignedStaff}
              onChange={(e) => setAssignedStaff(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Unassigned</option>
              {staffList.map((st) => (
                <option key={st._id} value={st._id}>
                  {st.name} ({st.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Operating Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="open">Open</option>
              <option value="break">Break</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Supported Services</label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto p-2 border border-slate-200 rounded-xl">
              {services.map((svc) => {
                const id = svc.id || svc._id;
                const isChecked = supportedServices.includes(id);
                return (
                  <label key={id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleService(id)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{svc.name} ({svc.code})</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => {
                setCreateModal(false);
                setEditingCounter(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              {editingCounter ? 'Save Changes' : 'Create Counter'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CounterManagementPage;
