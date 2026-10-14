import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'indigo', badge }) => {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
      pill: 'bg-indigo-100 text-indigo-700',
    },
    teal: {
      bg: 'bg-teal-50',
      text: 'text-teal-600',
      border: 'border-teal-100',
      pill: 'bg-teal-100 text-teal-700',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
      pill: 'bg-amber-100 text-amber-700',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100',
      pill: 'bg-rose-100 text-rose-700',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100',
      pill: 'bg-purple-100 text-purple-700',
    },
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle hover:shadow-premium transition-all duration-300">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider uppercase text-slate-500">{title}</span>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl ${scheme.bg} ${scheme.text} flex items-center justify-center`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</span>
        {badge && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${scheme.pill}`}>
            {badge}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
};

export default StatCard;
