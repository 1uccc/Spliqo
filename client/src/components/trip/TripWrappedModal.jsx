import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Download,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Receipt,
  Layers,
  X,
  Play,
  Pause,
  Award
} from 'lucide-react';
import { formatVND } from '../../services/calculation';
import confetti from 'canvas-confetti';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { lockBodyScroll, unlockBodyScroll } from '../../utils/scrollLock';

export default function TripWrappedModal({
  isOpen,
  onClose,
  trip,
  expenses = [],
  members = [],
  balances,
  settlements = []
}) {
  const { isEn } = useLanguage();
  const { showToast } = useToast();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const totalSlides = 5;
  const slideDuration = 6000; // 6 seconds per story slide
  const timerRef = useRef(null);
  const storyContainerRef = useRef(null);

  // Analytics computation
  const totalExpense = balances?.totalExpense || 0;
  const memberCount = Math.max(members.length, 1);
  const avgPerPerson = Math.round(totalExpense / memberCount);

  // Dates
  const parseDate = (dStr) => {
    if (!dStr) return new Date();
    const [y, m, d] = dStr.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };
  const startDate = parseDate(trip?.startDate);
  const endDate = parseDate(trip?.endDate);
  const totalDays = Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1);

  // 1. Top Payer MVP
  const sortedMembersByPaid = [...(balances?.members || [])].sort((a, b) => (b.totalPaid || 0) - (a.totalPaid || 0));
  const topPayer = sortedMembersByPaid[0] || balances?.topPayer || { displayName: 'Thành viên', totalPaid: 0 };
  const topPayerPercent = totalExpense > 0 ? Math.round((topPayer.totalPaid / totalExpense) * 100) : 0;

  // 2. Most expensive bill
  const sortedExpenses = [...expenses].sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0));
  const topExpense = sortedExpenses[0] || null;
  const topExpensePayer = topExpense ? members.find(m => (m.userId || m.uid || m.id) === topExpense.paidBy) : null;

  // 3. Fastest settlement / Team spirit
  const confirmedSettlements = settlements.filter(s => s.status === 'CONFIRMED');
  const fastestSettler = confirmedSettlements[0]?.fromUser || (members.length > 1 ? members[1] : members[0]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    lockBodyScroll();
    return () => {
      unlockBodyScroll();
    };
  }, [isOpen]);

  // Trigger celebration confetti when reaching the final ticket slide
  useEffect(() => {
    if (isOpen && currentSlide === totalSlides - 1) {
      try {
        confetti({
          particleCount: 50,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {
        // Confetti optional
      }
    }
  }, [isOpen, currentSlide]);

  // Auto-advance story timer
  useEffect(() => {
    if (!isOpen || isPaused) return;

    const intervalTime = 50;
    const increment = (intervalTime / slideDuration) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentSlide < totalSlides - 1) {
            setCurrentSlide((curr) => curr + 1);
            return 0;
          } else {
            setIsPaused(true);
            return 100;
          }
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(timerRef.current);
  }, [isOpen, isPaused, currentSlide, totalSlides]);

  // Reset timer progress on slide change
  useEffect(() => {
    setProgress(0);
  }, [currentSlide]);

  const handleNext = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide((prev) => prev + 1);
      setProgress(0);
    }
  }, [currentSlide, totalSlides]);

  const handlePrev = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
      setProgress(0);
    }
  }, [currentSlide]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  // Copy text recap to clipboard
  const handleCopyRecap = async () => {
    const text = isEn ? `┌──────────────────────────────────────────────┐
  ★ SPLIQO WRAPPED // Y2K RETRO RECAP ★
  EXPEDITION: ${trip.name.toUpperCase()} [#${trip.tripCode || 'SPLIQO'}]
└──────────────────────────────────────────────┘
✦ TOTAL TRIP SPENT: ${formatVND(totalExpense)}
✦ AVERAGE / PERSON: ${formatVND(avgPerPerson)}/person
✦ TIMELINE: ${totalDays} DAYS • ${members.length} MEMBERS • ${expenses.length} BILLS

👑 THE MONEY LORD (TOP SPENDER):
  ${topPayer.displayName} (Paid upfront: ${formatVND(topPayer.totalPaid)} ~ ${topPayerPercent}%)

🥩 RECORD-BREAKING BILL:
  "${topExpense ? topExpense.title : 'None'}" - ${topExpense ? formatVND(topExpense.amount) : '0đ'}

⚡ 100% RECONCILED // ZERO DRAMA:
  All debts settled seamlessly via VietQR!
────────────────────────────────────────────────
✦ Generated smartly with Spliqo App` : `┌──────────────────────────────────────────────┐
  ★ SPLIQO WRAPPED // KỶ LỤC CHUYẾN ĐI ★
  CHUYẾN ĐI: ${trip.name.toUpperCase()} [#${trip.tripCode || 'SPLIQO'}]
└──────────────────────────────────────────────┘
✦ TỔNG CHI PHÍ: ${formatVND(totalExpense)}
✦ ĐỊNH MỨC BÌNH QUÂN: ${formatVND(avgPerPerson)}/người
✦ QUY MÔ: ${totalDays} NGÀY • ${members.length} THÀNH VIÊN • ${expenses.length} HÓA ĐƠN

👑 CHỦ TỊCH GÁNH TEAM:
  ${topPayer.displayName} (Đã ứng trước: ${formatVND(topPayer.totalPaid)} ~ ${topPayerPercent}%)

🥩 HÓA ĐƠN KỶ LỤC:
  "${topExpense ? topExpense.title : 'Chưa có'}" - ${topExpense ? formatVND(topExpense.amount) : '0đ'}

⚡ 100% SÒNG PHẲNG // ZERO DRAMA:
  Mọi công nợ tất toán thần tốc qua VietQR chuẩn từng đồng!
────────────────────────────────────────────────
✦ Quản lý tài chính nhóm bởi Spliqo App`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast(isEn ? 'Copied recap to clipboard!' : 'Đã sao chép nội dung recap!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Không thể sao chép tự động', 'error');
    }
  };

  // Canvas Generator: Y2K Retro-Futurism × Neo-Psychedelic × Maximalist Digital Design (1080x1920)
  const generateSlideCanvas = (slideIndex) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');

    // 1. Deep Black Canvas Background
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, 1080, 1920);

    // 2. Cyber Matrix Grid Lines
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1.5;
    for (let x = 40; x < 1080; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1920);
      ctx.stroke();
    }
    for (let y = 40; y < 1920; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1080, y);
      ctx.stroke();
    }

    // 3. Ambient Psychedelic Glow Orbs
    const drawGlowOrb = (cx, cy, r, color) => {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, color);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    };

    drawGlowOrb(900, 300, 500, 'rgba(123, 44, 191, 0.35)');
    drawGlowOrb(180, 1100, 450, 'rgba(0, 240, 255, 0.25)');
    drawGlowOrb(800, 1600, 550, 'rgba(255, 0, 85, 0.2)');

    // 4. Retro 3D Ribbons (Curved 3D Neon Gradient Bands)
    const draw3DRibbon = (startY, midY, endY, c1, c2, c3, c4) => {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineWidth = 76;
      const grad = ctx.createLinearGradient(0, startY, 1080, endY);
      grad.addColorStop(0, c1);
      grad.addColorStop(0.35, c2);
      grad.addColorStop(0.7, c3);
      grad.addColorStop(1, c4);

      ctx.strokeStyle = grad;
      ctx.shadowColor = c2;
      ctx.shadowBlur = 45;
      ctx.beginPath();
      ctx.moveTo(-60, startY);
      ctx.bezierCurveTo(320, startY - 140, 760, midY, 1140, endY);
      ctx.stroke();

      // Inner 3D Highlight Tube
      ctx.lineWidth = 14;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.shadowBlur = 0;
      ctx.stroke();
      ctx.restore();
    };

    if (slideIndex === 0) {
      draw3DRibbon(380, 780, 1200, '#00F0FF', '#0047FF', '#7B2CBF', '#FF0055');
    } else if (slideIndex === 1) {
      draw3DRibbon(440, 850, 1300, '#FF0055', '#7B2CBF', '#FFE600', '#00F0FF');
    } else if (slideIndex === 2) {
      draw3DRibbon(350, 920, 1400, '#00FF66', '#00F0FF', '#7B2CBF', '#FFE600');
    } else if (slideIndex === 3) {
      draw3DRibbon(400, 750, 1250, '#FFE600', '#FF0055', '#7B2CBF', '#00F0FF');
    } else {
      draw3DRibbon(320, 880, 1450, '#00F0FF', '#7B2CBF', '#FF0055', '#FFE600');
    }

    // 5. Helper: Stepped Pixelated Gradient Card
    const drawPixelCard = (x, y, w, h, fill = '#0a0a14', stepC1 = '#00F0FF', stepC2 = '#7B2CBF', stepC3 = '#FF0055') => {
      // Step 3 shadow
      ctx.fillStyle = stepC3;
      ctx.fillRect(x + 16, y + 16, w, h);

      // Step 2 shadow
      ctx.fillStyle = stepC2;
      ctx.fillRect(x + 10, y + 10, w, h);

      // Step 1 shadow
      ctx.fillStyle = stepC1;
      ctx.fillRect(x + 4, y + 4, w, h);

      // Card body
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, w, h);

      // Neon Border
      ctx.lineWidth = 4;
      ctx.strokeStyle = stepC1;
      ctx.strokeRect(x, y, w, h);

      // 8-bit Pixel Corners
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 2, y - 2, 10, 10);
      ctx.fillRect(x + w - 8, y - 2, 10, 10);
      ctx.fillRect(x - 2, y + h - 8, 10, 10);
      ctx.fillRect(x + w - 8, y + h - 8, 10, 10);
    };

    // 6. Helper: Starburst Glyphs (✦)
    const drawStarburst = (cx, cy, spikes = 4, outerR = 24, innerR = 6, color = '#FFE600') => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      let step = Math.PI / spikes;

      ctx.moveTo(cx, cy - outerR);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerR;
        y = cy + Math.sin(rot) * outerR;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerR;
        y = cy + Math.sin(rot) * innerR;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerR);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    // 7. Top Header Ribbon (Common to stories)
    // Story progress indicator bar
    for (let i = 0; i < totalSlides; i++) {
      const barW = (1080 - 140 - 4 * 12) / 5;
      const barX = 70 + i * (barW + 12);
      ctx.fillStyle = i <= slideIndex ? '#00F0FF' : 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(barX, 60, barW, 6);
    }

    // Top Brand Tag
    ctx.fillStyle = '#FFE600';
    ctx.font = '900 24px monospace';
    ctx.fillText('SPLIQO // 2026 WRAPPED ✦', 70, 115);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#00F0FF';
    ctx.font = '900 24px monospace';
    ctx.fillText(`STORY 0${slideIndex + 1} / 05`, 1010, 115);
    ctx.textAlign = 'left';

    // 8. RENDER CHAPTER CONTENT
    if (slideIndex === 0) {
      // SLIDE 0: THE EXPEDITION
      drawStarburst(940, 220, 4, 36, 8, '#FFE600');
      drawStarburst(120, 720, 4, 28, 6, '#00F0FF');

      // Chapter badge
      ctx.fillStyle = '#FFE600';
      ctx.fillRect(70, 170, 360, 46);
      ctx.fillStyle = '#000000';
      ctx.font = '900 20px monospace';
      ctx.fillText('✦ CHAPTER 01 // OVERVIEW', 90, 201);

      // Hero Trip Name (Chromatic Aberration style)
      ctx.font = '900 78px sans-serif';
      const truncName = trip.name.length > 18 ? trip.name.substring(0, 16) + '...' : trip.name;
      ctx.fillStyle = '#FF0055';
      ctx.fillText(truncName.toUpperCase(), 74, 304);
      ctx.fillStyle = '#00F0FF';
      ctx.fillText(truncName.toUpperCase(), 66, 296);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(truncName.toUpperCase(), 70, 300);

      // Subtitle
      ctx.fillStyle = '#A1A1AA';
      ctx.font = 'bold 26px monospace';
      ctx.fillText(
        isEn
          ? `[ ${totalDays} DAYS EXPLORING • ${members.length} MEMBERS • #${trip.tripCode || 'SPLIQO'} ]`
          : `[ ${totalDays} NGÀY KHÁM PHÁ • ${members.length} THÀNH VIÊN • #${trip.tripCode || 'SPLIQO'} ]`,
        70,
        355
      );

      // Main Budget Card (Stepped Pixel Gradient Border)
      drawPixelCard(70, 420, 940, 460, '#0c0c16', '#00F0FF', '#7B2CBF', '#FF0055');

      ctx.fillStyle = '#00F0FF';
      ctx.font = '900 22px monospace';
      ctx.fillText(isEn ? '► TOTAL EXPEDITION BUDGET' : '► TỔNG CHI PHÍ TOÀN BỘ CHUYẾN ĐI', 110, 485);

      ctx.fillStyle = '#FFE600';
      ctx.font = '900 110px monospace';
      ctx.fillText(formatVND(totalExpense), 110, 630);

      // Dashed neon divider
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.setLineDash([10, 10]);
      ctx.moveTo(110, 710);
      ctx.lineTo(970, 710);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#A1A1AA';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(isEn ? 'Average per person:' : 'Định mức bình quân:', 110, 790);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#00FF66';
      ctx.font = '900 36px monospace';
      ctx.fillText(`${formatVND(avgPerPerson)}/${isEn ? 'person' : 'người'}`, 970, 790);
      ctx.textAlign = 'left';

      // Two Mini Pixel Cards
      drawPixelCard(70, 940, 450, 260, '#0c0c16', '#FFE600', '#FF0055', '#7B2CBF');
      ctx.fillStyle = '#FFE600';
      ctx.font = '900 24px monospace';
      ctx.fillText('⚡ BILLS // HÓA ĐƠN', 105, 1010);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 58px sans-serif';
      ctx.fillText(`${expenses.length} KHOẢN CHI`, 105, 1110);

      drawPixelCard(560, 940, 450, 260, '#0c0c16', '#00FF66', '#00F0FF', '#7B2CBF');
      ctx.fillStyle = '#00FF66';
      ctx.font = '900 24px monospace';
      ctx.fillText('🪐 JOURNEY // THỜI GIAN', 595, 1010);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 58px sans-serif';
      ctx.fillText(`${totalDays} NGÀY ĐI`, 595, 1110);

      // Highlight Slogan Box
      drawPixelCard(70, 1260, 940, 260, '#0c0c16', '#FF0055', '#FFE600', '#00F0FF');
      ctx.fillStyle = '#FF0055';
      ctx.font = '900 28px sans-serif';
      ctx.fillText('✦ STATUS: 100% RECONCILED // ZERO DRAMA', 110, 1335);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('Tài chính rõ ràng minh bạch giúp tình bạn luôn bền chặt!', 110, 1405);
      ctx.fillText('Mọi chi phí phân chia sòng phẳng, chuẩn xác từng đồng.', 110, 1455);

    } else if (slideIndex === 1) {
      // SLIDE 1: THE MONEY LORD (TOP SPENDER)
      drawStarburst(920, 220, 4, 38, 9, '#FF0055');
      drawStarburst(140, 760, 4, 28, 6, '#FFE600');

      // Chapter badge
      ctx.fillStyle = '#FF0055';
      ctx.fillRect(70, 170, 420, 46);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 20px monospace';
      ctx.fillText('👑 CHAPTER 02 // TOP SPENDER MVP', 90, 201);

      // Title
      ctx.font = '900 70px sans-serif';
      ctx.fillStyle = '#FFE600';
      ctx.fillText('ĐẠI GIA GÁNH TEAM', 70, 295);

      ctx.fillStyle = '#A1A1AA';
      ctx.font = 'bold 26px monospace';
      ctx.fillText('[ THE MONEY LORD OF THE EXPEDITION ]', 70, 345);

      // Avatar Showcase Card
      drawPixelCard(340, 410, 400, 360, '#0c0c16', '#FFE600', '#FF0055', '#7B2CBF');
      ctx.fillStyle = '#FF0055';
      ctx.font = '900 110px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('👑', 540, 580);
      ctx.fillStyle = '#FFE600';
      ctx.font = '900 26px monospace';
      ctx.fillText('#1 SPENDER // 9999 HP', 540, 670);
      ctx.textAlign = 'left';

      // Name Headline
      ctx.textAlign = 'center';
      ctx.font = '900 64px sans-serif';
      ctx.fillStyle = '#00F0FF';
      ctx.fillText(topPayer.displayName.toUpperCase(), 540, 850);
      ctx.fillStyle = '#A1A1AA';
      ctx.font = 'bold 26px monospace';
      ctx.fillText('CHỦ TỊCH QUẸT THẺ NHANH NHẤT HỆ MẶT TRỜI', 540, 905);
      ctx.textAlign = 'left';

      // Hero Stat Card
      drawPixelCard(70, 970, 940, 380, '#0c0c16', '#FF0055', '#FFE600', '#00F0FF');
      ctx.fillStyle = '#FF0055';
      ctx.font = '900 24px monospace';
      ctx.fillText('► SỐ TIỀN ĐÃ ỨNG TRƯỚC CHO CẢ ĐOÀN:', 110, 1045);

      ctx.fillStyle = '#FFE600';
      ctx.font = '900 108px monospace';
      ctx.fillText(formatVND(topPayer.totalPaid), 110, 1180);

      ctx.strokeStyle = 'rgba(255, 0, 85, 0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.setLineDash([10, 10]);
      ctx.moveTo(110, 1235);
      ctx.lineTo(970, 1235);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText(`Chiếm tới ${topPayerPercent}% toàn bộ ngân sách cả chuyến đi!`, 110, 1295);

      // Thank You Shoutout
      drawPixelCard(70, 1400, 940, 180, '#0c0c16', '#FFE600', '#00FF66', '#7B2CBF');
      ctx.fillStyle = '#00FF66';
      ctx.font = '900 26px sans-serif';
      ctx.fillText('🙏 CREW SHOUTOUT // TRI ÂN CHỦ TỊCH', 110, 1465);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('Cảm ơn chủ tịch đã quẹt thẻ chi trả trước cho mọi hoạt động ăn chơi!', 110, 1520);

    } else if (slideIndex === 2) {
      // SLIDE 2: THE RECORD BREAKER
      drawStarburst(940, 220, 4, 38, 9, '#00FF66');
      drawStarburst(140, 780, 4, 28, 6, '#00F0FF');

      // Chapter badge
      ctx.fillStyle = '#00FF66';
      ctx.fillRect(70, 170, 440, 46);
      ctx.fillStyle = '#000000';
      ctx.font = '900 20px monospace';
      ctx.fillText('🥩 CHAPTER 03 // RECORD-BREAKING BILL', 90, 201);

      // Title
      ctx.font = '900 70px sans-serif';
      ctx.fillStyle = '#00FF66';
      ctx.fillText('HÓA ĐƠN KỶ LỤC', 70, 295);

      ctx.fillStyle = '#A1A1AA';
      ctx.font = 'bold 26px monospace';
      ctx.fillText('[ THE HEAVYWEIGHT CHAMPION OF EXPENSES ]', 70, 345);

      // Big Bill Card
      drawPixelCard(70, 410, 940, 480, '#0c0c16', '#00FF66', '#00F0FF', '#7B2CBF');
      ctx.fillStyle = '#00F0FF';
      ctx.font = '900 24px monospace';
      ctx.fillText('► BILL KỶ LỤC CỦA CHUYẾN ĐI', 110, 480);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 58px sans-serif';
      const expTitle = topExpense ? `"${topExpense.title}"` : '"Chưa có khoản chi"';
      const truncExp = expTitle.length > 20 ? expTitle.substring(0, 18) + '..."' : expTitle;
      ctx.fillText(truncExp.toUpperCase(), 110, 580);

      ctx.fillStyle = '#00FF66';
      ctx.font = '900 110px monospace';
      ctx.fillText(formatVND(topExpense ? topExpense.amount : 0), 110, 730);

      const expPct = totalExpense > 0 && topExpense ? Math.round((topExpense.amount / totalExpense) * 100) : 0;
      ctx.fillStyle = '#A1A1AA';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(`Chiếm ${expPct}% tổng chi tiêu toàn đoàn!`, 110, 820);

      // Bill Details Matrix
      drawPixelCard(70, 940, 940, 380, '#0c0c16', '#FFE600', '#FF0055', '#7B2CBF');
      ctx.fillStyle = '#FFE600';
      ctx.font = '900 28px monospace';
      ctx.fillText('✦ TRANSACTION ANATOMY // CHI TIẾT', 110, 1020);

      ctx.font = 'bold 30px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`• Người thanh toán:`, 110, 1100);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#00F0FF';
      ctx.fillText(`${topExpensePayer?.displayName || 'Thành viên'}`, 970, 1100);
      ctx.textAlign = 'left';

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`• Ngày ghi nhận:`, 110, 1180);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFE600';
      ctx.fillText(`${topExpense?.date || 'Trong chuyến đi'}`, 970, 1180);
      ctx.textAlign = 'left';

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`• Quy mô chia bill:`, 110, 1260);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#00FF66';
      ctx.fillText(`${topExpense?.participants?.length || members.length} thành viên`, 970, 1260);
      ctx.textAlign = 'left';

      // Slogan
      drawPixelCard(70, 1370, 940, 200, '#0c0c16', '#FF0055', '#FFE600', '#00FF66');
      ctx.fillStyle = '#FF0055';
      ctx.font = '900 28px sans-serif';
      ctx.fillText('✦ BILL NÀY GÁNH CẢ THANH XUÂN', 110, 1445);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('Những bữa ăn ngon nhất chính là những kỷ niệm đắt giá nhất!', 110, 1505);

    } else if (slideIndex === 3) {
      // SLIDE 3: ZERO DRAMA / 100% SÒNG PHẲNG
      drawStarburst(940, 220, 4, 38, 9, '#FFE600');
      drawStarburst(140, 800, 4, 32, 7, '#00F0FF');

      // Chapter badge
      ctx.fillStyle = '#7B2CBF';
      ctx.fillRect(70, 170, 450, 46);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 20px monospace';
      ctx.fillText('⚡ CHAPTER 04 // FAIR PLAY ENERGY', 90, 201);

      // Title
      ctx.font = '900 70px sans-serif';
      ctx.fillStyle = '#00F0FF';
      ctx.fillText('100% SÒNG PHẲNG', 70, 295);

      ctx.fillStyle = '#A1A1AA';
      ctx.font = 'bold 26px monospace';
      ctx.fillText('[ ZERO DRAMA • MAXIMUM CREDIBILITY ]', 70, 345);

      // Center Lightning Icon Box
      drawPixelCard(420, 410, 240, 240, '#0c0c16', '#FFE600', '#FF0055', '#00F0FF');
      ctx.fillStyle = '#FFE600';
      ctx.font = '900 120px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡', 540, 580);
      ctx.textAlign = 'left';

      // Main Progress Card
      drawPixelCard(70, 710, 940, 400, '#0c0c16', '#00F0FF', '#7B2CBF', '#FF0055');
      ctx.fillStyle = '#00F0FF';
      ctx.font = '900 26px monospace';
      ctx.fillText('► RECONCILIATION PROGRESS // TIẾN ĐỘ', 110, 785);

      ctx.fillStyle = '#FFE600';
      ctx.font = '900 96px monospace';
      ctx.fillText('100% COMPLETE', 110, 910);

      // Rainbow Stepped Progress Bar
      ctx.fillStyle = '#181824';
      ctx.fillRect(110, 955, 860, 44);
      const barGrad = ctx.createLinearGradient(110, 955, 970, 955);
      barGrad.addColorStop(0, '#00F0FF');
      barGrad.addColorStop(0.35, '#7B2CBF');
      barGrad.addColorStop(0.7, '#FF0055');
      barGrad.addColorStop(1, '#FFE600');
      ctx.fillStyle = barGrad;
      ctx.fillRect(110, 955, 860, 44);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#FFFFFF';
      ctx.strokeRect(110, 955, 860, 44);

      ctx.fillStyle = '#A1A1AA';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('Toàn bộ công nợ đã được tất toán chuẩn xác từng đồng qua VietQR!', 110, 1055);

      // Fastest Settler Card
      drawPixelCard(70, 1170, 940, 340, '#0c0c16', '#FFE600', '#00FF66', '#7B2CBF');
      ctx.fillStyle = '#FFE600';
      ctx.font = '900 24px monospace';
      ctx.fillText('✦ LIGHTNING-FAST SETTLER // TẤT TOÁN NHANH NHẤT', 110, 1245);

      ctx.fillStyle = '#00FF66';
      ctx.font = '900 58px sans-serif';
      const settlerName = fastestSettler?.displayName || (isEn ? 'WHOLE CREW' : 'CẢ NHÓM');
      ctx.fillText(settlerName.toUpperCase(), 110, 1345);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('Tinh thần sòng phẳng thần tốc, chuẩn 10 điểm uy tín!', 110, 1430);

    } else if (slideIndex === 4) {
      // SLIDE 4: SPLIQO CYBER BOARDING PASS (FINALE)
      drawStarburst(940, 200, 4, 40, 10, '#FFE600');
      drawStarburst(120, 860, 4, 30, 7, '#FF0055');

      // Chapter badge
      ctx.fillStyle = '#FF0055';
      ctx.fillRect(70, 160, 480, 46);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 20px monospace';
      ctx.fillText('★ CHAPTER 05 // OFFICIAL CYBER PASS', 90, 191);

      // Title
      ctx.font = '900 68px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(truncName.toUpperCase(), 70, 280);

      ctx.fillStyle = '#00F0FF';
      ctx.font = 'bold 26px monospace';
      ctx.fillText(`CODE: #${trip.tripCode || 'SPLIQO'} • TIMELINE: ${trip.startDate || '2026'}`, 70, 330);

      // Giant Cyber Pass Card
      drawPixelCard(70, 380, 940, 860, '#0c0c16', '#00F0FF', '#7B2CBF', '#FF0055');

      // Top Tag
      ctx.fillStyle = '#00F0FF';
      ctx.fillRect(70, 380, 420, 52);
      ctx.fillStyle = '#000000';
      ctx.font = '900 22px monospace';
      ctx.fillText('SPLIQO BOARDING PASS // 2026', 95, 415);

      // Row 1: Total Spent
      ctx.fillStyle = '#A1A1AA';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('Tổng chi tiêu toàn chuyến:', 110, 500);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFE600';
      ctx.font = '900 48px monospace';
      ctx.fillText(formatVND(totalExpense), 970, 500);
      ctx.textAlign = 'left';

      // Row 2: Top Spender
      ctx.fillStyle = '#A1A1AA';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('👑 Chủ tịch gánh team:', 110, 600);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#00F0FF';
      ctx.font = '900 36px sans-serif';
      ctx.fillText(`${topPayer.displayName}`, 970, 600);
      ctx.textAlign = 'left';

      // Row 3: Biggest Bill
      ctx.fillStyle = '#A1A1AA';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('🥩 Hóa đơn kỷ lục:', 110, 700);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#00FF66';
      ctx.font = '900 36px sans-serif';
      const bTitle = topExpense ? topExpense.title : 'Chưa có';
      const bTrunc = bTitle.length > 14 ? bTitle.substring(0, 12) + '...' : bTitle;
      ctx.fillText(`${bTrunc}`, 970, 700);
      ctx.textAlign = 'left';

      // Row 4: Settlement
      ctx.fillStyle = '#A1A1AA';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('⚡ Đối soát công nợ:', 110, 800);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FF0055';
      ctx.font = '900 36px sans-serif';
      ctx.fillText('100% Sòng phẳng', 970, 800);
      ctx.textAlign = 'left';

      // Dashed divider line
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.setLineDash([10, 10]);
      ctx.moveTo(110, 880);
      ctx.lineTo(970, 880);
      ctx.stroke();
      ctx.setLineDash([]);

      // Holographic Stamp Box
      ctx.fillStyle = '#FFE600';
      ctx.font = '900 34px sans-serif';
      ctx.fillText('★ CHỨNG NHẬN SÒNG PHẲNG SPLIQO ★', 110, 960);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('Tài chính rõ ràng • Đi chơi sảng khoái • Trọn vẹn tình bạn', 110, 1030);

      ctx.fillStyle = '#00FF66';
      ctx.font = '900 48px monospace';
      ctx.fillText('GRADE: 10/10 ★★★★★', 110, 1140);

      // Quote Card
      drawPixelCard(70, 1300, 940, 260, '#0c0c16', '#FFE600', '#FF0055', '#00F0FF');
      ctx.fillStyle = '#FFE600';
      ctx.font = '900 28px sans-serif';
      ctx.fillText('✦ KỶ NIỆM VÔ GIÁ CÙNG SPLIQO ✦', 110, 1375);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('Chuyến đi đã khép lại, nhưng những kỷ niệm đẹp sẽ còn mãi.', 110, 1445);
      ctx.fillText('Hẹn gặp lại cả nhóm trong hành trình tiếp theo!', 110, 1500);
    }

    // 9. Bottom Barcode & Cyber Watermark
    const barcodeX = 70;
    const barcodeY = 1760;
    const barPattern = [4, 2, 8, 3, 2, 6, 4, 3, 7, 2, 4, 8, 3, 2, 5, 4, 2, 7, 3, 8, 2, 4, 6, 3, 2, 8, 5, 3, 2, 7];
    let curX = barcodeX;
    ctx.fillStyle = '#00F0FF';
    for (const w of barPattern) {
      ctx.fillRect(curX, barcodeY, w, 50);
      curX += w + 6;
    }

    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = '#A1A1AA';
    ctx.fillText('* SPLIQO-CYBER-WRAPPED-2026 *', barcodeX, 1845);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFE600';
    ctx.font = '900 26px monospace';
    ctx.fillText('SPLIQO.APP ✦ SMART EXPENSE', 1010, 1795);
    ctx.fillStyle = '#00FF66';
    ctx.fillText('CHIA TIỀN TỨC THÌ • CHƠI ĐẸP', 1010, 1835);
    ctx.textAlign = 'left';

    return canvas;
  };

  // Convert canvas to Blob
  const canvasToBlob = (canvas) => {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  };

  // Trigger download helper
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

  // 1. Download single slide image
  const handleDownloadSlide = async (slideIndex) => {
    try {
      setExporting(true);
      const canvas = generateSlideCanvas(slideIndex);
      const blob = await canvasToBlob(canvas);
      const cleanTripName = trip.name.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/g, '_');
      const filename = `Spliqo_Wrapped_${cleanTripName}_Story${slideIndex + 1}.png`;

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

      if (isIOS) {
        setPreviewImage(canvas.toDataURL('image/png'));
      } else {
        triggerDownload(blob, filename);
        showToast(isEn ? `Downloaded Story ${slideIndex + 1}!` : `Đã tải ảnh Story trang ${slideIndex + 1}!`, 'success');
      }
    } catch (err) {
      console.error('Export error:', err);
      showToast('Lỗi khi xuất ảnh', 'error');
    } finally {
      setExporting(false);
    }
  };

  // 2. Download all 5 slides sequentially
  const handleDownloadAllSlides = async () => {
    try {
      setExporting(true);
      showToast(isEn ? 'Preparing all 5 story slides...' : 'Đang xuất toàn bộ 5 ảnh...', 'info');

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

      if (isIOS) {
        const canvas = generateSlideCanvas(currentSlide);
        setPreviewImage(canvas.toDataURL('image/png'));
        return;
      }

      const cleanTripName = trip.name.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/g, '_');

      for (let i = 0; i < totalSlides; i++) {
        const canvas = generateSlideCanvas(i);
        const blob = await canvasToBlob(canvas);
        const filename = `Spliqo_Wrapped_${cleanTripName}_Story${i + 1}.png`;
        triggerDownload(blob, filename);
        await new Promise((resolve) => setTimeout(resolve, 350));
      }

      showToast(isEn ? 'Downloaded all 5 story slides successfully!' : 'Đã tải về toàn bộ 5 ảnh thành công!', 'success');
    } catch (err) {
      console.error('Export all error:', err);
      showToast('Lỗi khi tải ảnh', 'error');
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen || !trip) return null;

  const truncName = trip.name.length > 20 ? trip.name.substring(0, 18) + '...' : trip.name;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-0 sm:p-4 select-none animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* 9:16 Vertical Story Viewer Container */}
      <div
        ref={storyContainerRef}
        className="relative w-full max-w-[440px] h-[100dvh] sm:h-[92dvh] max-h-[900px] flex flex-col justify-between overflow-hidden bg-[#050508] text-white sm:rounded-[2.5rem] border-0 sm:border-2 sm:border-[#00F0FF]/40 shadow-[0_0_60px_rgba(0,240,255,0.25)]"
      >
        {/* Dynamic 3D Psychedelic Ribbon SVG Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-80 z-0">
          <svg className="w-full h-full" viewBox="0 0 440 850" fill="none">
            <defs>
              <linearGradient id="cyberRibbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00F0FF" />
                <stop offset="25%" stopColor="#0047FF" />
                <stop offset="50%" stopColor="#7B2CBF" />
                <stop offset="75%" stopColor="#FF0055" />
                <stop offset="100%" stopColor="#FFE600" />
              </linearGradient>
              <filter id="ribbonGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="10" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Ambient Background Grid */}
            <g stroke="rgba(0, 240, 255, 0.08)" strokeWidth="1">
              {Array.from({ length: 15 }).map((_, i) => (
                <line key={`v-${i}`} x1={i * 32} y1="0" x2={i * 32} y2="850" />
              ))}
              {Array.from({ length: 28 }).map((_, i) => (
                <line key={`h-${i}`} x1="0" y1={i * 32} x2="440" y2={i * 32} />
              ))}
            </g>

            {/* 3D Curving Twisted Ribbon */}
            <path
              d={
                currentSlide === 0
                  ? "M-40,180 C80,80 140,420 260,320 C380,220 360,650 480,560"
                  : currentSlide === 1
                    ? "M-30,280 C120,180 160,520 280,420 C400,320 380,720 480,680"
                    : currentSlide === 2
                      ? "M-40,220 C100,320 180,180 300,450 C380,620 420,520 480,750"
                      : currentSlide === 3
                        ? "M-30,350 C80,200 160,580 300,400 C390,280 380,700 480,620"
                        : "M-40,150 C120,250 180,120 280,380 C360,550 400,450 480,700"
              }
              stroke="url(#cyberRibbonGrad)"
              strokeWidth="42"
              strokeLinecap="round"
              filter="url(#ribbonGlow)"
              className="transition-all duration-700 ease-out"
            />

            {/* White Tube Specular Highlight */}
            <path
              d={
                currentSlide === 0
                  ? "M-40,180 C80,80 140,420 260,320 C380,220 360,650 480,560"
                  : currentSlide === 1
                    ? "M-30,280 C120,180 160,520 280,420 C400,320 380,720 480,680"
                    : currentSlide === 2
                      ? "M-40,220 C100,320 180,180 300,450 C380,620 420,520 480,750"
                      : currentSlide === 3
                        ? "M-30,350 C80,200 160,580 300,400 C390,280 380,700 480,620"
                        : "M-40,150 C120,250 180,120 280,380 C360,550 400,450 480,700"
              }
              stroke="rgba(255, 255, 255, 0.7)"
              strokeWidth="6"
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
        </div>

        {/* TOP STORY HEADER & PROGRESS BARS */}
        <div className="relative z-20 px-4 pt-3.5 pb-2 space-y-2.5 shrink-0 bg-gradient-to-b from-black/90 via-black/60 to-transparent">
          {/* Segmented Story Progress Bar (Instagram / Spotify Wrapped style) */}
          <div className="flex items-center gap-1.5 w-full">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setCurrentSlide(idx);
                  setProgress(0);
                }}
                className="h-1 flex-1 rounded-full overflow-hidden bg-white/20 cursor-pointer"
              >
                <div
                  className="h-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF] transition-all duration-100 ease-linear"
                  style={{
                    width: idx < currentSlide ? '100%' : idx === currentSlide ? `${progress}%` : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Top Bar Navigation & Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-[#FFE600] text-black font-mono font-black text-[10px] tracking-wider uppercase shadow-[2px_2px_0px_#FF0055]">
                SPLIQO WRAPPED ✦
              </span>
              <span className="font-mono text-xs font-bold text-[#00F0FF] tracking-wider">
                STORY {currentSlide + 1}/5
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Play/Pause Button */}
              <button
                type="button"
                onClick={() => setIsPaused((p) => !p)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                title={isPaused ? "Tiếp tục" : "Tạm dừng"}
              >
                {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-[#FF0055] text-white flex items-center justify-center transition-all cursor-pointer hover:rotate-90 active:scale-90"
                title="Đóng (ESC)"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>

        {/* TAP NAVIGATION ZONES (Left 30% = Prev, Right 70% = Next) */}
        <div
          className="absolute inset-0 z-10 flex"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          <div
            className="w-[28%] h-full cursor-w-resize"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
          />
          <div
            className="w-[72%] h-full cursor-e-resize"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
          />
        </div>

        {/* STORY SLIDE CONTENT CONTAINER */}
        <div className="relative z-10 flex-1 px-4 sm:px-5 flex flex-col justify-center overflow-y-auto custom-scrollbar my-auto py-2">

          {/* SLIDE 0: CHAPTER 01 • THE EXPEDITION (BỨC TRANH TÀI CHÍNH) */}
          {currentSlide === 0 && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="inline-block px-2.5 py-0.5 bg-[#FFE600] text-black font-mono font-black text-[10px] tracking-wider uppercase shadow-[2px_2px_0px_#FF0055]">
                  ✦ CHƯƠNG 01 // OVERVIEW ✦
                </span>
                <span className="text-[#FFE600] text-lg font-black animate-pulse">✶</span>
              </div>

              <div>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase drop-shadow-[0_0_15px_#00F0FF] leading-none">
                  {truncName}
                </h2>
                <p className="text-[11px] font-mono font-bold text-[#A1A1AA] mt-1 tracking-wider">
                  [ {totalDays} NGÀY KHÁM PHÁ • {members.length} THÀNH VIÊN • #{trip.tripCode || 'SPLIQO'} ]
                </p>
              </div>

              {/* Main Stat Card (Stepped Pixelated Gradient Border) */}
              <div className="p-4 bg-[#0a0a14] border-2 border-[#00F0FF] shadow-[4px_4px_0px_#7B2CBF,8px_8px_0px_#FF0055] space-y-1 relative">
                <div className="flex items-center justify-between text-[10px] font-mono font-black text-[#00F0FF] tracking-wider uppercase">
                  <span>► TỔNG CHI PHÍ CHUYẾN ĐI</span>
                  <span className="text-white text-xs">✦</span>
                </div>
                <div className="text-3xl sm:text-4xl font-black text-[#FFE600] font-mono tracking-tight drop-shadow-[0_0_12px_rgba(255,230,0,0.5)]">
                  {formatVND(totalExpense)}
                </div>
                <div className="pt-2 border-t-2 border-dashed border-[#00F0FF]/30 flex items-center justify-between text-xs font-bold font-mono">
                  <span className="text-zinc-400">Định mức bình quân:</span>
                  <span className="text-[#00FF66] font-black">{formatVND(avgPerPerson)}/người</span>
                </div>
              </div>

              {/* Two Mini Pixel Cards */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-[#0a0a14] border-2 border-[#FFE600] shadow-[3px_3px_0px_#FF0055] space-y-0.5">
                  <div className="text-[9px] font-mono font-black text-[#FFE600] uppercase tracking-wider flex items-center gap-1">
                    <Receipt className="w-3 h-3" />
                    <span>HÓA ĐƠN</span>
                  </div>
                  <div className="text-lg font-black text-white font-sans tracking-tight">
                    {expenses.length} KHOẢN CHI
                  </div>
                </div>

                <div className="p-3 bg-[#0a0a14] border-2 border-[#00FF66] shadow-[3px_3px_0px_#00F0FF] space-y-0.5">
                  <div className="text-[9px] font-mono font-black text-[#00FF66] uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>HÀNH TRÌNH</span>
                  </div>
                  <div className="text-lg font-black text-white font-sans tracking-tight">
                    {totalDays} NGÀY ĐI
                  </div>
                </div>
              </div>

              {/* Highlight Tag */}
              <div className="p-2.5 bg-[#0a0a14] border border-[#FF0055] shadow-[2px_2px_0px_#FFE600] flex items-center justify-between text-[11px] font-mono font-bold">
                <span className="text-[#FF0055] font-black">✦ STATUS: 100% RECONCILED</span>
                <span className="text-[#00F0FF]">ZERO DRAMA ⚡</span>
              </div>
            </div>
          )}

          {/* SLIDE 1: CHAPTER 02 • THE MONEY LORD (CHỦ TỊCH GÁNH TEAM) */}
          {currentSlide === 1 && (
            <div className="space-y-3.5 animate-fade-in text-center">
              <div className="flex justify-center">
                <span className="px-3 py-0.5 bg-[#FF0055] text-white font-mono font-black text-[10px] tracking-wider uppercase shadow-[2px_2px_0px_#FFE600]">
                  CHƯƠNG 02 // TOP SPENDER MVP
                </span>
              </div>

              {/* Avatar Box with Stepped Neon Gradient */}
              <div className="relative inline-block mx-auto">
                <div className="w-20 h-20 rounded-none bg-[#0c0c16] border-2 border-[#FFE600] shadow-[4px_4px_0px_#FF0055,8px_8px_0px_#7B2CBF] p-1 overflow-hidden flex items-center justify-center">
                  <span className="text-4xl drop-shadow-[0_0_15px_#FFE600]">👑</span>
                </div>
                <div className="absolute -bottom-2 -right-2 px-1.5 py-0.5 bg-[#FFE600] text-black font-mono font-black text-[9px] shadow-[1.5px_1.5px_0px_#000]">
                  #1 MVP
                </div>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#00F0FF] uppercase tracking-tight drop-shadow-[0_0_12px_#00F0FF]">
                  {topPayer.displayName}
                </h3>
                <p className="text-[10px] font-mono font-bold text-zinc-400 tracking-wider mt-0.5">
                  [ NGƯỜI CHỊU CHI BẠO TAY NHẤT CẢ CHUYẾN ĐI ]
                </p>
              </div>

              {/* Main Spend Box */}
              <div className="p-3.5 bg-[#0a0a14] border-2 border-[#FF0055] shadow-[4px_4px_0px_#FFE600] text-left space-y-1">
                <div className="text-[9px] font-mono font-black uppercase text-[#FF0055] tracking-wider">
                  ► TỔNG TIỀN ĐÃ ỨNG TRƯỚC:
                </div>
                <div className="text-2xl sm:text-3xl font-black text-[#FFE600] font-mono tracking-tight drop-shadow-[0_0_10px_rgba(255,230,0,0.5)]">
                  {formatVND(topPayer.totalPaid)}
                </div>
                <p className="text-[11px] font-bold text-zinc-300 pt-1 border-t border-dashed border-[#FF0055]/30">
                  Gánh tới <strong className="text-[#00F0FF] font-black">{topPayerPercent}%</strong> toàn bộ ngân sách chi tiêu cả đoàn!
                </p>
              </div>

              {/* Shoutout Tag */}
              <div className="p-2.5 bg-[#0a0a14] border border-[#00FF66] shadow-[2px_2px_0px_#7B2CBF] text-[11px] text-zinc-300 font-bold">
                🙏 Cả đoàn xin nghiêng mình cảm tạ chủ tịch đã quẹt thẻ trước không trượt phát nào!
              </div>
            </div>
          )}

          {/* SLIDE 2: CHAPTER 03 • THE RECORD BREAKER (HÓA ĐƠN KỶ LỤC) */}
          {currentSlide === 2 && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="flex justify-between items-center">
                <span className="px-3 py-0.5 bg-[#00FF66] text-black font-mono font-black text-[10px] tracking-wider uppercase shadow-[2px_2px_0px_#00F0FF]">
                  CHƯƠNG 03 // BIGGEST RECORD BILL
                </span>
                <span className="text-[#00FF66] text-base font-black">✦</span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                  HÓA ĐƠN KỶ LỤC
                </h3>
                <p className="text-[10px] font-mono font-bold text-zinc-400 tracking-wider">
                  [ THE HEAVYWEIGHT CHAMPION OF EXPENSES ]
                </p>
              </div>

              {/* Record Bill Card */}
              <div className="p-3.5 bg-[#0a0a14] border-2 border-[#00FF66] shadow-[4px_4px_0px_#00F0FF,8px_8px_0px_#7B2CBF] space-y-1">
                <span className="text-[9px] font-mono font-black text-[#00F0FF] uppercase tracking-wider">
                  ► HÓA ĐƠN ĐẮT ĐỎ NHẤT
                </span>
                <h4 className="text-lg sm:text-xl font-black text-white uppercase truncate">
                  {topExpense ? `"${topExpense.title}"` : '"Chưa có khoản chi"'}
                </h4>
                <div className="text-2xl sm:text-3xl font-black text-[#00FF66] font-mono drop-shadow-[0_0_12px_rgba(0,255,102,0.5)]">
                  {formatVND(topExpense ? topExpense.amount : 0)}
                </div>
              </div>

              {/* Anatomy details */}
              <div className="p-3 bg-[#0a0a14] border-2 border-[#FFE600] shadow-[3px_3px_0px_#FF0055] text-xs font-bold font-mono space-y-1.5">
                <div className="flex justify-between text-zinc-300">
                  <span>Người thanh toán:</span>
                  <strong className="text-[#00F0FF]">{topExpensePayer?.displayName || 'Thành viên'}</strong>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Ngày ghi nhận:</span>
                  <span className="text-[#FFE600]">{topExpense?.date || 'Trong chuyến đi'}</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Số người chia:</span>
                  <span className="text-[#00FF66]">{topExpense?.participants?.length || members.length} thành viên</span>
                </div>
              </div>

              {/* Tagline */}
              <div className="p-2.5 bg-[#0a0a14] border border-[#FF0055] text-[11px] text-zinc-200 font-bold text-center">
                ✦ Bữa ăn ngon nhất chính là những kỷ niệm đắt giá nhất! ✦
              </div>
            </div>
          )}

          {/* SLIDE 3: CHAPTER 04 • ZERO DRAMA / 100% SÒNG PHẲNG */}
          {currentSlide === 3 && (
            <div className="space-y-3.5 animate-fade-in text-center">
              <div className="flex justify-center">
                <span className="px-3 py-0.5 bg-[#7B2CBF] text-white font-mono font-black text-[10px] tracking-wider uppercase shadow-[2px_2px_0px_#00F0FF]">
                  ⚡ CHƯƠNG 04 // FAIR-PLAY ENERGY ⚡
                </span>
              </div>

              <div className="w-16 h-16 mx-auto bg-[#0c0c16] border-2 border-[#FFE600] shadow-[4px_4px_0px_#00F0FF] flex items-center justify-center">
                <span className="text-3xl drop-shadow-[0_0_15px_#FFE600]">⚡</span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#00F0FF] tracking-tight uppercase">
                  100% SÒNG PHẲNG
                </h3>
                <p className="text-[10px] font-mono font-bold text-zinc-400 tracking-wider">
                  [ ZERO DRAMA • MAXIMUM CREDIBILITY ]
                </p>
              </div>

              {/* Progress Card */}
              <div className="p-3.5 bg-[#0a0a14] border-2 border-[#00F0FF] shadow-[4px_4px_0px_#FF0055] text-left space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono font-black text-[#00F0FF] uppercase tracking-wider">
                  <span>TIẾN ĐỘ ĐỐI SOÁT:</span>
                  <span className="text-[#FFE600]">100% COMPLETE</span>
                </div>

                {/* Stepped Pixel Progress Bar */}
                <div className="w-full bg-zinc-900 h-3 border border-white/20 p-0.5">
                  <div className="h-full w-full bg-gradient-to-r from-[#00F0FF] via-[#7B2CBF] to-[#FFE600] shadow-[0_0_8px_#00F0FF]" />
                </div>

                <p className="text-[10px] text-zinc-300 font-bold">
                  Mọi khoản nợ được tất toán thần tốc và minh bạch chuẩn từng đồng qua VietQR!
                </p>
              </div>

              {/* Fastest Settler */}
              <div className="p-3 bg-[#0a0a14] border-2 border-[#FFE600] shadow-[3px_3px_0px_#00FF66] text-left">
                <div className="text-[9px] font-mono font-black text-[#FFE600] uppercase tracking-wider">
                  ⚡ THÀNH VIÊN THANH TOÁN THẦN TỐC:
                </div>
                <div className="text-lg font-black text-[#00FF66] uppercase mt-0.5">
                  {fastestSettler?.displayName || (isEn ? 'Whole crew' : 'Cả nhóm')}
                </div>
                <p className="text-[10px] font-mono text-zinc-400">
                  Quét mã QR nhanh như chớp, chuẩn 10/10 uy tín!
                </p>
              </div>
            </div>
          )}

          {/* SLIDE 4: CHAPTER 05 • CYBER BOARDING PASS (FINALE) */}
          {currentSlide === 4 && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 bg-[#FF0055] text-white font-mono font-black text-[10px] tracking-wider uppercase shadow-[2px_2px_0px_#FFE600]">
                  ★ CHƯƠNG 05 // CYBER PASS ★
                </span>
                <span className="text-[#FFE600] text-sm font-mono font-black">2026 // PASS</span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight truncate">
                  {truncName}
                </h3>
                <p className="text-[10px] font-mono font-bold text-[#00F0FF] tracking-wider">
                  CODE: #{trip.tripCode || 'SPLIQO'} • {trip.startDate}
                </p>
              </div>

              {/* The Cyber Ticket Breakdown */}
              <div className="p-3.5 bg-[#0a0a14] border-2 border-[#00F0FF] shadow-[4px_4px_0px_#7B2CBF,8px_8px_0px_#FF0055] space-y-1.5 text-xs font-mono font-bold">
                <div className="flex justify-between items-center pb-1 border-b border-dashed border-[#00F0FF]/30">
                  <span className="text-zinc-400">Tổng chi toàn chuyến:</span>
                  <strong className="text-sm font-black text-[#FFE600]">{formatVND(totalExpense)}</strong>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-400">Chi bạo nhất:</span>
                  <strong className="text-[#00F0FF] truncate max-w-[150px]">{topPayer.displayName}</strong>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-400">Bill đắt nhất:</span>
                  <strong className="text-[#00FF66] truncate max-w-[150px]">{topExpense ? topExpense.title : 'Chưa có'}</strong>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-400">Đối soát:</span>
                  <strong className="text-[#FF0055]">100%</strong>
                </div>
              </div>

              {/* Holographic Badge */}
              <div className="p-2.5 bg-[#0a0a14] border-2 border-[#FFE600] shadow-[3px_3px_0px_#00FF66] flex items-center justify-between text-xs font-bold">
                <span className="text-[#FFE600] font-black flex items-center gap-1.5 text-[11px]">
                  <Award className="w-4 h-4 text-[#FFE600]" />
                  <span>CHỨNG NHẬN SÒNG PHẲNG</span>
                </span>
                <span className="font-mono font-black text-[#00FF66] text-xs">10/10 ★★★★★</span>
              </div>
            </div>
          )}

        </div>

        {/* BOTTOM STORY CONTROL & ACTION BAR */}
        <div className="relative z-20 px-3.5 py-3 shrink-0 bg-gradient-to-t from-black via-black/95 to-transparent border-t border-white/10 space-y-2">
          {/* Main Action Buttons */}
          <div className="flex items-center justify-between gap-2">
            {/* Prev / Next Small Arrows */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentSlide === 0}
                className={`p-2 rounded-lg border border-white/20 bg-white/5 text-white transition-all cursor-pointer ${currentSlide === 0 ? 'opacity-25 cursor-not-allowed' : 'hover:bg-white/15 active:scale-95'
                  }`}
                title="Trang trước"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={currentSlide === totalSlides - 1}
                className={`p-2 rounded-lg border border-white/20 bg-white/5 text-white transition-all cursor-pointer ${currentSlide === totalSlides - 1 ? 'opacity-25 cursor-not-allowed' : 'hover:bg-white/15 active:scale-95'
                  }`}
                title="Trang tiếp theo"
              >
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Copy Recap */}
            <button
              type="button"
              onClick={handleCopyRecap}
              className="px-2.5 py-2 rounded-lg border border-white/20 bg-white/5 hover:bg-white/15 text-white font-mono font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              title="Sao chép văn bản recap"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#00FF66]" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[11px]">{copied ? 'Đã copy' : 'Copy'}</span>
            </button>

            {/* Save All 5 Slides */}
            <button
              type="button"
              onClick={handleDownloadAllSlides}
              disabled={exporting}
              className="px-2.5 py-2 rounded-lg border border-[#7B2CBF] bg-[#7B2CBF]/20 hover:bg-[#7B2CBF]/40 text-[#00F0FF] font-mono font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              title="Tải toàn bộ 5 ảnh story về máy"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="text-[11px]">Tải cả 5</span>
            </button>

            {/* Primary CTA: Save Current Slide Image */}
            <button
              type="button"
              onClick={() => handleDownloadSlide(currentSlide)}
              disabled={exporting}
              className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-[#FF0055] to-[#FFE600] text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(255,0,85,0.5)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              title="Lưu ảnh Story trang này (PNG)"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="text-[11px] truncate">
                {exporting ? 'Đang tạo...' : `Lưu ảnh (${currentSlide + 1}/5)`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* iOS & Mobile Fallback Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="w-full max-w-sm bg-[#0a0a14] border-2 border-[#00F0FF] shadow-[0_0_30px_rgba(0,240,255,0.4)] p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-sm text-[#00F0FF] uppercase tracking-wider font-mono">
                📸 LƯU ẢNH STORY
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 bg-yellow-950/40 border border-[#FFE600] text-[11px] text-[#FFE600] font-mono leading-relaxed">
              Nhấn giữ vào ảnh bên dưới trong <strong>1 giây</strong>, sau đó chọn <strong>"Lưu vào Ảnh" (Save to Photos)</strong> để tải về máy.
            </div>

            <div className="max-h-[65vh] overflow-y-auto border border-white/20 flex justify-center bg-black p-1">
              <img
                src={previewImage}
                alt="Spliqo Wrapped Story"
                className="w-full h-auto object-contain select-auto"
                style={{ WebkitTouchCallout: 'default' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
