import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Layers3,
  Clock,
  ShieldCheck,
  Zap,
  ArrowRight,
  Users,
  CheckCircle2,
  Sparkles,
  Smartphone,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get('/queue/services');
        if (res.data.success) {
          setServices(res.data.data);
        }
      } catch (err) {
        // Fallback demo data if offline
      }
    };
    fetchServices();
  }, []);

  return (
    <div className="min-h-screen bg-surface-50 text-slate-800 flex flex-col">
      {/* Top Navbar */}
      <header className="h-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-8 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white shrink-0">
            <Layers3 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 leading-none">
              Queue<span className="text-indigo-600">Less</span>
            </h1>
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">
              Intelligent Virtual Queue
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <button
              onClick={() => {
                const map = { customer: '/customer', staff: '/staff', admin: '/admin' };
                navigate(map[user?.role] || '/customer');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
            >
              <span>{user?.role?.toUpperCase()} Portal</span> <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-24 px-6 sm:px-12 max-w-7xl mx-auto text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-6 animate-pulse-subtle">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Next-Generation Virtual Queue & Wait Time Intelligence</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
          Eliminate Standing in Line with{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-800 bg-clip-text text-transparent">
            Intelligent Digital Tokens
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          QueueLess seamlessly orchestrates customer arrivals, transparent wait times, counter routing, and real-time announcements with zero physical queues.
        </p>

        {/* Quick Role Launch Pills */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/login?role=customer"
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 transition-all hover:scale-105 active:scale-95"
          >
            <span>Customer Portal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login?role=staff"
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-200/90 shadow-subtle hover:border-indigo-300 transition-all hover:scale-105 active:scale-95"
          >
            <span>Staff Counter Console</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
          <Link
            to="/login?role=admin"
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-200/90 shadow-subtle hover:border-indigo-300 transition-all hover:scale-105 active:scale-95"
          >
            <span>Administrator Analytics</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
        </div>

        {/* Live Service Preview Bar */}
        {services.length > 0 && (
          <div className="mt-16 bg-white rounded-3xl p-6 border border-slate-200 shadow-premium max-w-4xl mx-auto text-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Live Branch Service Queues
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Synchronized via Socket.IO</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              {services.slice(0, 4).map((svc) => (
                <div key={svc.id || svc._id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white text-slate-700 font-mono shadow-xs">
                    {svc.code}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 mt-2 truncate">{svc.name}</h4>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{svc.waitingCount || 0} in line</span>
                    <span className="font-bold text-indigo-600">~{svc.estimatedMinutes || 10}m</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 px-6 sm:px-12 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Engineered for Precision & Operational Flow
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500">
              Transform banking branches, hospitals, and service centers into frictionless operations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Dynamic Wait Estimation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Empirical calculations based on open counter throughput, position in line, and historical service durations. Transparent and predictable.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Real-Time Synchronization</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Socket.IO event bus connects customer smartphones and staff consoles instantly. Token status transitions broadcast with sub-second latency.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-600/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Complete Compliance Audit</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Full lifecycle tracking: token issuance, call next, skip customer, recall chime, and completion notes for complete administrative accountability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 px-6 sm:px-12 border-t border-slate-200 text-center text-xs text-slate-400">
        <p>© 2026 QueueLess Intelligent Queue Management System. Postgraduate Software Engineering Project.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
