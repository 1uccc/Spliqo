import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import TripBudgetGauge from './TripBudgetGauge';
import { Sparkles, RotateCw, Crown } from 'lucide-react';

export default function TripOverviewTab({
  trip,
  expenses = [],
  members = [],
  balances,
  currentUser,
  onSaveBudget,
  onOpenLuckyWheel,
  onOpenTripWrapped,
  t
}) {
  const { formatMoney } = useLanguage();
  const fmt = formatMoney;

  return (
    <div className="space-y-6">
      {/* 1. SMART TRIP BUDGET GAUGE & BURN RATE WARNING */}
      <TripBudgetGauge
        trip={trip}
        expenses={expenses}
        members={members}
        balances={balances}
        onSaveBudget={onSaveBudget}
        t={t}
      />

      {/* Gamification & Wrapped Quick Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Lucky Wheel Card */}
        <button
          type="button"
          onClick={onOpenLuckyWheel}
          className="w-full text-left tactile-card p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer hover:border-amber-400/50 hover:scale-[1.01] transition-all group relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.06), rgba(249, 115, 22, 0.03))' }}
        >
          <div className="flex items-center gap-3 relative z-10 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:rotate-45 transition-transform">
              <RotateCw className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-extrabold text-[#18181b] dark:text-white">
                  {t('luckyWheelCardTitle', 'Vòng xoay may mắn')}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300">
                  {t('gameTag', 'Game')}
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                {t('luckyWheelCardDesc', 'Ai trả chầu cafe, trà sữa hôm nay? Quay ngay!')}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-800 dark:text-amber-400 shrink-0 relative z-10 group-hover:translate-x-0.5 transition-transform">
            {t('playBtn', 'Chơi →')}
          </span>
        </button>

        {/* Wrapped Recap Card (Tactile Clay Style) */}
        <button
          type="button"
          onClick={onOpenTripWrapped}
          className="w-full text-left tactile-card p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer hover:border-emerald-400/50 hover:scale-[1.01] transition-all group relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.07), rgba(20, 184, 166, 0.03))' }}
        >
          <div className="flex items-center gap-3 relative z-10 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-extrabold text-[#18181b] dark:text-white">
                  {t('wrappedCardTitle', 'Spliqo Wrapped')}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300">
                  {t('recapTag', 'Recap')}
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                {t('wrappedCardDesc', 'Ký ức tài chính, đại gia chi bạo & thẻ Story')}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 shrink-0 relative z-10 group-hover:translate-x-0.5 transition-transform">
            {t('viewBtn', 'Xem →')}
          </span>
        </button>
      </div>

      {/* Top Payer Highlight */}
      {balances?.topPayer && (
        <div
          className="tactile-card p-5 flex items-center justify-between border border-emerald-500/25"
          style={{ background: 'linear-gradient(135deg, rgba(20,184,166,0.08), rgba(16,185,129,0.05))' }}
        >
          <div className="flex items-center gap-3">
            <img
              src={balances.topPayer.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${balances.topPayer.userId || balances.topPayer.uid || balances.topPayer.id}`}
              alt=""
              className="w-12 h-12 rounded-2xl bg-white/70 dark:bg-white/10 shadow-md ring-2 ring-white/40 dark:ring-white/10"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-wider text-teal-900 dark:text-teal-300">
                  {t('topPayerTitle', 'Người chi trả nhiều nhất')}
                </span>
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white">
                {balances.topPayer.displayName}
              </div>
              <div className="text-xs text-zinc-700 dark:text-zinc-300">
                {t('advancedPaid', 'Đã ứng trước thanh toán:')}{' '}
                <strong className="font-mono text-emerald-800 dark:text-emerald-300">
                  {fmt(balances.topPayer.totalPaid)}
                </strong>
              </div>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium block">
              {t('debtStatus', 'Trạng thái công nợ')}
            </span>
            <div className="text-sm font-extrabold font-mono text-emerald-800 dark:text-emerald-300">
              +{fmt(balances.topPayer.balance)}
            </div>
          </div>
        </div>
      )}

      {/* Members Balance Table (Responsive: clean card list on mobile, 4-col table on sm+) */}
      <div className="tactile-card overflow-hidden">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#e6e4dc] dark:border-[#272732] flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-[#f4f3ec] dark:bg-[#1a1a22]">
          <h3 className="text-sm font-bold text-[#18181b] dark:text-white">
            {t('memberBalanceTableTitle', 'Bảng cân đối công nợ từng thành viên')}
          </h3>
          <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
            {t('balanceFormula', 'Balance = Đã trả - Phải chịu')}
          </span>
        </div>

        {/* Mobile View (< 640px): Zero horizontal scroll, full balance pill always visible */}
        <div className="sm:hidden divide-y divide-[#e6e4dc] dark:divide-[#272732]">
          {balances?.members?.map((m) => {
            const memberId = m.userId || m.uid || m.id;
            const isCreditor = m.balance > 0;
            const isDebtor = m.balance < 0;
            const isCurrentUser = memberId === (currentUser?.uid || currentUser?.userId || currentUser?.id);

            return (
              <div key={memberId} className="p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <img
                      src={m.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${memberId}`}
                      alt=""
                      className="w-9 h-9 rounded-xl bg-white/50 dark:bg-white/10 ring-1 ring-black/5 dark:ring-white/10 shrink-0 object-cover"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-[#18181b] dark:text-white truncate">
                        {m.displayName}
                      </div>
                      {isCurrentUser && (
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold block">
                          ({t('you', 'Bạn')})
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`font-mono font-bold px-2.5 py-1 rounded-xl text-xs shrink-0 ${
                      isCreditor
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300/30 dark:border-emerald-500/30'
                        : isDebtor
                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-300/30 dark:border-rose-500/30'
                        : 'bg-[#f4f3ec] dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-[#e6e4dc] dark:border-zinc-700/60'
                    }`}
                  >
                    {isCreditor
                      ? `+${fmt(m.balance)}`
                      : isDebtor
                      ? `-${fmt(Math.abs(m.balance))}`
                      : `${fmt(0)} (${t('balancedShort', 'Cân bằng')})`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="px-2.5 py-1.5 rounded-xl bg-[#faf9f6] dark:bg-[#1a1a22] border border-[#e6e4dc]/70 dark:border-[#272732] flex items-center justify-between gap-1.5">
                    <span className="text-zinc-600 dark:text-zinc-400">{t('paid', 'Đã trả')}</span>
                    <span className="font-mono font-semibold text-[#18181b] dark:text-zinc-200 truncate">{fmt(m.totalPaid)}</span>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-xl bg-[#faf9f6] dark:bg-[#1a1a22] border border-[#e6e4dc]/70 dark:border-[#272732] flex items-center justify-between gap-1.5">
                    <span className="text-zinc-600 dark:text-zinc-400">{t('owed', 'Phải chịu')}</span>
                    <span className="font-mono font-semibold text-[#18181b] dark:text-zinc-200 truncate">{fmt(m.totalOwed)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop / Tablet Table (sm+) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider bg-[#faf9f6] dark:bg-[#15151c] border-b border-[#e6e4dc] dark:border-[#272732]">
                <th className="py-3 px-6">{t('member', 'Thành viên')}</th>
                <th className="py-3 px-4 text-right">{t('paid', 'Đã trả')}</th>
                <th className="py-3 px-4 text-right">{t('owed', 'Phải chịu')}</th>
                <th className="py-3 px-6 text-right">{t('balance', 'Số dư')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6e4dc] dark:divide-[#272732]">
              {balances?.members?.map((m) => {
                const memberId = m.userId || m.uid || m.id;
                const isCreditor = m.balance > 0;
                const isDebtor = m.balance < 0;
                const isCurrentUser = memberId === (currentUser?.uid || currentUser?.userId || currentUser?.id);

                return (
                  <tr key={memberId} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={m.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${memberId}`}
                          alt=""
                          className="w-8 h-8 rounded-xl bg-white/50 dark:bg-white/10 ring-1 ring-white/30 dark:ring-white/10"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{m.displayName}</div>
                          {isCurrentUser && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              ({t('you', 'Bạn')})
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium text-slate-700 dark:text-zinc-200">
                      {fmt(m.totalPaid)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium text-slate-700 dark:text-zinc-200">
                      {fmt(m.totalOwed)}
                    </td>

                    <td className="py-3.5 px-6 text-right">
                      <span
                        className={`font-mono font-bold px-3 py-1 rounded-xl text-xs sm:text-sm inline-block backdrop-blur-sm ${
                          isCreditor
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300/30 dark:border-emerald-500/30'
                            : isDebtor
                            ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-300/30 dark:border-rose-500/30'
                            : 'bg-[#f4f3ec] dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-300 border border-[#e6e4dc] dark:border-zinc-700/60'
                        }`}
                      >
                        {isCreditor ? `+${fmt(m.balance)}` : isDebtor ? `-${fmt(Math.abs(m.balance))}` : `${fmt(0)} (${t('balancedShort', 'Cân bằng')})`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
