import React from 'react';
import { Clock, MapPin, AlertCircle, Ban, ArrowRight, ShieldCheck } from 'lucide-react';

const TokenCard = ({
  token,
  queuePosition,
  estimatedWaitTime,
  currentlyServing,
  servingCounter,
  onCancel,
  showActions = true,
}) => {
  if (!token) return null;

  const statusColors = {
    waiting: 'bg-amber-50 text-amber-700 border-amber-200',
    called: 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
    completed: 'bg-teal-50 text-teal-700 border-teal-200',
    skipped: 'bg-slate-100 text-slate-700 border-slate-300',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const statusLabels = {
    waiting: 'Waiting in Queue',
    called: 'Please Proceed to Counter',
    in_progress: 'Currently In Service',
    completed: 'Service Completed',
    skipped: 'Skipped - Call Staff',
    cancelled: 'Cancelled',
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-premium overflow-hidden transition-all duration-300 hover:border-indigo-200">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Verified Digital Token
            </span>
          </div>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border ${
              statusColors[token.status] || 'bg-slate-800 text-slate-200'
            }`}
          >
            {statusLabels[token.status] || token.status}
          </span>
        </div>

        <div className="mt-5 flex items-baseline justify-between">
          <div>
            <span className="text-xs text-indigo-200 font-medium">Your Token Number</span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white font-mono mt-1">
              {token.tokenNumber}
            </h1>
          </div>
          <div className="text-right">
            <span className="text-xs text-indigo-200 font-medium">Service</span>
            <h3 className="text-base sm:text-lg font-bold text-white mt-1">
              {token.service?.name || 'General Inquiry'}
            </h3>
          </div>
        </div>
      </div>

      {/* Ticket Body with perforated visual dividers */}
      <div className="p-6 space-y-6 bg-white relative">
        {/* Real-time stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Queue Position</span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {token.status === 'waiting' ? `#${queuePosition || 1}` : 'Serving'}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {token.status === 'waiting'
                ? queuePosition === 1
                  ? 'You are next!'
                  : `${(queuePosition || 1) - 1} ahead of you`
                : 'Turn active'}
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Est. Waiting Time</span>
            <div className="text-2xl font-black text-indigo-600 mt-1 flex items-center gap-1">
              <Clock className="w-5 h-5 text-indigo-500" />
              <span>{token.status === 'waiting' ? `~${estimatedWaitTime || 5}m` : '0m'}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Based on active counters</p>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Now Serving</span>
            <div className="text-2xl font-black text-teal-600 font-mono mt-1">
              {currentlyServing || 'None'}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {servingCounter ? servingCounter : 'Awaiting counter'}
            </p>
          </div>
        </div>

        {/* Counter assignment callout if called or in progress */}
        {token.status === 'called' && (
          <div className="bg-indigo-50 border-2 border-indigo-500 rounded-2xl p-5 text-center animate-bounce">
            <h4 className="text-lg font-black text-indigo-950">🚨 YOUR TURN IS UP!</h4>
            <p className="text-sm font-semibold text-indigo-700 mt-1">
              Please proceed immediately to{' '}
              <span className="underline decoration-indigo-500 font-black">
                {token.counter?.name || 'Assigned Counter'}
              </span>
            </p>
          </div>
        )}

        {/* Notes if any */}
        {token.notes && (
          <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-600">
            <span className="font-semibold text-slate-700">Service Notes:</span> {token.notes}
          </div>
        )}

        {/* Actions */}
        {showActions && token.status === 'waiting' && onCancel && (
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <div className="text-xs text-slate-400">
              Issued at {new Date(token.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <button
              onClick={() => onCancel(token._id)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
            >
              <Ban className="w-3.5 h-3.5" />
              Cancel Token
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenCard;
