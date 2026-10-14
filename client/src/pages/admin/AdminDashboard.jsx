import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CheckCircle,
  Clock,
  Monitor,
  Layers,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import { useSocket } from '../../context/SocketContext';

const AdminDashboard = () => {
  const { socket } = useSocket();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingSwitchCount, setPendingSwitchCount] = useState(0);

  const fetchAnalytics = async () => {
    try {
      const [res, switchRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/counter-switch-requests', { params: { status: 'pending' } }),
      ]);
      if (res.data.success) {
        setData(res.data.data);
      }
      if (switchRes.data.success) {
        setPendingSwitchCount(switchRes.data.data.length);
      }
    } catch (err) {
      console.warn('Analytics fetch notice:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleSync = () => {
      fetchAnalytics();
    };
    socket.on('admin:stats_updated', handleSync);
    socket.on('queue:updated', handleSync);
    socket.on('counter_switch:requested', handleSync);
    socket.on('counter_switch:resolved', handleSync);
    socket.on('counter_switch:cancelled', handleSync);
    return () => {
      socket.off('admin:stats_updated', handleSync);
      socket.off('queue:updated', handleSync);
      socket.off('counter_switch:requested', handleSync);
      socket.off('counter_switch:resolved', handleSync);
      socket.off('counter_switch:cancelled', handleSync);
    };
  }, [socket]);

  const summary = data?.summary;
  const volumeByHour = data?.volumeByHour || [];
  const statusRatio = data?.tokenStatusRatio || [];
  const counterUtil = data?.counterUtilization || [];
  const waitByService = data?.waitTimeByService || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Executive Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time branch throughput, queue volume, counter productivity, and wait time benchmarks
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-slate-400">Live Telemetry</span>
          <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
        </div>
      </div>

      {/* Pending Counter Switch Alert Banner */}
      {pendingSwitchCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
              <Clock className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold">
                {pendingSwitchCount} Staff Counter Switch Request{pendingSwitchCount > 1 ? 's' : ''} Awaiting Approval
              </p>
              <p className="text-[11px] text-amber-800">
                Staff operators have requested desk transfers requiring administrator authorization.
              </p>
            </div>
          </div>
          <Link
            to="/admin/counters"
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shrink-0 inline-flex items-center justify-center gap-1 shadow-xs transition-colors"
          >
            <span>Review In Counter Setup</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Customers"
          value={summary?.totalCustomers || 0}
          subtitle="Registered accounts"
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Waiting Tokens"
          value={summary?.waitingTokens || 0}
          subtitle="Active in queue"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="In Progress"
          value={summary?.inProgressTokens || 0}
          subtitle="Being served"
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title="Completed"
          value={summary?.completedTokens || 0}
          subtitle={`${summary?.completedToday || 0} served today`}
          icon={CheckCircle}
          color="teal"
        />
        <StatCard
          title="Avg Wait Time"
          value={`~${summary?.avgWaitTimeMinutes || 8}m`}
          subtitle="Empirical duration"
          icon={Clock}
          color="indigo"
        />
        <StatCard
          title="Active Counters"
          value={summary?.activeCounters || 0}
          subtitle="Currently open"
          icon={Monitor}
          color="teal"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Queue Volume by Hour */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-subtle">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Queue Activity Over Time</h3>
              <p className="text-xs text-slate-400">Completed vs waiting token volume</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeByHour} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorWaiting" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" name="Completed" />
                <Area type="monotone" dataKey="waiting" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorWaiting)" name="Waiting" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Token Status Distribution */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-subtle">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Token Status Distribution</h3>
              <p className="text-xs text-slate-400">Total lifetime token lifecycle breakdown</p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusRatio}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusRatio.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Counter Productivity */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-subtle">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Counter Throughput</h3>
              <p className="text-xs text-slate-400">Total customer visits processed per counter</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={counterUtil} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="counterName" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="totalServed" fill="#4f46e5" radius={[6, 6, 0, 0]} name="Served Tokens" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Average Waiting Time by Service */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-subtle">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Wait Times by Service (Mins)</h3>
              <p className="text-xs text-slate-400">Actual vs configured benchmark</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waitByService} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="code" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="avgWaitMinutes" fill="#0d9488" radius={[6, 6, 0, 0]} name="Actual Wait (m)" />
                <Bar dataKey="benchmarkDuration" fill="#cbd5e1" radius={[6, 6, 0, 0]} name="Benchmark (m)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
