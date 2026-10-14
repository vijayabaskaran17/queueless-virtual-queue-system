import React from 'react';
import { CheckCircle2, Clock, PhoneCall, Sparkles, XCircle, AlertCircle } from 'lucide-react';

const QueueProgress = ({ status, queuePosition }) => {
  if (status === 'cancelled') {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3">
        <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
        <div>
          <h4 className="text-sm font-bold text-rose-800">Token Cancelled</h4>
          <p className="text-xs text-rose-600">This token was withdrawn from the active queue.</p>
        </div>
      </div>
    );
  }

  if (status === 'skipped') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
        <div>
          <h4 className="text-sm font-bold text-amber-800">Token Skipped</h4>
          <p className="text-xs text-amber-700">You did not appear when called. Please speak with staff to recall your turn.</p>
        </div>
      </div>
    );
  }

  const steps = [
    { key: 'joined', label: 'Token Issued', icon: CheckCircle2 },
    { key: 'waiting', label: queuePosition === 1 ? 'Next Up!' : `#${queuePosition} in Line`, icon: Clock },
    { key: 'called', label: 'Called to Counter', icon: PhoneCall },
    { key: 'in_progress', label: 'In Service', icon: Sparkles },
    { key: 'completed', label: 'Completed', icon: CheckCircle2 },
  ];

  const getStepIndex = (s) => {
    switch (s) {
      case 'waiting':
        return 1;
      case 'called':
        return 2;
      case 'in_progress':
        return 3;
      case 'completed':
        return 4;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(status);

  return (
    <div className="w-full py-3">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 z-0">
          <div
            className="h-full bg-indigo-600 transition-all duration-500 rounded-full"
            style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCurrent
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-md scale-110'
                    : isDone
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border-2 border-slate-200 text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`text-[11px] mt-2 font-medium text-center whitespace-nowrap ${
                  isCurrent
                    ? 'text-indigo-600 font-bold'
                    : isDone
                    ? 'text-slate-800'
                    : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QueueProgress;
