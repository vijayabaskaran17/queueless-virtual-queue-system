import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/Modal';

const ServiceManagementPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [editingService, setEditingService] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    prefix: '',
    avgDuration: 10,
    color: '#4f46e5',
    description: '',
    isActive: true,
  });

  const loadServices = async () => {
    try {
      const res = await api.get('/queue/services');
      if (res.data.success) {
        setServices(res.data.data);
      }
    } catch (err) {
      console.warn('Services load notice:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/services', formData);
      if (res.data.success) {
        setCreateModal(false);
        setFormData({
          name: '',
          code: '',
          prefix: '',
          avgDuration: 10,
          color: '#4f46e5',
          description: '',
          isActive: true,
        });
        await loadServices();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating service');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingService) return;
    try {
      const res = await api.put(`/admin/services/${editingService.id || editingService._id}`, formData);
      if (res.data.success) {
        setEditingService(null);
        await loadServices();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating service');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Service Catalog</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure branch service categories, token prefixes, benchmark durations, and active states
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              name: '',
              code: '',
              prefix: '',
              avgDuration: 10,
              color: '#4f46e5',
              description: '',
              isActive: true,
            });
            setCreateModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-4 px-6">Service Name</th>
                <th className="py-4 px-6">Code & Prefix</th>
                <th className="py-4 px-6">Benchmark Avg Duration</th>
                <th className="py-4 px-6">Active Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {services.map((s) => (
                <tr key={s.id || s._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-900">
                    {s.name}
                    <span className="block text-[11px] font-normal text-slate-400 mt-0.5 line-clamp-1">
                      {s.description}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-mono font-bold text-slate-800">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 mr-2">
                      {s.code}
                    </span>
                    Prefix: <b className="text-indigo-600">{s.prefix}</b>
                  </td>
                  <td className="py-4 px-6 font-medium text-slate-700">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{s.avgDuration} minutes</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => {
                        setEditingService(s);
                        setFormData({
                          name: s.name,
                          code: s.code,
                          prefix: s.prefix,
                          avgDuration: s.avgDuration,
                          color: s.color,
                          description: s.description || '',
                          isActive: true,
                        });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors inline-flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={createModal || !!editingService}
        onClose={() => {
          setCreateModal(false);
          setEditingService(null);
        }}
        title={editingService ? `Edit Service: ${editingService.name}` : 'Create New Service'}
      >
        <form onSubmit={editingService ? handleUpdate : handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Service Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Commercial Loans & Advisory"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Code (Unique)</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. LON"
                className="w-full px-3 py-2 text-xs font-mono uppercase border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Token Prefix</label>
              <input
                type="text"
                required
                value={formData.prefix}
                onChange={(e) => setFormData({ ...formData, prefix: e.target.value.toUpperCase() })}
                placeholder="e.g. L"
                className="w-full px-3 py-2 text-xs font-mono uppercase border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Benchmark Avg Duration (Minutes)</label>
            <input
              type="number"
              min="1"
              required
              value={formData.avgDuration}
              onChange={(e) => setFormData({ ...formData, avgDuration: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Short explanation of requirements and documents for customers..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => {
                setCreateModal(false);
                setEditingService(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              {editingService ? 'Save Updates' : 'Create Service'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ServiceManagementPage;
