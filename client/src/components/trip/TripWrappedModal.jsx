import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Download,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Receipt,
  Layers,
  X,
  Play,
  Pause,
  Award,
  CheckCircle2,
  Clock,
  Share2,
  Sparkles,
  Users
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { useTheme } from '../../contexts/ThemeContext';
import { lockBodyScroll, unlockBodyScroll } from '../../utils/scrollLock';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function drawRoundedRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawTruncatedText(ctx, text, x, y, maxWidth, align = 'left') {
  const str = String(text ?? '');
  ctx.textAlign = align;
  if (ctx.measureText(str).width <= maxWidth) {
    ctx.fillText(str, x, y);
    return;
  }
  let clipped = str;
  while (clipped.length > 1 && ctx.measureText(`${clipped}...`).width > maxWidth) {
    clipped = clipped.slice(0, -1);
  }
  ctx.fillText(`${clipped.trimEnd()}...`, x, y);
}

/**
 * Isolated 50ms progress ticker so timer ticks never re-render the full Wrapped modal.
 */
function StoryProgressBar({
  isOpen,
  isPaused,
  currentSlide,
  totalSlides,
  slideDuration,
  onAutoAdvance,
  onReachEnd,
  onSelectSlide,
  isEn
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
  }, [currentSlide, isOpen]);

  useEffect(() => {
    if (!isOpen || isPaused) return undefined;

    const intervalMs = 50;
    const step = (intervalMs / slideDuration) * 100;

    const id = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentSlide < totalSlides - 1) {
            onAutoAdvance();
            return 0;
          }
          onReachEnd();
          return 100;
        }
        return prev + step;
      });
    }, intervalMs);

    return () => clearInterval(id);
  }, [isOpen, isPaused, currentSlide, totalSlides, slideDuration, onAutoAdvance, onReachEnd]);

  return (
    <div className="flex items-center gap-1.5 w-full" role="group" aria-label={isEn ? 'Story progress' : 'Tiến trình thẻ kỷ niệm'}>
      {Array.from({ length: totalSlides }).map((_, idx) => (
        <button
          key={idx}
          type="button"
          aria-label={isEn ? `Go to story ${idx + 1}` : `Chuyển đến trang ${idx + 1}`}
          aria-current={idx === currentSlide ? 'step' : undefined}
          onClick={() => onSelectSlide(idx)}
          className="flex-1 min-h-[28px] py-2 -my-1 flex items-center cursor-pointer"
        >
          <span className="h-1.5 w-full rounded-full overflow-hidden bg-[#18181b]/15 dark:bg-white/15 block">
            <span
              className="block h-full bg-[#18181b] dark:bg-white transition-all duration-75 ease-linear rounded-full"
              style={{
                width: idx < currentSlide ? '100%' : idx === currentSlide ? `${Math.min(100, progress)}%` : '0%'
              }}
            />
          </span>
        </button>
      ))}
    </div>
  );
}

export default function TripWrappedModal({
  isOpen,
  onClose,
  trip,
  expenses = [],
  members = [],
  balances,
  settlements = [],
  t: propT
}) {
  const { isEn, t: contextT, formatMoney } = useLanguage();
  const t = propT || contextT;
  const { showToast } = useToast();
  const { isDark } = useTheme();

  const prefersReducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(prefersReducedMotion);
  const [exporting, setExporting] = useState(false);
  const [previewImages, setPreviewImages] = useState(null);
  const [fallbackToday] = useState(() => new Date());

  const autoPausedAtEndRef = useRef(false);
  const previousFocusRef = useRef(null);
  const dialogRef = useRef(null);
  const previewDialogRef = useRef(null);
  const touchStartRef = useRef(null);
  const justSwipedRef = useRef(false);

  const totalSlides = 5;
  const slideDuration = 6000;

  // Reset slide cleanly when opening modal
  useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0);
      setIsPaused(prefersReducedMotion);
      autoPausedAtEndRef.current = false;
      setPreviewImages(null);
    }
  }, [isOpen, prefersReducedMotion]);

  // Body scroll lock & focus restoration
  useEffect(() => {
    if (!isOpen) return undefined;
    previousFocusRef.current = document.activeElement;
    lockBodyScroll();

    const focusRaf = requestAnimationFrame(() => {
      const container = dialogRef.current;
      if (!container) return;
      const focusables = container.querySelectorAll(FOCUSABLE_SELECTOR);
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        container.focus();
      }
    });

    return () => {
      cancelAnimationFrame(focusRaf);
      unlockBodyScroll();
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen]);

  // Focus preview dialog when opened on iOS
  useEffect(() => {
    if (!previewImages) return undefined;
    const raf = requestAnimationFrame(() => {
      const el = previewDialogRef.current;
      if (!el) return;
      const firstFocusable = el.querySelector(FOCUSABLE_SELECTOR);
      if (firstFocusable) firstFocusable.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, [previewImages]);

  // Memoized analytics & single source of truth shared between DOM & Canvas
  const analytics = useMemo(() => {
    const safeTripName = (trip?.name || (isEn ? 'Spliqo Trip' : 'Chuyến đi Spliqo')).trim();
    const truncName = safeTripName.length > 26 ? `${safeTripName.slice(0, 24).trimEnd()}...` : safeTripName;
    const tripCode = trip?.tripCode || 'SPLIQO';

    const parseDate = (dStr) => {
      if (!dStr || typeof dStr !== 'string') return fallbackToday;
      const [y, m, d] = dStr.split('-').map(Number);
      if (!y) return fallbackToday;
      return new Date(y, (m || 1) - 1, d || 1);
    };

    const startDate = parseDate(trip?.startDate);
    const endDate = parseDate(trip?.endDate || trip?.startDate);
    const totalDays = Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1);
    const tripYear = startDate.getFullYear();

    const totalExpense = Number(balances?.totalExpense) || 0;
    const memberCount = Math.max(members.length, 1);
    const avgPerPerson = Math.round(totalExpense / memberCount);
    const hasExpenses = expenses.length > 0 && totalExpense > 0;

    // 1. Top payer
    const sortedMembersByPaid = [...(balances?.members || [])].sort(
      (a, b) => (b.totalPaid || 0) - (a.totalPaid || 0)
    );
    const topPayerCandidate = sortedMembersByPaid[0] || balances?.topPayer || null;
    const hasTopPayer = hasExpenses && topPayerCandidate && (Number(topPayerCandidate.totalPaid) || 0) > 0;
    const topPayer = hasTopPayer
      ? topPayerCandidate
      : { displayName: isEn ? 'No payments recorded' : 'Chưa phát sinh chi trả', totalPaid: 0, photoURL: null };
    const topPayerPercent = hasTopPayer ? Math.round(((topPayer.totalPaid || 0) / totalExpense) * 100) : 0;

    // 2. Highest expense
    const sortedExpenses = [...expenses].sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0));
    const topExpense = sortedExpenses[0] || null;
    const topExpensePayer = topExpense
      ? members.find((m) => String(m.userId || m.uid || m.id) === String(topExpense.paidBy))
      : null;

    // 3. Honest settlement reconciliation
    const totalSettlementCount = settlements.length;
    const confirmedSettlements = settlements.filter((s) => s.status === 'CONFIRMED');
    const pendingSettlementCount = totalSettlementCount - confirmedSettlements.length;
    const isBalancedZeroTransfers = hasExpenses && totalSettlementCount === 0;
    const isFullySettled = hasExpenses && (isBalancedZeroTransfers || pendingSettlementCount === 0);

    const settlementPercent = !hasExpenses
      ? 0
      : isBalancedZeroTransfers
        ? 100
        : Math.round((confirmedSettlements.length / totalSettlementCount) * 100);

    let fastestSettler = null;
    if (confirmedSettlements.length > 0) {
      const firstConfirmed = confirmedSettlements[0];
      fastestSettler =
        firstConfirmed.fromUser ||
        members.find((m) => String(m.userId || m.uid || m.id) === String(firstConfirmed.fromUserId)) ||
        null;
    }

    const statusBadgeText = !hasExpenses
      ? (isEn ? 'No expenses recorded yet' : 'Chưa có khoản chi nào')
      : isFullySettled
        ? (isEn ? '100% Reconciled' : 'Đã tất toán 100%')
        : (isEn
            ? `Settling ${confirmedSettlements.length}/${totalSettlementCount} transfers`
            : `Đã đối soát ${confirmedSettlements.length}/${totalSettlementCount} khoản`);

    const ratingBadgeText = !hasExpenses
      ? (isEn ? 'WAITING FOR FIRST BILL' : 'CHỜ KHOẢN CHI ĐẦU TIÊN')
      : isFullySettled
        ? (isEn ? '100% SETTLED • FAIR PLAY' : '100% SÒNG PHẲNG • CHUẨN XÁC')
        : (isEn ? `${settlementPercent}% RECONCILED` : `ĐÃ ĐỐI SOÁT ${settlementPercent}%`);

    return {
      safeTripName,
      truncName,
      tripCode,
      startDateStr: trip?.startDate || '',
      tripYear,
      totalDays,
      memberCount,
      totalExpense,
      avgPerPerson,
      hasExpenses,
      hasTopPayer,
      topPayer,
      topPayerPercent,
      topExpense,
      topExpensePayer,
      totalSettlementCount,
      confirmedCount: confirmedSettlements.length,
      pendingSettlementCount,
      isBalancedZeroTransfers,
      isFullySettled,
      settlementPercent,
      fastestSettler,
      statusBadgeText,
      ratingBadgeText
    };
  }, [trip, expenses, members, balances, settlements, isEn, fallbackToday]);

  // Shared slide metadata & copy used identically by both JSX & Canvas export
  const slideCopy = useMemo(() => {
    const a = analytics;
    return [
      {
        chapter: isEn ? 'CHAPTER 01 • OVERVIEW' : 'CHƯƠNG 01 • TỔNG QUAN',
        heading: a.truncName,
        meta: isEn
          ? `${a.totalDays} day(s) • ${members.length} member(s) • #${a.tripCode}`
          : `${a.totalDays} ngày • ${members.length} thành viên • #${a.tripCode}`,
        heroLabel: isEn ? 'Total group spend' : 'Tổng chi phí chuyến đi',
        heroValue: formatMoney(a.totalExpense),
        avgLabel: isEn ? 'Average per person' : 'Bình quân mỗi người',
        avgValue: `${formatMoney(a.avgPerPerson)}/${isEn ? 'person' : 'người'}`,
        stat1Label: isEn ? 'Bills logged' : 'Số hóa đơn',
        stat1Value: isEn ? `${expenses.length} bill(s)` : `${expenses.length} khoản chi`,
        stat2Label: isEn ? 'Duration' : 'Thời gian',
        stat2Value: isEn ? `${a.totalDays} day(s)` : `${a.totalDays} ngày đi`,
        statusLabel: a.statusBadgeText
      },
      {
        chapter: isEn ? 'CHAPTER 02 • TOP PAYER' : 'CHƯƠNG 02 • NGƯỜI CHI NHIỀU NHẤT',
        heading: a.topPayer.displayName,
        subline: a.hasTopPayer
          ? (isEn ? 'Fronted the largest share for the group' : 'Người ứng trước nhiều nhất cho cả nhóm')
          : (isEn ? 'Add expenses to crown your trip MVP' : 'Thêm khoản chi để vinh danh người ứng nhiều nhất'),
        amountLabel: isEn ? 'Total paid in advance' : 'Tổng tiền đã ứng trước',
        amountValue: formatMoney(a.topPayer.totalPaid || 0),
        shareLine: a.hasTopPayer
          ? (isEn
              ? `Covered ${a.topPayerPercent}% of total group expenses`
              : `Đóng góp ${a.topPayerPercent}% tổng chi tiêu cả đoàn`)
          : (isEn ? '0% recorded so far' : 'Chưa có dữ liệu chi trả'),
        footerNote: a.hasTopPayer
          ? (isEn
              ? 'Thank you for keeping group payments smooth and stress-free!'
              : 'Cảm ơn bạn đã ứng trước giúp chuyến đi của cả nhóm luôn suôn sẻ!')
          : (isEn ? 'Record your first bill to see breakdown stats.' : 'Hãy ghi nhận hóa đơn đầu tiên để xem thống kê.')
      },
      {
        chapter: isEn ? 'CHAPTER 03 • PEAK EXPENSE' : 'CHƯƠNG 03 • KHOẢN CHI LỚN NHẤT',
        heading: isEn ? 'Standout Trip Bill' : 'Hóa đơn kỷ lục',
        subline: isEn ? 'Single highest expense recorded' : 'Khoản chi có giá trị cao nhất chuyến đi',
        billTitle: a.topExpense ? a.topExpense.title : (isEn ? 'No expenses recorded yet' : 'Chưa có khoản chi'),
        billAmount: formatMoney(a.topExpense ? a.topExpense.amount : 0),
        payerLabel: isEn ? 'Paid by' : 'Người thanh toán',
        payerValue: a.topExpensePayer?.displayName || (isEn ? '—' : '—'),
        dateLabel: isEn ? 'Date' : 'Ngày ghi nhận',
        dateValue: a.topExpense?.date || (isEn ? 'During trip' : 'Trong chuyến đi'),
        splitLabel: isEn ? 'Shared among' : 'Số người chia',
        splitValue: a.topExpense
          ? `${a.topExpense.participants?.length || members.length} ${isEn ? 'member(s)' : 'thành viên'}`
          : '—',
        footerNote: a.topExpense
          ? (isEn
              ? 'One standout highlight that shaped your shared journey together.'
              : 'Khoản chi đáng nhớ góp phần tạo nên hành trình trọn vẹn của cả nhóm.')
          : (isEn ? 'Your highest group bill will appear here.' : 'Hóa đơn lớn nhất của nhóm sẽ hiển thị tại đây.')
      },
      {
        chapter: isEn ? 'CHAPTER 04 • SETTLEMENT' : 'CHƯƠNG 04 • TẤT TOÁN CÔNG NỢ',
        heading: !a.hasExpenses
          ? (isEn ? 'Ready to Split' : 'Sẵn sàng chia tiền')
          : a.isFullySettled
            ? (isEn ? 'All Balances Settled' : '100% Sòng Phẳng')
            : (isEn ? 'Settlement In Progress' : 'Đang đối soát công nợ'),
        subline: !a.hasExpenses
          ? (isEn ? 'No debts generated yet' : 'Chưa phát sinh khoản công nợ nào')
          : a.isBalancedZeroTransfers
            ? (isEn ? 'Balances are naturally even — zero transfers needed' : 'Số dư đã tự cân bằng — không cần chuyển khoản thêm')
            : (isEn
                ? `${a.confirmedCount} of ${a.totalSettlementCount} transfer(s) confirmed`
                : `Đã xác nhận ${a.confirmedCount}/${a.totalSettlementCount} giao dịch chuyển khoản`),
        progressLabel: isEn ? 'Reconciliation progress' : 'Tiến độ đối soát',
        progressPercentText: a.hasExpenses ? `${a.settlementPercent}%` : '0%',
        settlerCardTitle: a.fastestSettler
          ? (isEn ? 'Confirmed Settler' : 'Thành viên đã xác nhận tất toán')
          : (isEn ? 'Settlement Status' : 'Trạng thái công nợ'),
        settlerName: a.fastestSettler
          ? a.fastestSettler.displayName
          : !a.hasExpenses
            ? (isEn ? 'No expenses logged yet' : 'Chưa ghi nhận chi tiêu')
            : a.isBalancedZeroTransfers
              ? (isEn ? 'Naturally Balanced' : 'Cân bằng tự nhiên')
              : (isEn ? `${a.pendingSettlementCount} transfer(s) awaiting confirmation` : `Còn ${a.pendingSettlementCount} khoản chờ xác nhận`),
        settlerDesc: a.fastestSettler
          ? (isEn ? 'Completed VietQR settlement cleanly and transparently.' : 'Đã hoàn tất chuyển khoản minh bạch qua VietQR.')
          : a.hasExpenses && !a.isFullySettled
            ? (isEn ? 'Complete pending transfers in the Settlement tab.' : 'Vào tab Quyết toán để hoàn tất các khoản còn lại.')
            : (isEn ? 'Every amount stays transparent down to the last đồng.' : 'Mọi khoản thu chi đều được đối soát minh bạch từng đồng.')
      },
      {
        chapter: isEn ? 'CHAPTER 05 • TRIP RECAP' : 'CHƯƠNG 05 • THẺ KÝ ỨC',
        yearBadge: `${a.tripYear} • RECAP`,
        heading: a.truncName,
        meta: `#${a.tripCode}${a.startDateStr ? ` • ${a.startDateStr}` : ''}`,
        row1Label: isEn ? 'Total trip spend' : 'Tổng chi toàn chuyến',
        row1Value: formatMoney(a.totalExpense),
        row2Label: isEn ? 'Top payer' : 'Chi nhiều nhất',
        row2Value: a.hasTopPayer ? a.topPayer.displayName : '—',
        row3Label: isEn ? 'Largest bill' : 'Khoản chi lớn nhất',
        row3Value: a.topExpense ? a.topExpense.title : '—',
        row4Label: isEn ? 'Settlement' : 'Trạng thái đối soát',
        row4Value: a.statusBadgeText,
        footerPill: a.ratingBadgeText
      }
    ];
  }, [analytics, expenses.length, members.length, formatMoney, isEn]);

  // Trigger celebration confetti only when trip has real expenses and is fully settled on final card
  useEffect(() => {
    if (isOpen && currentSlide === totalSlides - 1 && analytics.hasExpenses && analytics.isFullySettled) {
      try {
        confetti({
          particleCount: 45,
          spread: 70,
          origin: { y: 0.6 },
          disableForReducedMotion: true
        });
      } catch {
        // Optional celebratory effect
      }
    }
  }, [isOpen, currentSlide, totalSlides, analytics.hasExpenses, analytics.isFullySettled]);

  const handleAutoAdvance = useCallback(() => {
    setCurrentSlide((curr) => Math.min(totalSlides - 1, curr + 1));
  }, [totalSlides]);

  const handleReachEnd = useCallback(() => {
    autoPausedAtEndRef.current = true;
    setIsPaused(true);
  }, []);

  const resumeIfAutoPaused = useCallback(() => {
    if (autoPausedAtEndRef.current) {
      autoPausedAtEndRef.current = false;
      if (!prefersReducedMotion) {
        setIsPaused(false);
      }
    }
  }, [prefersReducedMotion]);

  const handleNext = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      resumeIfAutoPaused();
      setCurrentSlide((prev) => prev + 1);
    }
  }, [currentSlide, totalSlides, resumeIfAutoPaused]);

  const handlePrev = useCallback(() => {
    if (currentSlide > 0) {
      resumeIfAutoPaused();
      setCurrentSlide((prev) => prev - 1);
    }
  }, [currentSlide, resumeIfAutoPaused]);

  const handleSelectSlide = useCallback(
    (idx) => {
      resumeIfAutoPaused();
      setCurrentSlide(idx);
    },
    [resumeIfAutoPaused]
  );

  // Keyboard shortcuts + focus trap across active modal layer
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (e) => {
      const activeContainer = previewImages ? previewDialogRef.current : dialogRef.current;

      if (e.key === 'Escape') {
        e.preventDefault();
        if (previewImages) {
          setPreviewImages(null);
        } else {
          onClose();
        }
        return;
      }

      if (e.key === 'Tab' && activeContainer) {
        const focusables = Array.from(activeContainer.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
          (el) => el.offsetParent !== null
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
        return;
      }

      if (previewImages) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === ' ') {
        const tag = document.activeElement?.tagName;
        if (tag !== 'BUTTON' && tag !== 'A') {
          e.preventDefault();
          autoPausedAtEndRef.current = false;
          setIsPaused((p) => !p);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, previewImages, handleNext, handlePrev, onClose]);

  // Tactile Clay 1080x1920 PNG Canvas Exporter matching UI light/dark theme & shared slideCopy
  const generateSlideCanvas = useCallback(
    (slideIndex) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');

      const palette = isDark
        ? {
            bg: '#14141a',
            card: '#18181f',
            chip: '#212129',
            border: '#2e2e38',
            text: '#f4f4f6',
            muted: '#a1a1aa',
            emerald: '#34d399',
            emeraldBg: '#064e3b',
            emeraldText: '#a7f3d0',
            amberBg: '#451a03',
            amberText: '#fcd34d',
            pillBg: '#ffffff',
            pillText: '#18181b',
            grid: 'rgba(255, 255, 255, 0.035)'
          }
        : {
            bg: '#f4f3ec',
            card: '#ffffff',
            chip: '#f4f3ec',
            border: '#dedbd0',
            text: '#18181b',
            muted: '#52525b',
            emerald: '#047857',
            emeraldBg: '#d1fae5',
            emeraldText: '#065f46',
            amberBg: '#fef3c7',
            amberText: '#92400e',
            pillBg: '#18181b',
            pillText: '#ffffff',
            grid: 'rgba(24, 24, 27, 0.04)'
          };

      // 1. Background fill + subtle radial ambient warmth
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, 1080, 1920);

      const drawSoftOrb = (cx, cy, r, rgba) => {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, rgba);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      };
      drawSoftOrb(900, 260, 480, isDark ? 'rgba(16, 185, 129, 0.14)' : 'rgba(16, 185, 129, 0.10)');
      drawSoftOrb(180, 1520, 520, isDark ? 'rgba(245, 158, 11, 0.10)' : 'rgba(245, 158, 11, 0.09)');

      // Helper for tactile rounded bento cards
      const drawTactileCard = (x, y, w, h, fill = palette.card, border = palette.border, radius = 44) => {
        ctx.save();
        ctx.shadowColor = isDark ? 'rgba(0,0,0,0.4)' : 'rgba(24,24,27,0.06)';
        ctx.shadowBlur = 32;
        ctx.shadowOffsetY = 12;
        drawRoundedRectPath(ctx, x, y, w, h, radius);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.restore();

        drawRoundedRectPath(ctx, x, y, w, h, radius);
        ctx.lineWidth = 3;
        ctx.strokeStyle = border;
        ctx.stroke();
      };

      const drawPillBadge = (x, y, text, bgColor, textColor, maxW = 620) => {
        ctx.font = 'bold 24px "Lexend", system-ui, sans-serif';
        const paddingX = 30;
        const measured = Math.min(ctx.measureText(text).width + paddingX * 2, maxW);
        drawRoundedRectPath(ctx, x, y, measured, 56, 28);
        ctx.fillStyle = bgColor;
        ctx.fill();
        ctx.fillStyle = textColor;
        ctx.textAlign = 'left';
        ctx.fillText(text, x + paddingX, y + 37);
      };

      // 2. Top progress strips & header brand
      for (let i = 0; i < totalSlides; i++) {
        const barW = (1080 - 140 - 4 * 14) / 5;
        const barX = 70 + i * (barW + 14);
        drawRoundedRectPath(ctx, barX, 72, barW, 8, 4);
        ctx.fillStyle = i <= slideIndex ? palette.text : isDark ? 'rgba(255,255,255,0.16)' : 'rgba(24,24,27,0.14)';
        ctx.fill();
      }

      drawPillBadge(70, 120, 'Spliqo Wrapped ✦', palette.pillBg, palette.pillText);
      ctx.font = 'bold 28px "JetBrains Mono", "Lexend", monospace';
      ctx.fillStyle = palette.emerald;
      ctx.textAlign = 'right';
      ctx.fillText(`${slideIndex + 1} / ${totalSlides}`, 1010, 158);
      ctx.textAlign = 'left';

      const s = slideCopy[slideIndex];

      // 3. Slide-specific Tactile Bento Layout
      if (slideIndex === 0) {
        drawPillBadge(70, 250, s.chapter, palette.emeraldBg, palette.emeraldText);
        ctx.font = '800 74px "Lexend", system-ui, sans-serif';
        ctx.fillStyle = palette.text;
        drawTruncatedText(ctx, s.heading, 70, 395, 940);

        ctx.font = '600 28px "JetBrains Mono", "Lexend", monospace';
        ctx.fillStyle = palette.muted;
        drawTruncatedText(ctx, s.meta, 70, 452, 940);

        drawTactileCard(70, 520, 940, 420);
        ctx.font = '700 28px "Lexend", system-ui, sans-serif';
        ctx.fillStyle = palette.muted;
        ctx.fillText(s.heroLabel, 120, 600);

        ctx.font = '800 92px "JetBrains Mono", "Lexend", monospace';
        ctx.fillStyle = palette.text;
        drawTruncatedText(ctx, s.heroValue, 120, 725, 840);

        ctx.strokeStyle = palette.border;
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(120, 790);
        ctx.lineTo(960, 790);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = '600 28px "Lexend", system-ui, sans-serif';
        ctx.fillStyle = palette.muted;
        ctx.fillText(s.avgLabel, 120, 868);
        ctx.font = '800 32px "JetBrains Mono", "Lexend", monospace';
        ctx.fillStyle = palette.emerald;
        drawTruncatedText(ctx, s.avgValue, 960, 868, 460, 'right');

        // Two Bento Tiles
        drawTactileCard(70, 990, 450, 250);
        ctx.font = '700 26px "Lexend", system-ui, sans-serif';
        ctx.fillStyle = palette.muted;
        ctx.fillText(s.stat1Label, 115, 1065);
        ctx.font = '800 54px "Lexend", system-ui, sans-serif';
        ctx.fillStyle = palette.text;
        drawTruncatedText(ctx, s.stat1Value, 115, 1155, 360);

        drawTactileCard(560, 990, 450, 250);
        ctx.font = '700 26px "Lexend", system-ui, sans-serif';
        ctx.fillStyle = palette.muted;
        ctx.fillText(s.stat2Label, 605, 1065);
        ctx.font = '800 54px "Lexend", system-ui, sans-serif';
        ctx.fillStyle = palette.text;
        drawTruncatedText(ctx, s.stat2Value, 605, 1155, 360);

        drawTactileCard(
          70,
          1290,
          940,
          140,
          analytics.isFullySettled ? palette.emeraldBg : palette.amberBg,
          palette.border,
          36
        );
        ctx.font = '800 30px "Lexend", system-ui, sans-serif';
        ctx.fillStyle = analytics.isFullySettled ? palette.emeraldText : palette.amberText;
        drawTruncatedText(ctx, `✦ ${s.statusLabel}`, 540, 1372, 860, 'center');
      } else if (slideIndex === 1) {
        drawPillBadge(70, 250, s.chapter, palette.amberBg, palette.amberText);

        drawTactileCard(70, 360, 940, 1080);
        ctx.font = '88px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(analytics.hasTopPayer ? '👑' : '🧾', 540, 505);

        ctx.font = '800 62px "Lexend", system-ui, sans-serif';
        ctx.fillStyle = palette.text;
        drawTruncatedText(ctx, s.heading, 540, 610, 840, 'center');

        ctx.font = '600 28px "Lexend", system-ui, sans-serif';
        ctx.fillStyle = palette.muted;
        drawTruncatedText(ctx, s.subline, 540, 670, 840, 'center');

        drawTactileCard(120, 750, 840, 360, palette.chip, palette.border, 36);
        ctx.font = '700 28px "Lexend", system-ui, sans-serif';
        ctx.fillStyle = palette.muted;
        ctx.textAlign = 'left';
        ctx.fillText(s.amountLabel, 170, 835);

        ctx.font = '800 84px "JetBrains Mono", "Lexend", monospace';
        ctx.fillStyle = palette.emerald;
        drawTruncatedText(ctx, s.amountValue, 170, 950, 740);

        ctx.font = '700 28px "Lexend", system-ui, sans-serif';
        ctx.fillStyle = palette.text;
        drawTruncatedText(ctx, s.shareLine, 170, 1045, 740);

        ctx.font = '600 28px "Lexend", system-ui, sans-serif';
        ctx.fillStyle = palette.muted;
        drawTruncatedText(ctx, s.footerNote, 540, 1265, 820, 'center');
      } else if (slideIndex === 2) {
        drawPillBadge(70, 250, s.chapter, palette.emeraldBg, palette.emeraldText);

        ctx.font = '800 64px "Lexend", system-ui, sans-serif';
        ctx.fillStyle = palette.text;
        drawTruncatedText(ctx, s.heading, 70, 395, 940);

        ctx.font = '600 28px "Lexend", system-ui, sans-serif';
        ctx.fillStyle = palette.muted;
        drawTruncatedText(ctx, s.subline, 70, 450, 940);

        drawTactileCard(70, 515, 940, 340);
        ctx.font = '700 26px "Lexend", system-ui, sans-serif';
        ctx.fillStyle = palette.muted;
        ctx.fillText(isEn ? 'Record Expense' : 'Tên khoản chi', 120, 590);

        ctx.font = '800 50px "Lexend", system-ui, sans-serif';
        ctx.fillStyle = palette.text;
        drawTruncatedText(ctx, s.billTitle, 120, 675, 840);

        ctx.font = '800 76px "JetBrains Mono", "Lexend", monospace';
        ctx.fillStyle = palette.emerald;
        drawTruncatedText(ctx, s.billAmount, 120, 785, 840);

        drawTactileCard(70, 905, 940, 370);
        const rows = [
          [s.payerLabel, s.payerValue],
          [s.dateLabel, s.dateValue],
          [s.splitLabel, s.splitValue]
        ];
        rows.forEach(([lbl, val], idx) => {
          const y = 1005 + idx * 96;
          ctx.font = '600 28px "Lexend", system-ui, sans-serif';
          ctx.fillStyle = palette.muted;
          ctx.textAlign = 'left';
          ctx.fillText(lbl, 120, y);
          ctx.font = '800 30px "JetBrains Mono", "Lexend", monospace';
          ctx.fillStyle = palette.text;
          drawTruncatedText(ctx, val, 960, y, 480, 'right');
        });

        drawTactileCard(70, 1320, 940, 130, palette.chip, palette.border, 32);
        ctx.font = '600 26px "Lexend", system-ui, sans-serif';
        ctx.fillStyle = palette.text;
        drawTruncatedText(ctx, `✦ ${s.footerNote}`, 540, 1396, 860, 'center');
      } else if (slideIndex === 3) {
        drawPillBadge(70, 250, s.chapter, palette.emeraldBg, palette.emeraldText);

        ctx.font = '800 66px "Lexend", system-ui, sans-serif';
        ctx.fillStyle = palette.text;
        drawTruncatedText(ctx, s.heading, 70, 395, 940);

        ctx.font = '600 28px "Lexend", system-ui, sans-serif';
        ctx.fillStyle = palette.muted;
        drawTruncatedText(ctx, s.subline, 70, 452, 940);

        drawTactileCard(70, 525, 940, 360);
        ctx.font = '700 28px "Lexend", system-ui, sans-serif';
        ctx.fillStyle = palette.muted;
        ctx.fillText(s.progressLabel, 120, 610);

        ctx.font = '800 64px "JetBrains Mono", "Lexend", monospace';
        ctx.fillStyle = palette.emerald;
        drawTruncatedText(ctx, s.progressPercentText, 960, 618, 300, 'right');

        drawRoundedRectPath(ctx, 120, 680, 840, 36, 18);
        ctx.fillStyle = palette.chip;
        ctx.fill();

        const fillW = Math.max(analytics.settlementPercent > 0 ? 36 : 0, Math.round((840 * analytics.settlementPercent) / 100));
        if (fillW > 0) {
          drawRoundedRectPath(ctx, 120, 680, fillW, 36, 18);
          ctx.fillStyle = analytics.isFullySettled ? '#10b981' : '#f59e0b';
          ctx.fill();
        }

        ctx.font = '600 26px "Lexend", system-ui, sans-serif';
        ctx.fillStyle = palette.muted;
        drawTruncatedText(ctx, s.settlerDesc, 120, 800, 840);

        drawTactileCard(70, 940, 940, 340);
        ctx.font = '700 26px "Lexend", system-ui, sans-serif';
        ctx.fillStyle = palette.muted;
        ctx.fillText(s.settlerCardTitle, 120, 1025);

        ctx.font = '800 46px "Lexend", system-ui, sans-serif';
        ctx.fillStyle = palette.text;
        drawTruncatedText(ctx, s.settlerName, 120, 1125, 840);

        ctx.font = '600 26px "Lexend", system-ui, sans-serif';
        ctx.fillStyle = palette.emerald;
        drawTruncatedText(ctx, `Spliqo • VietQR`, 120, 1210, 840);
      } else {
        drawPillBadge(70, 250, s.chapter, palette.pillBg, palette.pillText);
        ctx.font = '700 28px "JetBrains Mono", "Lexend", monospace';
        ctx.fillStyle = palette.muted;
        ctx.textAlign = 'right';
        ctx.fillText(s.yearBadge, 1010, 286);
        ctx.textAlign = 'left';

        ctx.font = '800 66px "Lexend", system-ui, sans-serif';
        ctx.fillStyle = palette.text;
        drawTruncatedText(ctx, s.heading, 70, 395, 940);

        ctx.font = '600 28px "JetBrains Mono", "Lexend", monospace';
        ctx.fillStyle = palette.muted;
        drawTruncatedText(ctx, s.meta, 70, 452, 940);

        drawTactileCard(70, 520, 940, 740);
        const ticketRows = [
          [s.row1Label, s.row1Value, palette.text],
          [s.row2Label, s.row2Value, palette.text],
          [s.row3Label, s.row3Value, palette.text],
          [s.row4Label, s.row4Value, analytics.isFullySettled ? palette.emerald : palette.amberText]
        ];
        ticketRows.forEach(([lbl, val, color], idx) => {
          const y = 650 + idx * 165;
          ctx.font = '600 26px "Lexend", system-ui, sans-serif';
          ctx.fillStyle = palette.muted;
          ctx.textAlign = 'left';
          ctx.fillText(lbl, 120, y);

          ctx.font = idx === 0 ? '800 50px "JetBrains Mono", "Lexend", monospace' : '800 36px "Lexend", system-ui, sans-serif';
          ctx.fillStyle = color;
          drawTruncatedText(ctx, val, 120, y + 60, 840);

          if (idx < ticketRows.length - 1) {
            ctx.strokeStyle = palette.border;
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 8]);
            ctx.beginPath();
            ctx.moveTo(120, y + 105);
            ctx.lineTo(960, y + 105);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        });

        drawTactileCard(
          70,
          1310,
          940,
          140,
          analytics.isFullySettled ? palette.emeraldBg : palette.chip,
          palette.border,
          36
        );
        ctx.font = '800 30px "Lexend", system-ui, sans-serif';
        ctx.fillStyle = analytics.isFullySettled ? palette.emeraldText : palette.text;
        drawTruncatedText(ctx, `★ ${s.footerPill}`, 540, 1392, 860, 'center');
      }

      // 4. Footer brand stamp
      ctx.font = '700 24px "JetBrains Mono", "Lexend", monospace';
      ctx.fillStyle = palette.muted;
      ctx.textAlign = 'left';
      ctx.fillText(`SPLIQO • ${analytics.tripYear}`, 70, 1815);
      ctx.textAlign = 'right';
      ctx.fillStyle = palette.emerald;
      ctx.fillText(isEn ? 'SPLIT EXPENSES • STAY FRIENDS' : 'CHIA TIỀN MINH BẠCH • GIỮ TRỌN TÌNH BẠN', 1010, 1815);
      ctx.textAlign = 'left';

      return canvas;
    },
    [isDark, totalSlides, slideCopy, analytics, isEn]
  );

  const canvasToBlob = (canvas) =>
    new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas export failed'));
      }, 'image/png');
    });

  const triggerDownload = (blob, filename) => {
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename;
    link.href = blobUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
  };

  const isIOSDevice = () =>
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const handleDownloadSlide = async (slideIndex) => {
    try {
      setExporting(true);
      await document.fonts?.ready;
      const canvas = generateSlideCanvas(slideIndex);
      const cleanName = analytics.safeTripName.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/g, '_');
      const filename = `Spliqo_Wrapped_${cleanName}_Story${slideIndex + 1}.png`;

      if (isIOSDevice()) {
        setPreviewImages([
          {
            slideIndex,
            label: `${isEn ? 'Story' : 'Trang'} ${slideIndex + 1}/5`,
            url: canvas.toDataURL('image/png'),
            filename
          }
        ]);
        return;
      }

      const blob = await canvasToBlob(canvas);
      triggerDownload(blob, filename);
      showToast(isEn ? `Downloaded Story ${slideIndex + 1}!` : `Đã tải ảnh Story trang ${slideIndex + 1}!`, 'success');
    } catch (err) {
      console.error('Export error:', err);
      showToast(t('exportImageError', 'Lỗi khi xuất ảnh'), 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadAllSlides = async () => {
    try {
      setExporting(true);
      await document.fonts?.ready;
      const cleanName = analytics.safeTripName.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/g, '_');

      if (isIOSDevice()) {
        showToast(isEn ? 'Generating all 5 stories for preview...' : 'Đang tạo bộ 5 ảnh Story để lưu về máy...', 'info');
        const generated = [];
        for (let i = 0; i < totalSlides; i++) {
          const canvas = generateSlideCanvas(i);
          generated.push({
            slideIndex: i,
            label: `${isEn ? 'Story' : 'Trang'} ${i + 1}/5`,
            url: canvas.toDataURL('image/png'),
            filename: `Spliqo_Wrapped_${cleanName}_Story${i + 1}.png`
          });
        }
        setPreviewImages(generated);
        return;
      }

      showToast(isEn ? 'Preparing all 5 story slides...' : 'Đang xuất toàn bộ 5 ảnh...', 'info');
      for (let i = 0; i < totalSlides; i++) {
        const canvas = generateSlideCanvas(i);
        const blob = await canvasToBlob(canvas);
        triggerDownload(blob, `Spliqo_Wrapped_${cleanName}_Story${i + 1}.png`);
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
      showToast(isEn ? 'Downloaded all 5 story slides!' : 'Đã tải về toàn bộ 5 ảnh thành công!', 'success');
    } catch (err) {
      console.error('Export all error:', err);
      showToast(t('downloadImageError', 'Lỗi khi tải ảnh'), 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleNativeSharePreview = async () => {
    if (!previewImages || previewImages.length === 0) return;
    try {
      const files = await Promise.all(
        previewImages.map(async (item) => {
          const res = await fetch(item.url);
          const blob = await res.blob();
          return new File([blob], item.filename, { type: 'image/png' });
        })
      );
      if (navigator.canShare && navigator.canShare({ files })) {
        await navigator.share({
          files,
          title: `Spliqo Wrapped — ${analytics.safeTripName}`
        });
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        showToast(t('downloadImageError', 'Lỗi khi tải ảnh'), 'error');
      }
    }
  };

  // Story viewport tap & horizontal swipe handlers (never blocked by nested content container)
  const handleTouchStart = (e) => {
    const touch = e.touches?.[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches?.[0];
    if (!touch) return;
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      justSwipedRef.current = true;
      if (dx < 0) handleNext();
      else handlePrev();
      setTimeout(() => {
        justSwipedRef.current = false;
      }, 250);
    }
  };

  const handleViewportClick = (e) => {
    if (justSwipedRef.current) return;
    if (e.target.closest('button, a, input, [data-interactive="true"]')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    if (relX < rect.width * 0.28) {
      handlePrev();
    } else {
      handleNext();
    }
  };

  if (!isOpen || !trip) return null;

  const s0 = slideCopy[0];
  const s1 = slideCopy[1];
  const s2 = slideCopy[2];
  const s3 = slideCopy[3];
  const s4 = slideCopy[4];
  const canNativeFileShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function' && typeof navigator.canShare === 'function';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wrapped-modal-title"
      className="fixed inset-0 z-[100] bg-[#f4f3ec]/92 dark:bg-[#0f0f12]/92 backdrop-blur-xl flex flex-col items-center justify-center p-0 sm:p-4 select-none animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Screen reader live announcement on slide navigation */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isEn
          ? `Story ${currentSlide + 1} of ${totalSlides}: ${slideCopy[currentSlide]?.heading}`
          : `Trang ${currentSlide + 1} trên ${totalSlides}: ${slideCopy[currentSlide]?.heading}`}
      </div>

      {/* 9:16 Vertical Tactile Clay Story Viewer Container */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative w-full sm:max-w-[440px] h-[100dvh] sm:h-[92dvh] max-h-[900px] flex flex-col justify-between overflow-hidden bg-[#f4f3ec] dark:bg-[#14141a] text-[#18181b] dark:text-[#f4f4f6] sm:rounded-[2.5rem] border-0 sm:border sm:border-[#dedbd0] sm:dark:border-[#2e2e38] shadow-[0_25px_60px_-15px_rgba(24,24,27,0.18)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.75)] focus:outline-none"
      >
        {/* Subtle Tactile Ambient Glow (non-intrusive, keeps body copy contrast clean) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
          <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full bg-emerald-400/18 dark:bg-emerald-500/12 blur-3xl" />
          <div className="absolute -bottom-20 -left-16 w-72 h-72 rounded-full bg-amber-400/16 dark:bg-amber-500/10 blur-3xl" />
        </div>

        {/* TOP STORY HEADER & PROGRESS BARS */}
        <div className="relative z-20 px-4 pt-[max(0.875rem,calc(env(safe-area-inset-top)+0.625rem))] sm:pt-4 pb-2 space-y-2.5 shrink-0 bg-[#f4f3ec]/85 dark:bg-[#14141a]/85 backdrop-blur-md border-b border-[#e6e4dc]/45 dark:border-[#272732]/50">
          <StoryProgressBar
            isOpen={isOpen}
            isPaused={isPaused || Boolean(previewImages)}
            currentSlide={currentSlide}
            totalSlides={totalSlides}
            slideDuration={slideDuration}
            onAutoAdvance={handleAutoAdvance}
            onReachEnd={handleReachEnd}
            onSelectSlide={handleSelectSlide}
            isEn={isEn}
          />

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                id="wrapped-modal-title"
                className="px-3 py-1 rounded-full bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] font-bold text-xs tracking-normal inline-flex items-center gap-1.5 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" aria-hidden="true" />
                <span>Spliqo Wrapped</span>
              </span>
              <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {currentSlide + 1}/{totalSlides}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  autoPausedAtEndRef.current = false;
                  setIsPaused((p) => !p);
                }}
                aria-pressed={isPaused}
                className="w-11 h-11 rounded-full bg-white dark:bg-[#212129] hover:bg-[#eae8df] dark:hover:bg-[#2c2c36] text-[#18181b] dark:text-white border border-[#dedbd0] dark:border-[#32323e] flex items-center justify-center transition-colors cursor-pointer"
                title={isPaused ? t('resumeStory', 'Tiếp tục') : t('pauseStory', 'Tạm dừng')}
                aria-label={isPaused ? t('resumeStory', 'Tiếp tục') : t('pauseStory', 'Tạm dừng')}
              >
                {isPaused ? <Play className="w-4 h-4 fill-current" aria-hidden="true" /> : <Pause className="w-4 h-4 fill-current" aria-hidden="true" />}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-11 h-11 rounded-full bg-white dark:bg-[#212129] hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-400 text-[#18181b] dark:text-white border border-[#dedbd0] dark:border-[#32323e] flex items-center justify-center transition-colors cursor-pointer"
                title={t('closeEsc', 'Đóng (ESC)')}
                aria-label={t('close', 'Đóng')}
              >
                <X className="w-4 h-4 stroke-[2.4]" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* STORY SLIDE CONTENT VIEWPORT (Tap left 28% / right 72% or swipe horizontally) */}
        <div
          className="relative z-10 flex-1 px-4 sm:px-5 flex flex-col overflow-y-auto custom-scrollbar py-4 sm:py-5 cursor-pointer"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={handleViewportClick}
        >
          <div className="my-auto w-full">
          {/* SLIDE 0: OVERVIEW */}
          {currentSlide === 0 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-[11px] font-bold tracking-wide uppercase">
                  {s0.chapter}
                </span>
              </div>

              <div>
                <h2 className="text-3xl font-extrabold text-[#18181b] dark:text-white tracking-tight leading-tight break-words">
                  {s0.heading}
                </h2>
                <p className="text-xs font-mono font-semibold text-zinc-600 dark:text-zinc-400 mt-1.5">
                  {s0.meta}
                </p>
              </div>

              <div className="tactile-card p-5 space-y-2.5">
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block">
                  {s0.heroLabel}
                </span>
                <div className="text-[2.125rem] sm:text-4xl leading-none font-extrabold text-[#18181b] dark:text-white font-mono tracking-tight">
                  {s0.heroValue}
                </div>
                <div className="pt-3 border-t border-dashed border-[#e6e4dc] dark:border-[#2e2e38] flex items-center justify-between gap-2 flex-wrap text-xs font-bold">
                  <span className="text-zinc-600 dark:text-zinc-400">{s0.avgLabel}</span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400">{s0.avgValue}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="tactile-card p-4 space-y-1.5">
                  <div className="text-xs font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                    <span>{s0.stat1Label}</span>
                  </div>
                  <div className="text-base sm:text-lg font-extrabold text-[#18181b] dark:text-white">
                    {s0.stat1Value}
                  </div>
                </div>

                <div className="tactile-card p-4 space-y-1.5">
                  <div className="text-xs font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" aria-hidden="true" />
                    <span>{s0.stat2Label}</span>
                  </div>
                  <div className="text-base sm:text-lg font-extrabold text-[#18181b] dark:text-white">
                    {s0.stat2Value}
                  </div>
                </div>
              </div>

              <div
                className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 ${
                  analytics.isFullySettled
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300'
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-300'
                }`}
              >
                {analytics.isFullySettled ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                ) : (
                  <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
                )}
                <span>{s0.statusLabel}</span>
              </div>
            </div>
          )}

          {/* SLIDE 1: TOP PAYER */}
          {currentSlide === 1 && (
            <div className="space-y-4 animate-fade-in text-center">
              <div className="flex justify-center">
                <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 text-[11px] font-bold tracking-wide uppercase">
                  {s1.chapter}
                </span>
              </div>

              <div className="relative inline-block mx-auto">
                {analytics.hasTopPayer && analytics.topPayer.photoURL ? (
                  <img
                    src={analytics.topPayer.photoURL}
                    alt=""
                    className="w-20 h-20 rounded-3xl object-cover border-2 border-[#dedbd0] dark:border-[#32323e] shadow-md bg-white dark:bg-[#212129]"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-3xl bg-white dark:bg-[#18181f] border border-[#dedbd0] dark:border-[#2e2e38] shadow-sm flex items-center justify-center text-4xl" aria-hidden="true">
                    {analytics.hasTopPayer ? '👑' : '🧾'}
                  </div>
                )}
                {analytics.hasTopPayer && (
                  <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] font-mono font-bold text-[11px] shadow-xs">
                    #1
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-[#18181b] dark:text-white tracking-tight break-words">
                  {s1.heading}
                </h3>
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-1">
                  {s1.subline}
                </p>
              </div>

              <div className="tactile-card p-5 text-left space-y-2">
                <div className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                  {s1.amountLabel}
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono tracking-tight">
                  {s1.amountValue}
                </div>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 pt-2.5 border-t border-dashed border-[#e6e4dc] dark:border-[#2e2e38]">
                  {s1.shareLine}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/85 dark:bg-[#18181f] border border-[#e6e4dc] dark:border-[#272732] text-xs font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {s1.footerNote}
              </div>
            </div>
          )}

          {/* SLIDE 2: STANDOUT BILL */}
          {currentSlide === 2 && (
            <div className="space-y-4 animate-fade-in">
              <span className="inline-block px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-900 dark:text-sky-300 border border-sky-200 dark:border-sky-800/50 text-[11px] font-bold tracking-wide uppercase">
                {s2.chapter}
              </span>

              <div>
                <h3 className="text-2xl font-extrabold text-[#18181b] dark:text-white tracking-tight">
                  {s2.heading}
                </h3>
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-1">
                  {s2.subline}
                </p>
              </div>

              <div className="tactile-card p-5 space-y-2">
                <span className="text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider block">
                  {isEn ? 'Expense title' : 'Tên khoản chi'}
                </span>
                <h4 className="text-lg sm:text-xl font-extrabold text-[#18181b] dark:text-white line-clamp-2 break-words">
                  {s2.billTitle}
                </h4>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                  {s2.billAmount}
                </div>
              </div>

              <div className="tactile-card p-4 sm:p-5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="text-zinc-600 dark:text-zinc-400 font-medium shrink-0">{s2.payerLabel}</span>
                  <strong className="text-[#18181b] dark:text-white font-bold truncate max-w-[60%] text-right">{s2.payerValue}</strong>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-zinc-600 dark:text-zinc-400 font-medium shrink-0">{s2.dateLabel}</span>
                  <span className="font-mono font-bold text-[#18181b] dark:text-white">{s2.dateValue}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-zinc-600 dark:text-zinc-400 font-medium flex items-center gap-1 shrink-0">
                    <Users className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{s2.splitLabel}</span>
                  </span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">{s2.splitValue}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/85 dark:bg-[#18181f] border border-[#e6e4dc] dark:border-[#272732] text-xs font-medium text-zinc-700 dark:text-zinc-300 text-center leading-relaxed">
                {s2.footerNote}
              </div>
            </div>
          )}

          {/* SLIDE 3: HONEST SETTLEMENT PROGRESS */}
          {currentSlide === 3 && (
            <div className="space-y-4 animate-fade-in">
              <span
                className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border ${
                  analytics.isFullySettled
                    ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
                }`}
              >
                {s3.chapter}
              </span>

              <div>
                <h3 className="text-2xl font-extrabold text-[#18181b] dark:text-white tracking-tight">
                  {s3.heading}
                </h3>
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-1">
                  {s3.subline}
                </p>
              </div>

              <div className="tactile-card p-5 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-zinc-600 dark:text-zinc-400">{s3.progressLabel}</span>
                  <span
                    className={`font-mono font-extrabold ${
                      analytics.isFullySettled
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {s3.progressPercentText}
                  </span>
                </div>

                <div className="w-full h-3 rounded-full bg-[#f4f3ec] dark:bg-[#212129] border border-[#e6e4dc] dark:border-[#32323e] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      analytics.isFullySettled ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${analytics.settlementPercent}%` }}
                  />
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {s3.settlerDesc}
                </p>
              </div>

              <div className="tactile-card p-5 space-y-1.5">
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block">
                  {s3.settlerCardTitle}
                </span>
                <div className="text-lg font-extrabold text-[#18181b] dark:text-white break-words">
                  {s3.settlerName}
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 4: RECAP SUMMARY CARD */}
          {currentSlide === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] text-[11px] font-bold tracking-wide uppercase">
                  {s4.chapter}
                </span>
                <span className="text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400">
                  {s4.yearBadge}
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-[#18181b] dark:text-white tracking-tight line-clamp-2 break-words">
                  {s4.heading}
                </h3>
                <p className="text-xs font-mono font-semibold text-zinc-600 dark:text-zinc-400 mt-1">
                  {s4.meta}
                </p>
              </div>

              <div className="tactile-card p-5 space-y-3 text-xs">
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-dashed border-[#e6e4dc] dark:border-[#2e2e38]">
                  <span className="text-zinc-600 dark:text-zinc-400 font-medium">{s4.row1Label}</span>
                  <strong className="text-base font-extrabold font-mono text-[#18181b] dark:text-white">{s4.row1Value}</strong>
                </div>

                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="text-zinc-600 dark:text-zinc-400 font-medium shrink-0">{s4.row2Label}</span>
                  <strong className="font-bold text-[#18181b] dark:text-white truncate max-w-[58%] text-right">{s4.row2Value}</strong>
                </div>

                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="text-zinc-600 dark:text-zinc-400 font-medium shrink-0">{s4.row3Label}</span>
                  <strong className="font-bold text-emerald-700 dark:text-emerald-400 truncate max-w-[58%] text-right">{s4.row3Value}</strong>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 min-w-0">
                  <span className="text-zinc-600 dark:text-zinc-400 font-medium shrink-0">{s4.row4Label}</span>
                  <strong
                    className={`font-bold text-right ${
                      analytics.isFullySettled
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {s4.row4Value}
                  </strong>
                </div>
              </div>

              <div
                className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 ${
                  analytics.isFullySettled
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300'
                    : 'bg-white dark:bg-[#18181f] border-[#e6e4dc] dark:border-[#2e2e38] text-[#18181b] dark:text-white'
                }`}
              >
                <Award className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{s4.footerPill}</span>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* BOTTOM STORY CONTROL & EXPORT BAR */}
        <div className="relative z-20 px-3 sm:px-4 pt-2.5 pb-[max(0.875rem,calc(env(safe-area-inset-bottom)+0.5rem))] sm:pb-4 shrink-0 bg-[#f4f3ec]/90 dark:bg-[#14141a]/90 backdrop-blur-md border-t border-[#e6e4dc]/60 dark:border-[#2e2e38]/70">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentSlide === 0}
                className={`w-11 h-11 rounded-full border border-[#dedbd0] dark:border-[#32323e] bg-white dark:bg-[#212129] text-[#18181b] dark:text-white flex items-center justify-center transition-all cursor-pointer ${
                  currentSlide === 0
                    ? 'opacity-35 cursor-not-allowed'
                    : 'hover:bg-[#eae8df] dark:hover:bg-[#2c2c36] active:scale-95'
                }`}
                title={t('previousSlide', 'Trang trước')}
                aria-label={t('previousSlide', 'Trang trước')}
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.4]" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={currentSlide === totalSlides - 1}
                className={`w-11 h-11 rounded-full border border-[#dedbd0] dark:border-[#32323e] bg-white dark:bg-[#212129] text-[#18181b] dark:text-white flex items-center justify-center transition-all cursor-pointer ${
                  currentSlide === totalSlides - 1
                    ? 'opacity-35 cursor-not-allowed'
                    : 'hover:bg-[#eae8df] dark:hover:bg-[#2c2c36] active:scale-95'
                }`}
                title={t('nextSlide', 'Trang tiếp theo')}
                aria-label={t('nextSlide', 'Trang tiếp theo')}
              >
                <ChevronRight className="w-4 h-4 stroke-[2.4]" aria-hidden="true" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadAllSlides}
              disabled={exporting}
              className="tactile-btn-pill min-h-[44px] px-3 sm:px-3.5 text-xs font-bold border border-[#dedbd0] dark:border-[#32323e] bg-white dark:bg-[#212129] text-[#18181b] dark:text-white flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              title={t('saveAllSlidesTooltip', 'Tải toàn bộ 5 ảnh story về máy')}
            >
              <Layers className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{t('saveAllSlidesBtn', 'Tải cả 5')}</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownloadSlide(currentSlide)}
              disabled={exporting}
              aria-label={
                exporting
                  ? t('saving', 'Đang tạo...')
                  : `${isEn ? 'Save' : 'Lưu ảnh'} (${currentSlide + 1}/5)`
              }
              className="tactile-btn-dark flex-1 min-w-0 min-h-[44px] px-3 sm:px-3.5 justify-center text-xs sm:text-sm font-bold disabled:opacity-50"
              title={t('saveSlideTooltip', 'Lưu ảnh Story trang này (PNG)')}
            >
              <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {exporting
                  ? t('saving', 'Đang tạo...')
                  : isEn
                    ? `Save (${currentSlide + 1}/5)`
                    : (
                      <>
                        Lưu<span className="hidden min-[390px]:inline"> ảnh</span> ({currentSlide + 1}/5)
                      </>
                    )}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* iOS & Mobile Scrollable Image Preview Modal (Supports 1 or all 5 slides + Share Sheet) */}
      {previewImages && previewImages.length > 0 && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="wrapped-ios-preview-title"
          className="fixed inset-0 z-[120] bg-[#f4f3ec]/92 dark:bg-[#0f0f12]/92 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewImages(null)}
        >
          <div
            ref={previewDialogRef}
            className="w-full max-w-sm bg-white dark:bg-[#18181f] rounded-3xl border border-[#dedbd0] dark:border-[#2e2e38] shadow-2xl p-4 sm:p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                id="wrapped-ios-preview-title"
                className="font-extrabold text-sm text-[#18181b] dark:text-white"
              >
                {t('saveStoryHeader', 'LƯU ẢNH STORY')}
                {previewImages.length > 1 ? ` (${previewImages.length})` : ''}
              </span>
              <button
                type="button"
                onClick={() => setPreviewImages(null)}
                aria-label={t('close', 'Đóng')}
                className="w-11 h-11 rounded-full bg-[#f4f3ec] dark:bg-[#212129] hover:bg-[#eae8df] dark:hover:bg-[#2c2c36] text-[#18181b] dark:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              {t('longPressSaveNotice', 'Nhấn giữ vào ảnh bên dưới trong 1 giây, sau đó chọn "Lưu vào Ảnh" (Save to Photos) để tải về máy.')}
            </div>

            {canNativeFileShare && (
              <button
                type="button"
                onClick={handleNativeSharePreview}
                className="tactile-btn-dark w-full min-h-[44px] justify-center text-xs font-bold"
              >
                <Share2 className="w-4 h-4" aria-hidden="true" />
                <span>{isEn ? 'Share / Save via Share Sheet' : 'Chia sẻ / Lưu nhanh qua Share Sheet'}</span>
              </button>
            )}

            <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
              {previewImages.map((img) => (
                <div
                  key={img.slideIndex}
                  className="p-2 rounded-2xl bg-[#f4f3ec] dark:bg-[#212129] border border-[#e6e4dc] dark:border-[#32323e] space-y-1.5"
                >
                  <div className="text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 px-1">
                    {img.label}
                  </div>
                  <img
                    src={img.url}
                    alt={`Spliqo Wrapped ${img.label}`}
                    className="w-full h-auto rounded-xl object-contain select-auto"
                    style={{ WebkitTouchCallout: 'default' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
