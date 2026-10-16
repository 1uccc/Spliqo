import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, Users, Share2, Check, Flag, ArrowRight, Sparkles, Calendar } from 'lucide-react';
import { formatVND } from '../../services/calculation';
import { getTripVisual } from '../../utils/tripVisuals';

// Curated harmonious, gentle pastel color palettes for each trip
export const PASTEL_TRIP_THEMES = [
  {
    id: 'mint',
    name: 'Bạc hà dịu mát',
    accentBar: 'from-emerald-400 to-teal-400',
    cardBg: 'bg-gradient-to-br from-[#f2faf5] via-[#f7fcf9] to-[#eaf6ef] dark:from-[#12231a] dark:via-[#16291f] dark:to-[#0f1d15]',
    cardBorder: 'border-emerald-200 hover:border-emerald-300 dark:border-emerald-800/50 dark:hover:border-emerald-600/60',
    hoverGlow: 'hover:shadow-emerald-500/10',
    avatarBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-700/50',
    chipBg: 'bg-white/85 dark:bg-white/5 border border-emerald-100/90 dark:border-emerald-900/40',
    badgeActive: 'bg-emerald-100/90 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
  },
  {
    id: 'lavender',
    name: 'Oải hương thanh lịch',
    accentBar: 'from-purple-400 to-indigo-400',
    cardBg: 'bg-gradient-to-br from-[#f8f5fd] via-[#fbf9fe] to-[#f1eafd] dark:from-[#20172e] dark:via-[#261b36] dark:to-[#181123]',
    cardBorder: 'border-purple-200 hover:border-purple-300 dark:border-purple-800/50 dark:hover:border-purple-600/60',
    hoverGlow: 'hover:shadow-purple-500/10',
    avatarBg: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 border border-purple-200/80 dark:border-purple-700/50',
    chipBg: 'bg-white/85 dark:bg-white/5 border border-purple-100/90 dark:border-purple-900/40',
    badgeActive: 'bg-purple-100/90 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/50',
    badgeText: 'text-purple-800 dark:text-purple-300',
  },
  {
    id: 'peach',
    name: 'Cam đào ấm áp',
    accentBar: 'from-orange-400 to-amber-400',
    cardBg: 'bg-gradient-to-br from-[#fef7f2] via-[#fffbf8] to-[#fdeee4] dark:from-[#281b14] dark:via-[#2f2017] dark:to-[#1e130d]',
    cardBorder: 'border-orange-200 hover:border-orange-300 dark:border-orange-800/50 dark:hover:border-orange-600/60',
    hoverGlow: 'hover:shadow-orange-500/10',
    avatarBg: 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200 border border-orange-200/80 dark:border-orange-700/50',
    chipBg: 'bg-white/85 dark:bg-white/5 border border-orange-100/90 dark:border-orange-900/40',
    badgeActive: 'bg-orange-100/90 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300 border border-orange-200/80 dark:border-orange-800/50',
    badgeText: 'text-orange-800 dark:text-orange-300',
  },
  {
    id: 'sky',
    name: 'Xanh mây trong trẻo',
    accentBar: 'from-sky-400 to-blue-400',
    cardBg: 'bg-gradient-to-br from-[#f1f8fd] via-[#f7fbff] to-[#e6f2fb] dark:from-[#12202f] dark:via-[#162738] dark:to-[#0e1824]',
    cardBorder: 'border-sky-200 hover:border-sky-300 dark:border-sky-800/50 dark:hover:border-sky-600/60',
    hoverGlow: 'hover:shadow-sky-500/10',
    avatarBg: 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200 border border-sky-200/80 dark:border-sky-700/50',
    chipBg: 'bg-white/85 dark:bg-white/5 border border-sky-100/90 dark:border-sky-900/40',
    badgeActive: 'bg-sky-100/90 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/50',
    badgeText: 'text-sky-800 dark:text-sky-300',
  },
  {
    id: 'rose',
    name: 'Hồng phấn ngọt ngào',
    accentBar: 'from-pink-400 to-rose-400',
    cardBg: 'bg-gradient-to-br from-[#fef4f6] via-[#fff8f9] to-[#fde7ec] dark:from-[#2a1620] dark:via-[#311a26] dark:to-[#1e0f16]',
    cardBorder: 'border-pink-200 hover:border-pink-300 dark:border-pink-800/50 dark:hover:border-pink-600/60',
    hoverGlow: 'hover:shadow-pink-500/10',
    avatarBg: 'bg-pink-100 text-pink-800 dark:bg-pink-900/60 dark:text-pink-200 border border-pink-200/80 dark:border-pink-700/50',
    chipBg: 'bg-white/85 dark:bg-white/5 border border-pink-100/90 dark:border-pink-900/40',
    badgeActive: 'bg-pink-100/90 text-pink-800 dark:bg-pink-950/70 dark:text-pink-300 border border-pink-200/80 dark:border-pink-800/50',
    badgeText: 'text-pink-800 dark:text-pink-300',
  },
  {
    id: 'butter',
    name: 'Kem bơ êm dịu',
    accentBar: 'from-amber-400 to-yellow-400',
    cardBg: 'bg-gradient-to-br from-[#fefce9] via-[#fffef5] to-[#fbf6cf] dark:from-[#272112] dark:via-[#2d2716] dark:to-[#1a160c]',
    cardBorder: 'border-amber-200 hover:border-amber-300 dark:border-amber-800/50 dark:hover:border-amber-600/60',
    hoverGlow: 'hover:shadow-amber-500/10',
    avatarBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-200/80 dark:border-amber-700/50',
    chipBg: 'bg-white/85 dark:bg-white/5 border border-amber-100/90 dark:border-amber-900/40',
    badgeActive: 'bg-amber-100/90 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/50',
    badgeText: 'text-amber-800 dark:text-amber-300',
  },
  {
    id: 'teal',
    name: 'Xanh ngọc bích',
    accentBar: 'from-teal-400 to-cyan-400',
    cardBg: 'bg-gradient-to-br from-[#f1faf8] via-[#f7fcfb] to-[#e4f6f3] dark:from-[#112322] dark:via-[#152a29] dark:to-[#0c1817]',
    cardBorder: 'border-teal-200 hover:border-teal-300 dark:border-teal-800/50 dark:hover:border-teal-600/60',
    hoverGlow: 'hover:shadow-teal-500/10',
    avatarBg: 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200 border border-teal-200/80 dark:border-teal-700/50',
    chipBg: 'bg-white/85 dark:bg-white/5 border border-teal-100/90 dark:border-teal-900/40',
    badgeActive: 'bg-teal-100/90 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/50',
    badgeText: 'text-teal-800 dark:text-teal-300',
  },
  {
    id: 'indigo',
    name: 'Chàm pastel thanh tú',
    accentBar: 'from-indigo-400 to-purple-400',
    cardBg: 'bg-gradient-to-br from-[#f3f5fe] via-[#f9faff] to-[#e9edfc] dark:from-[#151c31] dark:via-[#1a223a] dark:to-[#0f1423]',
    cardBorder: 'border-indigo-200 hover:border-indigo-300 dark:border-indigo-800/50 dark:hover:border-indigo-600/60',
    hoverGlow: 'hover:shadow-indigo-500/10',
    avatarBg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200 border border-indigo-200/80 dark:border-indigo-700/50',
    chipBg: 'bg-white/85 dark:bg-white/5 border border-indigo-100/90 dark:border-indigo-900/40',
    badgeActive: 'bg-indigo-100/90 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/50',
    badgeText: 'text-indigo-800 dark:text-indigo-300',
  }
];

// Deterministic pastel color mapping based on trip ID or tripCode
export function getTripTheme(tripId = '') {
  if (!tripId) return PASTEL_TRIP_THEMES[0];
  let hash = 0;
  for (let i = 0; i < tripId.length; i++) {
    hash = (hash << 5) - hash + tripId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PASTEL_TRIP_THEMES.length;
  return PASTEL_TRIP_THEMES[index];
}

export default function TripCard({
  trip,
  onShare,
  t = (key, fallback) => fallback
}) {
  const navigate = useNavigate();
  const isCompleted = trip.status === 'COMPLETED';
  const theme = getTripTheme(trip.id || trip.tripCode || '');
  const visual = getTripVisual(trip);
  const VisualIcon = visual.Icon;

  const handleCardClick = () => {
    navigate(`/trips/${trip.id}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={`rounded-3xl p-5 border transition-all duration-300 flex flex-col justify-between group cursor-pointer relative overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1.5 select-none ${theme.cardBg} ${theme.cardBorder} ${theme.hoverGlow}`}
    >
      {/* Top subtle decorative color bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${theme.accentBar} opacity-80`} />

      {/* Ambient Decorative Background Watermark Icon */}
      <div className="absolute -right-4 -bottom-4 opacity-[0.06] dark:opacity-[0.08] pointer-events-none transform -rotate-12 transition-transform duration-500 group-hover:scale-125 group-hover:-rotate-6 text-[#18181b] dark:text-white">
        <VisualIcon className="w-36 h-36 stroke-[1.1]" />
      </div>

      <div className="relative z-10">
        {/* Card Header: Icon Avatar + Name/Code + Status Badge + Share Button */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs transition-transform duration-300 group-hover:scale-110 relative overflow-hidden bg-gradient-to-br ${visual.gradient} text-white`}
              title={`${trip.name} • ${visual.label}`}
            >
              <VisualIcon className="w-5 h-5 stroke-[2.3] drop-shadow-xs" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-extrabold text-[#18181b] dark:text-white truncate group-hover:underline underline-offset-2 transition-colors">
                {trip.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400">
                  #{trip.tripCode}
                </span>
                {trip.startDate && (
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-0.5">
                    • <Calendar className="w-2.5 h-2.5 inline" /> {trip.startDate}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Status Badge */}
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs ${
                isCompleted
                  ? 'bg-emerald-100/90 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300/70 dark:border-emerald-800/50'
                  : theme.badgeActive
              }`}
            >
              {isCompleted ? (
                <>
                  <Flag className="w-3 h-3 stroke-[2.2]" />
                  <span>{t('completed', 'Đã chốt sổ')}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 stroke-[2.2] animate-pulse" />
                  <span>{t('active', 'Đang diễn ra')}</span>
                </>
              )}
            </span>

            {/* Share / Invite QR Button */}
            {onShare && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onShare(trip);
                }}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-white/90 dark:bg-black/30 hover:bg-white dark:hover:bg-white/20 text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white transition-all border border-black/5 dark:border-white/10 shadow-xs cursor-pointer hover:scale-105 active:scale-95"
                title="Mời & Chia sẻ mã QR chuyến đi"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 2 Micro-Cards for Key Metrics */}
        <div className="grid grid-cols-2 gap-2 my-3">
          <div className={`p-2.5 rounded-2xl transition-colors backdrop-blur-xs ${theme.chipBg}`}>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 font-medium">
              <Receipt className="w-3.5 h-3.5 text-zinc-400" />
              <span>{t('totalExpense', 'Tổng chi')}</span>
            </div>
            <div className="text-xs sm:text-sm font-black text-[#18181b] dark:text-white truncate">
              {formatVND(trip.totalExpense || 0)}
            </div>
          </div>

          <div className={`p-2.5 rounded-2xl transition-colors backdrop-blur-xs ${theme.chipBg}`}>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 font-medium">
              <Users className="w-3.5 h-3.5 text-zinc-400" />
              <span>{t('membersCount', 'Thành viên')}</span>
            </div>
            <div className="text-xs sm:text-sm font-black text-[#18181b] dark:text-white truncate">
              {trip.memberCount || 1} {t('membersUnit', 'người')} • {trip.expenseCount || 0} {t('expensesUnit', 'chi')}
            </div>
          </div>
        </div>

        {/* Trip Description */}
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2 min-h-[32px] leading-relaxed">
          {trip.description || t('defaultTripDesc', 'Chuyến đi cùng bạn bè, chia sẻ chi phí ăn uống và du lịch sòng phẳng.')}
        </p>
      </div>

      {/* Card Footer: Action Buttons */}
      <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-2">
        {!isCompleted ? (
          <>
            {/* View Details */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/trips/${trip.id}`);
              }}
              className="flex-1 py-2 px-3 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-white/90 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-zinc-800 dark:text-zinc-200 border border-black/5 dark:border-white/10 shadow-xs cursor-pointer group-hover:border-black/15"
            >
              <span>{t('viewDetails', 'Xem chi tiết')}</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>

            {/* Settle Debt Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/trips/${trip.id}?tab=settlement`);
              }}
              className="flex-1 py-2 px-3 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-[#18181b] dark:bg-white hover:bg-black dark:hover:bg-zinc-100 text-white dark:text-[#18181b] shadow-xs cursor-pointer hover:scale-[1.02] active:scale-95"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600 stroke-[2.5]" />
              <span>{t('settleNow', 'Quyết toán')}</span>
            </button>
          </>
        ) : (
          /* When completed: Quyết toán công nợ button is removed! Single full-width detail button */
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/trips/${trip.id}`);
            }}
            className="w-full py-2.5 px-4 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 bg-white/90 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-zinc-800 dark:text-zinc-200 border border-black/5 dark:border-white/10 shadow-xs cursor-pointer group-hover:border-black/15 hover:shadow-xs"
          >
            <span>{t('viewTripDetails', 'Xem chi tiết chuyến đi')}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        )}
      </div>
    </div>
  );
}
