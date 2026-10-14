import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'emerald', subtitle }) {
  const colorMap = {
    emerald: {
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      iconBg: 'bg-[#18181b] text-white',
      accentText: 'text-emerald-700',
    },
    rose: {
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
      iconBg: 'bg-rose-950 text-rose-200',
      accentText: 'text-rose-700',
    },
    indigo: {
      badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      iconBg: 'bg-[#18181b] text-white',
      accentText: 'text-indigo-700',
    },
    slate: {
      badge: 'bg-[#f4f3ec] text-zinc-800 border-[#e6e4dc]',
      iconBg: 'bg-[#18181b] text-white',
      accentText: 'text-zinc-900',
    },
  };

  const current = colorMap[color] || colorMap.slate;

  return (
    <div className="tactile-card p-5 relative overflow-hidden group flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-zinc-500 tracking-wide">{title}</span>
        <div className={`w-9 h-9 rounded-full ${current.iconBg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-sm`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div>
        <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${current.accentText}`}>
          {value}
        </div>
        {subtitle && (
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#f4f3ec] text-zinc-600 border border-[#e6e4dc]">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
