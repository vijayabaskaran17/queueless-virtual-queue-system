import React, { useState, useEffect } from 'react';
import { History, Calendar, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import api from '../../services/api';
import { formatIndianDate, formatIndianTime } from '../../utils/dateUtils';

const TokenHistoryPage = () => {
  const [tokens, setTokens] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/queue/my-history');
        if (res.data.success) {
          setTokens(res.data.data);
        }
      } catch (err) {
        console.warn('History fetch notice:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filtered = tokens.filter((t) => {
    if (filterStatus === 'all') return true;
    return t.status === filterStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <CheckCircle className="w-3 h-3" /> Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      case 'skipped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3 h-3" /> Skipped
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Queue History</h1>
          <p className="text-xs text-slate-500 mt-1">Review your past digital queue tokens and service logs</p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold overflow-x-auto no-scrollbar w-full sm:w-auto">
          {['all', 'completed', 'cancelled', 'skipped'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg capitalize whitespace-nowrap transition-colors flex-1 sm:flex-initial text-center ${
                filterStatus === st
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-4 px-6">Token</th>
                <th className="py-4 px-6">Service</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Served By / Counter</th>
                <th className="py-4 px-6">Date & Time</th>
                <th className="py-4 px-6">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No token history recorded under this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">
                      {t.tokenNumber}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      {t.service?.name || 'General Service'}
                    </td>
                    <td className="py-4 px-6">{getStatusBadge(t.status)}</td>
                    <td className="py-4 px-6 text-slate-600">
                      {t.counter?.name || 'Counter Standby'}
                      {t.servedBy && <span className="block text-[11px] text-slate-400">by {t.servedBy.name}</span>}
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatIndianDate(t.createdAt)}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {formatIndianTime(t.createdAt)} (IST)
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500 max-w-xs truncate">
                      {t.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TokenHistoryPage;
