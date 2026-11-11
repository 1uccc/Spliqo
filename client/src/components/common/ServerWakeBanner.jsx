import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../services/api';
import { Loader2, Sparkles, X, RotateCw } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const WAKE_ESTIMATE_SECONDS = 45;

export default function ServerWakeBanner() {
  const { t } = useLanguage();
  const [isWaking, setIsWaking] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [countdown, setCountdown] = useState(WAKE_ESTIMATE_SECONDS);
  const [dismissed, setDismissed] = useState(false);
  const [isPinging, setIsPinging] = useState(false);

  const countdownIntervalRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const wakingTimeoutRef = useRef(null);
  const isWakingRef = useRef(false);
  const isReadyRef = useRef(false);

  useEffect(() => {
    isWakingRef.current = isWaking;
  }, [isWaking]);

  useEffect(() => {
    isReadyRef.current = isReady;
  }, [isReady]);

  const handleServerAwake = useCallback(() => {
    if (wakingTimeoutRef.current) {
      clearTimeout(wakingTimeoutRef.current);
      wakingTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    setIsWaking((prevWaking) => {
      if (prevWaking) {
        setIsReady(true);
        setTimeout(() => {
          setIsReady(false);
          setIsWaking(false);
          setDismissed(false);
        }, 1500);
        return true;
      }
      return false;
    });
  }, []);

  const pingServer = useCallback(async () => {
    try {
      setIsPinging(true);
      await api.get('/health', { timeout: 60000 });
      handleServerAwake();
    } catch {
      // Still waking or failed
    } finally {
      setIsPinging(false);
    }
  }, [handleServerAwake]);

  const startWakingCountdown = useCallback(() => {
    setDismissed(false);
    setIsWaking(true);
    setCountdown(WAKE_ESTIMATE_SECONDS);

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    // Poll every 3.5 seconds while waking up
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(() => {
      pingServer();
    }, 3500);
  }, [pingServer]);

  useEffect(() => {
    // Only check if online
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }

    // Set a 2.0s timer. If server is already running, ping resolves in ~150ms and clears this timer.
    wakingTimeoutRef.current = setTimeout(() => {
      startWakingCountdown();
    }, 2000);

    pingServer();

    const onWakingEvent = () => {
      if (!isWakingRef.current && !isReadyRef.current) {
        startWakingCountdown();
      }
    };
    const onReadyEvent = () => {
      handleServerAwake();
    };

    window.addEventListener('spliqo:server-waking', onWakingEvent);
    window.addEventListener('spliqo:server-ready', onReadyEvent);

    // Heartbeat every 45s while tab is open to keep Render awake
    const heartbeat = setInterval(() => {
      if (navigator.onLine) {
        api.get('/health', { timeout: 10000 }).catch(() => {});
      }
    }, 45000);

    return () => {
      if (wakingTimeoutRef.current) clearTimeout(wakingTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      clearInterval(heartbeat);
      window.removeEventListener('spliqo:server-waking', onWakingEvent);
      window.removeEventListener('spliqo:server-ready', onReadyEvent);
    };
  }, [handleServerAwake, pingServer, startWakingCountdown]);

  // If server is already running and never slept, don't show anything!
  if (!isWaking && !isReady) {
    return null;
  }

  // If user explicitly dismissed it
  if (dismissed && !isReady) {
    return null;
  }

  const progressPercent = Math.min(
    100,
    Math.max(5, Math.round(((WAKE_ESTIMATE_SECONDS - countdown) / WAKE_ESTIMATE_SECONDS) * 100))
  );

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed server-wake-banner-pos left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-[480px] z-[9999] pointer-events-auto transition-all animate-fade-in"
    >
      <div
        className={`rounded-2xl p-3.5 sm:p-4 shadow-2xl border backdrop-blur-xl transition-all duration-300 ${
          isReady
            ? 'bg-emerald-950/95 dark:bg-emerald-950/95 border-emerald-500/40 text-emerald-100 ring-2 ring-emerald-500/30'
            : 'bg-[#181820]/95 dark:bg-[#12121a]/95 border-amber-500/30 text-white ring-1 ring-amber-500/20'
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Animated Icon Badge */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
              isReady
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-500/20 border-amber-500/30 text-amber-400'
            }`}
          >
            {isReady ? (
              <Sparkles className="w-5 h-5 animate-pulse text-emerald-400" />
            ) : (
              <div className="relative flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              </div>
            )}
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-extrabold tracking-tight">
                {isReady ? `✨ ${t('serverReadyTitle', 'Máy chủ đã sẵn sàng!')}` : t('serverWakingTitle', 'Hệ thống đang khởi động...')}
              </span>

              {!isReady && (
                <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                  {countdown > 0 ? `~${countdown}s` : t('almostDone', 'Sắp xong...')}
                </span>
              )}
            </div>

            <p className="text-xs text-zinc-200 mt-1 leading-snug">
              {isReady
                ? t('serverReadyDesc', 'Đã kết nối thành công tới dịch vụ đám mây Spliqo. Đang tải dữ liệu...')
                : countdown > 0
                ? t('serverWakingDesc', 'Máy chủ đám mây đang khởi động lại sau thời gian nghỉ. Vui lòng đợi khoảng {seconds} giây...').replace('{seconds}', countdown)
                : t('serverStillWakingDesc', 'Hệ thống sắp hoàn tất khởi động, vui lòng đợi thêm giây lát...')}
            </p>

            {/* Progress Bar (Visible while waking) */}
            {!isReady && (
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-2.5 relative">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-orange-400 to-emerald-400 rounded-full transition-all duration-1000 ease-linear shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}
          </div>

          {/* Dismiss & Manual Ping button */}
          <div className="flex items-center gap-1 shrink-0">
            {!isReady && (
              <button
                type="button"
                onClick={pingServer}
                disabled={isPinging}
                aria-label={t('retryPingTooltip', 'Kiểm tra lại ngay')}
                title={t('retryPingTooltip', 'Kiểm tra lại ngay')}
                className="w-9 h-9 rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
              >
                <RotateCw className={`w-4 h-4 ${isPinging ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label={t('dismissBannerTooltip', 'Đóng thông báo')}
              title={t('dismissBannerTooltip', 'Đóng thông báo')}
              className="w-9 h-9 rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
