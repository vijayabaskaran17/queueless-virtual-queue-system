import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Users,
  Clock,
  ArrowRight,
  Sparkles,
  CreditCard,
  Banknote,
  Building2,
  TrendingUp,
  Layers,
  AlertCircle,
} from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/Modal';

const iconMap = {
  CreditCard,
  Banknote,
  Building2,
  TrendingUp,
  Layers,
};

const ServicesPage = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeToken, setActiveToken] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    try {
      const [svcRes, activeRes] = await Promise.all([
        api.get('/queue/services'),
        api.get('/queue/my-active'),
      ]);
      if (svcRes.data.success) setServices(svcRes.data.data);
      if (activeRes.data.success) setActiveToken(activeRes.data.data?.token || null);
    } catch (err) {
      console.warn('Services load notice:', err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!selectedService) return;
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await api.post('/queue/join', {
        serviceId: selectedService.id || selectedService._id,
        notes,
      });

      if (res.data.success) {
        setSelectedService(null);
        setNotes('');
        navigate('/customer/active');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to join queue');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Service Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse services, check real-time queue lengths, and request a digital token
          </p>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search service name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {activeToken && (
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-indigo-900">
              Active Token: {activeToken.tokenNumber} ({activeToken.service?.name})
            </span>
            <span className="text-xs bg-indigo-200 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
              {activeToken.status}
            </span>
          </div>
          <button
            onClick={() => navigate('/customer/active')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Go to active token →
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredServices.map((svc) => {
          const IconComponent = iconMap[svc.icon] || Layers;
          return (
            <div
              key={svc.id || svc._id}
              className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-subtle hover:shadow-premium hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: svc.color || '#4f46e5' }}
                  >
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-mono">
                    Prefix: {svc.prefix}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{svc.name}</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{svc.description}</p>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Waiting</span>
                    <div className="text-base font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>{svc.waitingCount || 0}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Est. Wait</span>
                    <div className="text-base font-bold text-indigo-600 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      <span>~{svc.estimatedMinutes || svc.avgDuration}m</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedService(svc);
                    setErrorMsg('');
                  }}
                  disabled={activeToken !== null}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    activeToken !== null
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20'
                  }`}
                >
                  {activeToken ? 'Token Active' : 'Join Queue & Get Token'}
                  {!activeToken && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Join Modal */}
      <Modal
        isOpen={!!selectedService}
        onClose={() => setSelectedService(null)}
        title={`Generate Token: ${selectedService?.name}`}
      >
        <form onSubmit={handleJoin} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Service:</span>
              <span className="font-bold text-slate-800">{selectedService?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Code:</span>
              <span className="font-mono font-bold text-slate-800">{selectedService?.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Est. Waiting Time:</span>
              <span className="font-bold text-indigo-600">~{selectedService?.estimatedMinutes || 10} minutes</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Add inquiry details (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Inquiring about current savings interest rates..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSelectedService(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              {submitting ? 'Creating Token...' : 'Confirm Digital Token'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ServicesPage;
