import React from 'react';
import { formatVND } from '../../services/calculation';
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
        <div 
          onClick={onOpenLuckyWheel}
          className="tactile-card p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer hover:border-amber-400/50 hover:scale-[1.01] transition-all group relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.06), rgba(249, 115, 22, 0.03))' }}
        >
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 group-hover:rotate-45 transition-transform">
              <RotateCw className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-[#18181b] dark:text-white">
                  Vòng xoay may mắn 🎡
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  Game
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Ai trả chầu cafe, trà sữa hôm nay? Quay ngay!
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0 relative z-10 group-hover:translate-x-0.5 transition-transform">
            Chơi →
          </span>
        </div>

        {/* Wrapped Recap Card */}
        <div 
          onClick={onOpenTripWrapped}
          className="tactile-card p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer hover:border-purple-400/50 hover:scale-[1.01] transition-all group relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.06), rgba(79, 70, 229, 0.03))' }}
        >
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-[#18181b] dark:text-white">
                  Spliqo Wrapped 📊
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300">
                  Recap
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Ký ức tài chính, đại gia chi bạo & thẻ Story
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-purple-600 dark:text-purple-400 shrink-0 relative z-10 group-hover:translate-x-0.5 transition-transform">
            Xem →
          </span>
        </div>
      </div>

      {/* Top Payer Highlight */}
      {balances?.topPayer && (
        <div 
          className="p-5 rounded-3xl liquid-glass-card flex items-center justify-between border border-teal-500/20" 
          style={{ background: 'linear-gradient(135deg, rgba(20,184,166,0.08), rgba(16,185,129,0.05))' }}
        >
          <div className="flex items-center gap-3">
            <img
              src={balances.topPayer.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${balances.topPayer.userId || balances.topPayer.uid || balances.topPayer.id}`}
              alt=""
              className="w-12 h-12 rounded-2xl bg-white/50 dark:bg-white/10 shadow-lg ring-2 ring-white/40 dark:ring-white/10"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                  {t('topPayerTitle', 'Người chi trả nhiều nhất')}
                </span>
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white">
                {balances.topPayer.displayName}
              </div>
              <div className="text-xs text-slate-500 dark:text-zinc-400">
                {t('advancedPaid', 'Đã ứng trước thanh toán:')}{' '}
                <strong className="text-emerald-700 dark:text-emerald-400">
                  {formatVND(balances.topPayer.totalPaid)}
                </strong>
              </div>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-xs text-slate-400 dark:text-zinc-400">
              {t('debtStatus', 'Trạng thái công nợ')}
            </span>
            <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
              +{formatVND(balances.topPayer.balance)}
            </div>
          </div>
        </div>
      )}

      {/* Members Balance Table */}
      <div className="tactile-card overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e6e4dc] dark:border-[#272732] flex items-center justify-between bg-[#f4f3ec] dark:bg-[#1a1a22]">
          <h3 className="text-sm font-bold text-[#18181b] dark:text-white">
            {t('memberBalanceTableTitle', 'Bảng cân đối công nợ từng thành viên')}
          </h3>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {t('balanceFormula', 'Balance = Đã trả - Phải chịu')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider bg-[#faf9f6] dark:bg-[#15151c] border-b border-[#e6e4dc] dark:border-[#272732]">
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
                      {formatVND(m.totalPaid)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium text-slate-700 dark:text-zinc-200">
                      {formatVND(m.totalOwed)}
                    </td>

                    <td className="py-3.5 px-6 text-right">
                      <span
                        className={`font-mono font-bold px-3 py-1 rounded-xl text-xs sm:text-sm inline-block backdrop-blur-sm ${
                          isCreditor
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300/30 dark:border-emerald-500/30'
                            : isDebtor
                            ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-300/30 dark:border-rose-500/30'
                            : 'bg-[#f4f3ec] dark:bg-white/10 text-slate-600 dark:text-zinc-300 border border-[#e6e4dc] dark:border-white/10'
                        }`}
                      >
                        {isCreditor ? `+${formatVND(m.balance)}` : isDebtor ? `-${formatVND(Math.abs(m.balance))}` : '0đ (Cân bằng)'}
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
