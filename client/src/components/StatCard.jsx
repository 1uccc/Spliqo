import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'emerald', subtitle }) {
  const colorMap = {
    emerald: {
      badge: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
      iconBg: 'bg-[#18181b] dark:bg-emerald-500/20 text-white dark:text-emerald-400 border border-transparent dark:border-emerald-500/30',
      accentText: 'text-emerald-600 dark:text-emerald-400',
    },
    rose: {
      badge: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/40',
      iconBg: 'bg-rose-950 dark:bg-rose-500/20 text-rose-200 dark:text-rose-400 border border-transparent dark:border-rose-500/30',
      accentText: 'text-rose-600 dark:text-rose-400',
    },
    indigo: {
      badge: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40',
      iconBg: 'bg-[#18181b] dark:bg-indigo-500/20 text-white dark:text-indigo-400 border border-transparent dark:border-indigo-500/30',
      accentText: 'text-indigo-600 dark:text-indigo-400',
    },
    slate: {
      badge: 'bg-[#f4f3ec] dark:bg-[#23232c] text-zinc-800 dark:text-zinc-200 border-[#e6e4dc] dark:border-[#32323e]',
      iconBg: 'bg-[#18181b] dark:bg-white text-white dark:text-[#18181b]',
      accentText: 'text-[#18181b] dark:text-white',
    },
  };

  const current = colorMap[color] || colorMap.slate;

  return (
    <div className="tactile-card p-5 relative overflow-hidden group flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 tracking-wide">{title}</span>
        <div className={`w-9 h-9 rounded-full ${current.iconBg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-sm`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div>
        <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${current.accentText}`}>
          {value}
        </div>
        {subtitle && (
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#f4f3ec] dark:bg-[#23232c] text-zinc-600 dark:text-zinc-300 border border-[#e6e4dc] dark:border-[#32323e]">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
