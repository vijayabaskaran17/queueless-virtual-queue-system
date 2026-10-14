import React, { useState, useEffect } from 'react';
import { FileText, Clock, User, Filter, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { formatIndianDate, formatIndianTime } from '../../utils/dateUtils';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [filterAction, setFilterAction] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/admin/logs', {
        params: { action: filterAction || undefined, limit: 100 },
      });
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.warn('Logs fetch notice:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterAction]);

  const getActionBadge = (action) => {
    const map = {
      created: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      called: 'bg-amber-50 text-amber-700 border-amber-200',
      started: 'bg-blue-50 text-blue-700 border-blue-200',
      completed: 'bg-teal-50 text-teal-700 border-teal-200',
      skipped: 'bg-slate-100 text-slate-700 border-slate-300',
      recalled: 'bg-purple-50 text-purple-700 border-purple-200',
      cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
    };
    return (
      <span
        className={`inline-block px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] border ${
          map[action] || 'bg-slate-100 text-slate-700'
        }`}
      >
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Audit Trail & Event Logs</h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete compliance record of all token generation, staff calls, service starts, and completions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Lifecycle Actions</option>
            <option value="created">Created</option>
            <option value="called">Called</option>
            <option value="started">Started</option>
            <option value="completed">Completed</option>
            <option value="skipped">Skipped</option>
            <option value="recalled">Recalled</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-4 px-6">Timestamp</th>
                <th className="py-4 px-6">Action</th>
                <th className="py-4 px-6">Token</th>
                <th className="py-4 px-6">Service</th>
                <th className="py-4 px-6">Performed By</th>
                <th className="py-4 px-6">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No log records found matching this criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                      <div className="font-semibold text-slate-700">{formatIndianDate(log.timestamp)}</div>
                      <span className="text-[10px] text-slate-400">
                        {formatIndianTime(log.timestamp, true)} (IST)
                      </span>
                    </td>
                    <td className="py-4 px-6">{getActionBadge(log.action)}</td>
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">
                      {log.token?.tokenNumber || '-'}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-800">
                      {log.token?.service?.name || '-'}
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      <span className="font-semibold text-slate-900">{log.performedBy?.name || 'System'}</span>
                      {log.counter && <span className="block text-[10px] text-slate-400">at {log.counter.name}</span>}
                    </td>
                    <td className="py-4 px-6 text-slate-500 max-w-sm">
                      {log.details || '-'}
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

export default AuditLogsPage;
