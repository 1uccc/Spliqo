import React, { useState, useEffect, useRef } from 'react';
import Modal from '../Modal';
import { 
  Sparkles, 
  Crown, 
  Zap, 
  UtensilsCrossed, 
  Download, 
  Copy, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Calendar, 
  Receipt,
  Award,
  ArrowRight,
  Layers
} from 'lucide-react';
import { formatVND } from '../../services/calculation';
import confetti from 'canvas-confetti';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';

export default function TripWrappedModal({
  isOpen,
  onClose,
  trip,
  expenses = [],
  members = [],
  balances,
  settlements = []
}) {
  const { isDark } = useTheme();
  const { isEn } = useLanguage();
  const { showToast } = useToast();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const cardRef = useRef(null);

  const totalSlides = 5;

  // Trigger celebration confetti when reaching the final ticket slide
  useEffect(() => {
    if (isOpen && currentSlide === totalSlides - 1) {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {
        // Confetti optional
      }
    }
  }, [isOpen, currentSlide]);

  if (!trip) return null;

  // Analytics
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

  // 1. Top Payer
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

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  // Copy text recap to clipboard
  const handleCopyRecap = async () => {
    const text = isEn ? `┌──────────────────────────────────┐
  ★ SPLIQO WRAPPED • TRIP MEMORIES ★
  TRIP: ${trip.name.toUpperCase()}
└──────────────────────────────────┘
● Total Expenses: ${formatVND(totalExpense)}
● Duration: ${totalDays} days • ${members.length} members • ${expenses.length} bills
● Average per person: ${formatVND(avgPerPerson)}/person

👑 TOP SPENDER MVP:
  ${topPayer.displayName} (Paid upfront: ${formatVND(topPayer.totalPaid)} ~ ${topPayerPercent}%)

🥩 MOST EXPENSIVE BILL:
  "${topExpense ? topExpense.title : 'None'}" - ${topExpense ? formatVND(topExpense.amount) : '0đ'}

⚡ TEAM SPIRIT & FAIRNESS:
  100% group debts reconciled with zero hassle!
────────────────────────────────────
✦ Managed smartly with Spliqo App` : `┌──────────────────────────────────┐
  ★ SPLIQO WRAPPED • KÝ ỨC CHUYẾN ĐI ★
  CHUYẾN: ${trip.name.toUpperCase()}
└──────────────────────────────────┘
● Tổng chi tiêu: ${formatVND(totalExpense)}
● Thời gian: ${totalDays} ngày • ${members.length} người • ${expenses.length} hóa đơn
● Chi phí bình quân: ${formatVND(avgPerPerson)}/người

👑 ĐẠI GIA GÁNH TEAM:
  ${topPayer.displayName} (Ứng trước: ${formatVND(topPayer.totalPaid)} ~ ${topPayerPercent}%)

🥩 HÓA ĐƠN ĐẮT ĐỎ NHẤT:
  "${topExpense ? topExpense.title : 'Chưa có'}" - ${topExpense ? formatVND(topExpense.amount) : '0đ'}

⚡ TINH THẦN SÒNG PHẲNG:
  100% công nợ tất toán qua VietQR chuẩn từng đồng!
────────────────────────────────────
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

  // Generate canvas image matching the exact on-screen card design of each slide (Image 1 style)
  const generateSlideCanvas = (slideIndex) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1440;
    const ctx = canvas.getContext('2d');

    const isDarkPoster = isDark;
    const bgBackdrop = isDarkPoster ? '#121218' : '#edebe4';
    const cardBg = isDarkPoster ? '#1a1a24' : '#fbf9f3';
    const cardFill = isDarkPoster ? '#252532' : '#ffffff';
    const textPrimary = isDarkPoster ? '#ffffff' : '#18181b';
    const textMuted = isDarkPoster ? '#a1a1aa' : '#52525b';
    const borderStroke = isDarkPoster ? '#3f3f46' : '#18181b';
    const shadowColor = isDarkPoster ? 'rgba(0,0,0,0.85)' : '#18181b';
    const yellowCardBg = isDarkPoster ? '#2d2919' : '#fef08a';
    const peachCardBg = isDarkPoster ? '#2e2118' : '#fed7aa';
    const yellowCardText = isDarkPoster ? '#fef08a' : '#18181b';
    const peachCardText = isDarkPoster ? '#fed7aa' : '#18181b';
    const dashedColor = isDarkPoster ? 'rgba(255, 255, 255, 0.2)' : 'rgba(24, 24, 27, 0.2)';

    // Helper: Rounded Rectangle Path
    const drawRoundedRect = (c, x, y, width, height, radius) => {
      c.beginPath();
      c.moveTo(x + radius, y);
      c.lineTo(x + width - radius, y);
      c.arcTo(x + width, y, x + width, y + radius, radius);
      c.lineTo(x + width, y + height - radius);
      c.arcTo(x + width, y + height, x + width - radius, y + height, radius);
      c.lineTo(x + radius, y + height);
      c.arcTo(x, y + height, x, y + height - radius, radius);
      c.lineTo(x, y + radius);
      c.arcTo(x, y, x + radius, y, radius);
      c.closePath();
    };

    // Helper: Brutalist Card with Hard Drop Shadow
    const drawCard = (x, y, w, h, radius, fill, shadowOffset = 7, strokeW = 4.5) => {
      ctx.fillStyle = shadowColor;
      drawRoundedRect(ctx, x + shadowOffset, y + shadowOffset, w, h, radius);
      ctx.fill();

      ctx.fillStyle = fill;
      drawRoundedRect(ctx, x, y, w, h, radius);
      ctx.fill();

      ctx.lineWidth = strokeW;
      ctx.strokeStyle = borderStroke;
      drawRoundedRect(ctx, x, y, w, h, radius);
      ctx.stroke();
    };

    // Helper: Dashed Divider Line
    const drawDashedLine = (x1, y1, x2, y2, color = dashedColor, width = 2.5) => {
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    };

    // Helper: Bottom Barcode & Footer matching on-screen card
    const drawBottomBarcode = (slideIdx) => {
      ctx.save();
      ctx.strokeStyle = isDarkPoster ? 'rgba(255,255,255,0.2)' : 'rgba(24,24,27,0.2)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(115, 1220);
      ctx.lineTo(965, 1220);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = textMuted;
      ctx.font = 'bold 30px monospace';
      ctx.fillText('||| | |||| | |||', 115, 1275);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#ff5400';
      ctx.font = '900 28px sans-serif';
      const label = slideIdx < 4 ? (isEn ? 'NEXT →' : 'TIẾP THEO →') : (isEn ? 'FINISH ★' : 'KẾT THÚC ★');
      ctx.fillText(label, 965, 1275);
      ctx.textAlign = 'left';
    };

    // 1. Canvas Backdrop
    ctx.fillStyle = bgBackdrop;
    ctx.fillRect(0, 0, 1080, 1440);

    // 2. Main Card Container (x=60, y=70, w=960, h=1300, r=32)
    const cardX = 60;
    const cardY = 70;
    const cardW = 960;
    const cardH = 1300;
    const cardRadius = 32;

    // Outer card drop shadow
    ctx.fillStyle = shadowColor;
    drawRoundedRect(ctx, cardX + 10, cardY + 10, cardW, cardH, cardRadius);
    ctx.fill();

    // Outer card body fill
    ctx.fillStyle = cardBg;
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
    ctx.fill();

    // Subtle Halftone Dot Matrix Texture inside Card (Clipped to rounded card)
    ctx.save();
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
    ctx.clip();
    ctx.fillStyle = isDarkPoster ? 'rgba(255, 255, 255, 0.12)' : 'rgba(24, 24, 27, 0.16)';
    for (let dx = cardX + 16; dx < cardX + cardW; dx += 28) {
      for (let dy = cardY + 16; dy < cardY + cardH; dy += 28) {
        ctx.beginPath();
        ctx.arc(dx, dy, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
    ctx.restore();

    // Outer card border
    ctx.lineWidth = 5;
    ctx.strokeStyle = borderStroke;
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
    ctx.stroke();

    // 3. Top Orange Tape Sticker (Overlapping card top edge, tilted -1.2 deg)
    ctx.save();
    ctx.translate(540, cardY);
    ctx.rotate((-1.2 * Math.PI) / 180);
    const tapeW = 420;
    const tapeH = 50;
    ctx.fillStyle = shadowColor;
    ctx.fillRect(-tapeW / 2 + 3.5, -tapeH / 2 + 3.5, tapeW, tapeH);
    ctx.fillStyle = '#ff5400';
    ctx.fillRect(-tapeW / 2, -tapeH / 2, tapeW, tapeH);
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = borderStroke;
    ctx.strokeRect(-tapeW / 2, -tapeH / 2, tapeW, tapeH);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★ SPLIQO VINTAGE TICKET ★', 0, 1);
    ctx.restore();

    // 4. RENDER SLIDE CONTENT (Matching on-screen layout exactly, no extra cards)
    if (slideIndex === 0) {
      // Pill badge: FINANCIAL OVERVIEW • #CODE
      const badgeText = `FINANCIAL OVERVIEW • #${trip.tripCode || 'SPLIQO'}`;
      ctx.font = 'bold 18px monospace';
      const badgeTextWidth = ctx.measureText(badgeText).width;
      const badgeW = badgeTextWidth + 32;
      const badgeH = 38;
      drawCard(115, 135, badgeW, badgeH, 8, isDarkPoster ? '#ffffff' : '#18181b', 3, 2.5);
      ctx.fillStyle = isDarkPoster ? '#18181b' : '#ffffff';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(badgeText, 131, 160);

      // Title: Trip Name
      ctx.fillStyle = textPrimary;
      ctx.font = '900 56px sans-serif';
      const nameTrunc = trip.name.length > 20 ? trip.name.substring(0, 18) + '...' : trip.name;
      ctx.fillText(nameTrunc.toUpperCase(), 115, 235);

      // Subtitle: X NGÀY KHÁM PHÁ • Y THÀNH VIÊN
      ctx.fillStyle = textMuted;
      ctx.font = 'bold 20px monospace';
      ctx.fillText(
        `${totalDays} ${isEn ? 'DAYS OF EXPLORING' : 'NGÀY KHÁM PHÁ'} • ${members.length} ${isEn ? 'MEMBERS' : 'THÀNH VIÊN'}`,
        115,
        275
      );

      // Big Card: Total Expense
      drawCard(115, 310, 850, 400, 24, cardFill, 7);
      ctx.fillStyle = textMuted;
      ctx.font = 'bold 18px monospace';
      ctx.fillText(isEn ? 'TOTAL TRIP EXPENSES' : 'TỔNG CHI PHÍ TOÀN BỘ CHUYẾN ĐI', 150, 365);

      ctx.fillStyle = '#ff5400';
      ctx.font = '900 96px monospace';
      ctx.fillText(formatVND(totalExpense), 150, 500);

      drawDashedLine(150, 565, 925, 565);

      ctx.fillStyle = textMuted;
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(isEn ? 'Average quota:' : 'Định mức bình quân:', 150, 640);
      ctx.textAlign = 'right';
      ctx.fillStyle = textPrimary;
      ctx.font = '900 28px monospace';
      ctx.fillText(`${formatVND(avgPerPerson)}/${isEn ? 'person' : 'người'}`, 925, 640);
      ctx.textAlign = 'left';

      // Two Mini Cards
      // Left: Bills
      drawCard(115, 745, 410, 230, 22, yellowCardBg, 7);
      ctx.fillStyle = yellowCardText;
      ctx.font = 'bold 19px monospace';
      ctx.fillText(isEn ? '💵 BILLS' : '💵 HÓA ĐƠN', 145, 805);
      ctx.font = '900 40px sans-serif';
      ctx.fillText(`${expenses.length} ${isEn ? 'EXPENSES' : 'KHOẢN CHI'}`, 145, 905);

      // Right: Journey
      drawCard(555, 745, 410, 230, 22, peachCardBg, 7);
      ctx.fillStyle = peachCardText;
      ctx.font = 'bold 19px monospace';
      ctx.fillText(isEn ? '📅 JOURNEY' : '📅 HÀNH TRÌNH', 585, 805);
      ctx.font = '900 40px sans-serif';
      ctx.fillText(`${totalDays} ${isEn ? 'DAYS TOGETHER' : 'NGÀY ĐỒNG HÀNH'}`, 585, 905);

      // Barcode Row
      drawBottomBarcode(0);

    } else if (slideIndex === 1) {
      // Header Badge
      const mvpBadgeText = isEn ? '👑 TOP SPENDER MVP 👑' : '👑 CHỦ TỊCH GÁNH TEAM 👑';
      ctx.font = '900 22px sans-serif';
      const mvpBadgeW = ctx.measureText(mvpBadgeText).width + 36;
      drawCard(540 - mvpBadgeW / 2, 135, mvpBadgeW, 46, 10, '#ff5400', 4);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = '900 22px sans-serif';
      ctx.fillText(mvpBadgeText, 540, 166);
      ctx.textAlign = 'left';

      // Avatar Container
      drawCard(440, 215, 200, 200, 24, cardFill, 7);
      ctx.fillStyle = '#ff5400';
      ctx.font = '900 84px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('👑', 540, 335);

      // MVP mini badge
      drawCard(580, 375, 96, 36, 8, '#fef08a', 4, 3);
      ctx.fillStyle = '#18181b';
      ctx.font = '900 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('#1 MVP', 628, 399);

      // Name & Subtitle
      ctx.textAlign = 'center';
      ctx.fillStyle = textPrimary;
      ctx.font = '900 48px sans-serif';
      const payerName = topPayer.displayName.length > 20 ? topPayer.displayName.substring(0, 18) + '...' : topPayer.displayName;
      ctx.fillText(payerName.toUpperCase(), 540, 480);
      ctx.fillStyle = textMuted;
      ctx.font = 'bold 20px monospace';
      ctx.fillText(isEn ? 'MOST GENEROUS SPENDER OF THE TRIP' : 'NGƯỜI CHỊU CHI BẠO TAY NHẤT CHUYẾN ĐI', 540, 525);
      ctx.textAlign = 'left';

      // Big Card
      drawCard(115, 575, 850, 360, 24, cardFill, 7);
      ctx.fillStyle = textMuted;
      ctx.font = 'bold 18px monospace';
      ctx.fillText(isEn ? 'TOTAL PAID UPFRONT:' : 'SỐ TIỀN ĐÃ ỨNG TRƯỚC:', 150, 635);

      ctx.fillStyle = '#ff5400';
      ctx.font = '900 90px monospace';
      ctx.fillText(formatVND(topPayer.totalPaid), 150, 765);

      drawDashedLine(150, 835, 925, 835);

      ctx.fillStyle = textMuted;
      ctx.font = 'bold 24px sans-serif';
      const repStr = isEn ? 'Represents ' : 'Chiếm tới ';
      ctx.fillText(repStr, 150, 895);
      const repW = ctx.measureText(repStr).width;
      ctx.fillStyle = textPrimary;
      ctx.font = '900 24px sans-serif';
      ctx.fillText(`${topPayerPercent}% `, 150 + repW, 895);
      const pctW = ctx.measureText(`${topPayerPercent}% `).width;
      ctx.fillStyle = textMuted;
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(isEn ? 'of total trip expenses.' : 'toàn bộ chi phí cả đoàn.', 150 + repW + pctW, 895);

      // Barcode Row
      drawBottomBarcode(1);

    } else if (slideIndex === 2) {
      // Badge
      const expBadgeText = isEn ? '🥩 MOST EXPENSIVE BILL 🥩' : '🥩 KHOẢN CHI ĐẮT ĐỎ NHẤT 🥩';
      ctx.font = '900 22px sans-serif';
      const expBadgeW = ctx.measureText(expBadgeText).width + 36;
      drawCard(115, 135, expBadgeW, 46, 10, isDarkPoster ? '#ffffff' : '#18181b', 4);
      ctx.fillStyle = isDarkPoster ? '#18181b' : '#ffffff';
      ctx.font = '900 22px sans-serif';
      ctx.fillText(expBadgeText, 133, 166);

      // Big Card
      drawCard(115, 215, 850, 410, 24, cardFill, 7);
      ctx.fillStyle = textMuted;
      ctx.font = 'bold 18px monospace';
      ctx.fillText(isEn ? 'RECORD BILL OF THE TRIP' : 'BILL KỶ LỤC CỦA CHUYẾN ĐI', 150, 275);

      ctx.fillStyle = textPrimary;
      ctx.font = '900 48px sans-serif';
      const expTitle = topExpense ? `"${topExpense.title.length > 20 ? topExpense.title.substring(0, 18) + '...' : topExpense.title}"` : (isEn ? '"No Expenses"' : '"Chưa có"');
      ctx.fillText(expTitle.toUpperCase(), 150, 365);

      ctx.fillStyle = '#ff5400';
      ctx.font = '900 90px monospace';
      ctx.fillText(formatVND(topExpense ? topExpense.amount : 0), 150, 515);

      // Yellow Detail Card
      drawCard(115, 655, 850, 310, 22, yellowCardBg, 7);
      ctx.fillStyle = yellowCardText;

      // Row 1
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(isEn ? 'Paid by:' : 'Người chi trả:', 150, 725);
      ctx.textAlign = 'right';
      ctx.font = '900 26px sans-serif';
      ctx.fillText(topExpensePayer?.displayName || (isEn ? 'Member' : 'Thành viên'), 925, 725);
      ctx.textAlign = 'left';

      // Row 2
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(isEn ? 'Date logged:' : 'Ngày ghi nhận:', 150, 805);
      ctx.textAlign = 'right';
      ctx.font = '900 26px monospace';
      ctx.fillText(topExpense?.date || (isEn ? 'During trip' : 'Trong chuyến đi'), 925, 805);
      ctx.textAlign = 'left';

      // Row 3
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(isEn ? 'Split between:' : 'Số người chia bill:', 150, 885);
      ctx.textAlign = 'right';
      ctx.font = '900 26px sans-serif';
      ctx.fillText(`${topExpense?.participants?.length || members.length} ${isEn ? 'members' : 'thành viên'}`, 925, 885);
      ctx.textAlign = 'left';

      // Barcode Row
      drawBottomBarcode(2);

    } else if (slideIndex === 3) {
      // Badge
      const settleBadgeText = isEn ? '⚡ LIGHTNING-FAST SETTLEMENT ⚡' : '⚡ SÒNG PHẲNG THẦN TỐC ⚡';
      ctx.font = '900 22px sans-serif';
      const settleBadgeW = ctx.measureText(settleBadgeText).width + 36;
      drawCard(540 - settleBadgeW / 2, 135, settleBadgeW, 46, 10, '#ff5400', 4);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = '900 22px sans-serif';
      ctx.fillText(settleBadgeText, 540, 166);
      ctx.textAlign = 'left';

      // Sparkles Box
      drawCard(460, 215, 160, 160, 24, isDarkPoster ? '#252532' : '#18181b', 7);
      ctx.fillStyle = '#ff5400';
      ctx.font = '900 80px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡', 540, 325);
      ctx.textAlign = 'left';

      // Title & Subtitle
      ctx.fillStyle = textPrimary;
      ctx.font = '900 40px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isEn ? 'PLAY FAIR • SPLIT EVEN' : 'CHƠI ĐẸP • CHIA ĐỀU • TRỌN TÌNH BẠN', 540, 435);
      ctx.fillStyle = textMuted;
      ctx.font = 'bold 20px monospace';
      ctx.fillText(isEn ? '100% RECONCILED TRANSPARENTLY' : '100% CÔNG NỢ ĐÃ TẤT TOÁN MINH BẠCH', 540, 480);
      ctx.textAlign = 'left';

      // Big Card
      drawCard(115, 535, 850, 380, 24, cardFill, 7);
      ctx.fillStyle = textMuted;
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(isEn ? 'RECONCILIATION PROGRESS:' : 'TIẾN ĐỘ ĐỐI SOÁT:', 150, 605);

      ctx.fillStyle = '#ff5400';
      ctx.font = '900 28px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(isEn ? '100% COMPLETE' : '100% HOÀN TẤT', 925, 605);
      ctx.textAlign = 'left';

      // Progress bar
      ctx.fillStyle = isDarkPoster ? '#1a1a24' : '#edebe4';
      drawRoundedRect(ctx, 150, 645, 775, 30, 15);
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = borderStroke;
      ctx.stroke();

      ctx.fillStyle = '#ff5400';
      drawRoundedRect(ctx, 150, 645, 775, 30, 15);
      ctx.fill();

      drawDashedLine(150, 735, 925, 735);

      ctx.fillStyle = textMuted;
      ctx.font = 'bold 24px sans-serif';
      const fastPrefix = `⚡ ${isEn ? 'Fastest payer: ' : 'Thành viên thanh toán thần tốc: '}`;
      ctx.fillText(fastPrefix, 150, 805);
      const fastW = ctx.measureText(fastPrefix).width;
      ctx.fillStyle = textPrimary;
      ctx.font = '900 24px sans-serif';
      const settlerName = fastestSettler?.displayName || (isEn ? 'Whole crew' : 'Cả nhóm');
      ctx.fillText(`${settlerName}!`, 150 + fastW, 805);

      // Barcode Row
      drawBottomBarcode(3);

    } else if (slideIndex === 4) {
      // Header
      drawCard(115, 135, 170, 36, 8, isDarkPoster ? '#ffffff' : '#18181b', 3, 2.5);
      ctx.fillStyle = isDarkPoster ? '#18181b' : '#ffffff';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('SPLIQO TICKET', 130, 159);

      ctx.fillStyle = textPrimary;
      ctx.font = '900 46px sans-serif';
      const truncTitle = trip.name.length > 18 ? trip.name.substring(0, 16) + '...' : trip.name;
      ctx.fillText(truncTitle.toUpperCase(), 115, 225);

      ctx.fillStyle = textMuted;
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(trip.startDate || '2026', 965, 225);
      ctx.textAlign = 'left';

      // Divider
      ctx.strokeStyle = isDarkPoster ? 'rgba(255,255,255,0.2)' : 'rgba(24,24,27,0.2)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(115, 255);
      ctx.lineTo(965, 255);
      ctx.stroke();

      // Breakdown Card
      drawCard(115, 280, 850, 520, 24, cardFill, 7);

      // Row 1: Total Spent
      ctx.fillStyle = textMuted;
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(isEn ? 'Total spent:' : 'Tổng chi:', 150, 345);
      ctx.fillStyle = '#ff5400';
      ctx.font = '900 40px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(formatVND(totalExpense), 925, 345);
      ctx.textAlign = 'left';

      drawDashedLine(150, 395, 925, 395);

      // Row 2: Top Spender
      ctx.fillStyle = textMuted;
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(isEn ? '👑 Top spender:' : '👑 Chi bạo nhất:', 150, 470);
      ctx.fillStyle = textPrimary;
      ctx.font = '900 26px sans-serif';
      ctx.textAlign = 'right';
      const payerShort = `${topPayer.displayName} (${formatVND(topPayer.totalPaid)})`;
      ctx.fillText(payerShort, 925, 470);
      ctx.textAlign = 'left';

      // Row 3: Biggest Bill
      ctx.fillStyle = textMuted;
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(isEn ? '🥩 Biggest bill:' : '🥩 Bill đắt nhất:', 150, 560);
      ctx.fillStyle = textPrimary;
      ctx.font = '900 26px sans-serif';
      ctx.textAlign = 'right';
      const billName = topExpense ? (topExpense.title.length > 16 ? topExpense.title.substring(0, 14) + '...' : topExpense.title) : (isEn ? 'None' : 'Chưa có');
      ctx.fillText(billName, 925, 560);
      ctx.textAlign = 'left';

      // Row 4: Settlement
      ctx.fillStyle = textMuted;
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(isEn ? '⚡ Settlement:' : '⚡ Đối soát:', 150, 650);
      ctx.fillStyle = '#16a34a';
      ctx.font = '900 26px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(isEn ? '100% Fair & Settled' : '100% Sòng phẳng', 925, 650);
      ctx.textAlign = 'left';

      // Stamp Card
      drawCard(115, 835, 850, 160, 20, yellowCardBg, 7);
      ctx.fillStyle = yellowCardText;
      ctx.font = '900 26px sans-serif';
      ctx.fillText(`🏆 ${isEn ? 'SPLIQO CERTIFIED ADVENTURE' : 'CHỨNG NHẬN SÒNG PHẲNG SPLIQO'}`, 150, 930);

      ctx.fillStyle = '#ff5400';
      ctx.font = '900 36px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('10/10 ★', 925, 930);
      ctx.textAlign = 'left';

      // Barcode Row
      drawBottomBarcode(4);
    }

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
      const filename = `Spliqo_Wrapped_${cleanTripName}_Trang${slideIndex + 1}.png`;

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

      if (isIOS) {
        setPreviewImage(canvas.toDataURL('image/png'));
      } else {
        triggerDownload(blob, filename);
        showToast(isEn ? `Downloaded Story Page ${slideIndex + 1}!` : `Đã tải ảnh Story trang ${slideIndex + 1}!`, 'success');
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
        const filename = `Spliqo_Wrapped_${cleanTripName}_Trang${i + 1}.png`;
        triggerDownload(blob, filename);
        // Short delay so browser doesn't block multiple automatic downloads
        await new Promise((resolve) => setTimeout(resolve, 400));
      }

      showToast(isEn ? 'Downloaded all 5 story slides successfully!' : 'Đã tải về toàn bộ 5 ảnh thành công!', 'success');
    } catch (err) {
      console.error('Export all error:', err);
      showToast('Lỗi khi tải ảnh', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-[#ff5400] text-white font-black text-xs tracking-wider uppercase shadow-xs">
              NEO-RETRO
            </span>
            <span className="font-extrabold text-[#18181b] dark:text-white truncate">
              Spliqo Wrapped 📊
            </span>
          </div>
        }
        maxWidth="max-w-md sm:max-w-lg"
        footer={
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 w-full">
            {/* Left: Navigation Controls & Mobile Copy */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentSlide === 0}
                  className={`p-2 rounded-xl text-xs font-black flex items-center justify-center transition-all cursor-pointer border-2 border-[#18181b] dark:border-zinc-700 ${
                    currentSlide === 0 
                      ? 'opacity-30 cursor-not-allowed bg-zinc-200 dark:bg-zinc-800 text-zinc-400' 
                      : 'bg-white dark:bg-[#202028] text-[#18181b] dark:text-white shadow-[2px_2px_0px_#18181b] dark:shadow-[2px_2px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px]'
                  }`}
                  title={isEn ? "Previous Slide" : "Trang trước"}
                >
                  <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                </button>
                <span className="text-xs font-mono font-black px-2.5 py-1 bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] rounded-lg border border-[#18181b] dark:border-white">
                  {currentSlide + 1} / {totalSlides}
                </span>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={currentSlide === totalSlides - 1}
                  className={`p-2 rounded-xl text-xs font-black flex items-center justify-center transition-all cursor-pointer border-2 border-[#18181b] dark:border-zinc-700 ${
                    currentSlide === totalSlides - 1 
                      ? 'opacity-30 cursor-not-allowed bg-zinc-200 dark:bg-zinc-800 text-zinc-400' 
                      : 'bg-white dark:bg-[#202028] text-[#18181b] dark:text-white shadow-[2px_2px_0px_#18181b] dark:shadow-[2px_2px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px]'
                  }`}
                  title={isEn ? "Next Slide" : "Trang tiếp theo"}
                >
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Mobile Copy Button */}
              <button
                type="button"
                onClick={handleCopyRecap}
                className="sm:hidden px-2.5 py-1.5 rounded-xl border-2 border-[#18181b] dark:border-zinc-700 bg-white dark:bg-[#202028] text-xs font-bold flex items-center gap-1 shadow-[2px_2px_0px_#18181b] dark:shadow-[2px_2px_0px_#000000] cursor-pointer"
                title="Copy text recap"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[11px]">{copied ? 'Đã copy' : 'Copy'}</span>
              </button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {/* Desktop Copy Button */}
              <button
                type="button"
                onClick={handleCopyRecap}
                className="hidden sm:flex px-3 py-1.5 rounded-xl border-2 border-[#18181b] dark:border-zinc-700 bg-white dark:bg-[#202028] text-xs font-bold items-center gap-1.5 shadow-[2px_2px_0px_#18181b] dark:shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                title="Copy text recap gửi vào nhóm chat"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã copy text' : 'Copy recap'}</span>
              </button>

              {/* Tải tất cả 5 ảnh */}
              <button
                type="button"
                onClick={handleDownloadAllSlides}
                disabled={exporting}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl border-2 border-[#18181b] dark:border-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[#18181b] dark:text-white font-bold text-xs flex items-center gap-1.5 shadow-[2px_2px_0px_#18181b] dark:shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
                title="Tải tuần tự cả 5 ảnh story về máy"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="text-[11px] sm:text-xs">{isEn ? 'Save All 5' : 'Tải cả 5 ảnh'}</span>
              </button>

              {/* Lưu ảnh trang này (Primary CTA) */}
              <button
                type="button"
                onClick={() => handleDownloadSlide(currentSlide)}
                disabled={exporting}
                className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl border-2 border-[#18181b] dark:border-zinc-700 bg-[#ff5400] hover:bg-[#ea580c] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-[3px_3px_0px_#18181b] dark:shadow-[3px_3px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                title={`Tải ảnh Story trang ${currentSlide + 1}`}
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{exporting ? (isEn ? 'Saving...' : 'Đang tạo...') : (isEn ? `Save Page ${currentSlide + 1}` : `Lưu ảnh trang ${currentSlide + 1}`)}</span>
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-2">
          {/* Brutalist Story Progress Bar */}
          <div className="flex items-center gap-1.5 w-full">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <div
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className="h-1.5 flex-1 rounded-full cursor-pointer overflow-hidden border border-[#18181b] dark:border-zinc-700 bg-[#edebe4] dark:bg-zinc-800 transition-all"
              >
                <div
                  className={`h-full transition-all duration-300 ${
                    idx <= currentSlide ? 'bg-[#ff5400]' : 'bg-transparent'
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Neo-Retro Brutalist Slide Container - Compact, perfectly fits inside modal with ZERO scrollbar */}
          <div 
            ref={cardRef}
            className="relative rounded-3xl p-3.5 sm:p-4 flex flex-col justify-between border-[3px] border-[#18181b] dark:border-zinc-700 shadow-[4px_4px_0px_#18181b] dark:shadow-[4px_4px_0px_rgba(0,0,0,0.8)] bg-[#fbf9f3] dark:bg-[#1a1a24] text-[#18181b] dark:text-[#f4f4f5] select-none transition-all duration-300 mt-2.5"
            style={{
              backgroundImage: isDark 
                ? 'radial-gradient(rgba(255, 255, 255, 0.12) 1.5px, transparent 1.5px)' 
                : 'radial-gradient(rgba(24, 24, 27, 0.18) 1.5px, transparent 1.5px)',
              backgroundSize: '20px 20px',
              minHeight: '360px'
            }}
          >
            {/* Top Tape Sticker */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 bg-[#ff5400] border-2 border-[#18181b] dark:border-black shadow-[1.5px_1.5px_0px_#18181b] text-white text-[10px] font-black uppercase tracking-widest rotate-[-1deg] z-10">
              ★ SPLIQO VINTAGE TICKET ★
            </div>

            {/* SLIDE 0: RETRO INTRO & BIG METRICS */}
            {currentSlide === 0 && (
              <div className="space-y-2.5 animate-fade-in my-auto pt-1">
                <div className="space-y-0.5">
                  <div className="inline-block px-2 py-0.5 rounded-md bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] text-[9px] font-mono font-bold tracking-widest uppercase">
                    FINANCIAL OVERVIEW • #{trip.tripCode || 'SPLIQO'}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#18181b] dark:text-white tracking-tight uppercase truncate">
                    {trip.name}
                  </h2>
                  <p className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 font-mono">
                    {totalDays} {isEn ? 'DAYS OF EXPLORING' : 'NGÀY KHÁM PHÁ'} • {members.length} {isEn ? 'MEMBERS' : 'THÀNH VIÊN'}
                  </p>
                </div>

                {/* Big Number Card */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#252532] border-2 border-[#18181b] dark:border-zinc-700 shadow-[2px_2px_0px_#18181b] dark:shadow-[2px_2px_0px_#000000] space-y-0.5">
                  <span className="text-[9px] font-mono font-black uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">
                    {isEn ? 'TOTAL TRIP EXPENSES' : 'TỔNG CHI PHÍ TOÀN BỘ CHUYẾN ĐI'}
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-[#ff5400] font-mono tracking-tight">
                    {formatVND(totalExpense)}
                  </div>
                  <div className="pt-1 border-t-2 border-dashed border-[#18181b]/20 dark:border-white/15 flex items-center justify-between text-[11px] font-bold">
                    <span className="text-zinc-600 dark:text-zinc-400">{isEn ? 'Average quota:' : 'Định mức bình quân:'}</span>
                    <span className="font-mono text-[#18181b] dark:text-white font-black">{formatVND(avgPerPerson)}/{isEn ? 'person' : 'người'}</span>
                  </div>
                </div>

                {/* Mini Stat Cards */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-[#fef08a] dark:bg-[#2d2919] border-2 border-[#18181b] dark:border-amber-500/40 shadow-[2px_2px_0px_#18181b] dark:shadow-[2px_2px_0px_#000000]">
                    <div className="flex items-center gap-1 text-[9px] font-mono font-black text-[#18181b] dark:text-amber-300 mb-0.5">
                      <Receipt className="w-3 h-3" />
                      <span>{isEn ? 'BILLS' : 'HÓA ĐƠN'}</span>
                    </div>
                    <div className="text-sm sm:text-base font-black text-[#18181b] dark:text-amber-100">
                      {expenses.length} {isEn ? 'EXPENSES' : 'KHOẢN CHI'}
                    </div>
                  </div>

                  <div className="p-2 sm:p-2.5 rounded-xl bg-[#fed7aa] dark:bg-[#2e2118] border-2 border-[#18181b] dark:border-orange-500/40 shadow-[2px_2px_0px_#18181b] dark:shadow-[2px_2px_0px_#000000]">
                    <div className="flex items-center gap-1 text-[9px] font-mono font-black text-[#18181b] dark:text-orange-300 mb-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>{isEn ? 'JOURNEY' : 'HÀNH TRÌNH'}</span>
                    </div>
                    <div className="text-sm sm:text-base font-black text-[#18181b] dark:text-orange-100">
                      {totalDays} {isEn ? 'DAYS TOGETHER' : 'NGÀY ĐỒNG HÀNH'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 1: TOP PAYER (👑 CHỦ TỊCH GÁNH TEAM) */}
            {currentSlide === 1 && (
              <div className="space-y-3 animate-fade-in my-auto text-center pt-1">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#ff5400] text-white border-2 border-[#18181b] dark:border-black shadow-[1.5px_1.5px_0px_#18181b] text-[11px] font-black uppercase tracking-wider">
                  <Crown className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{isEn ? 'TOP SPENDER MVP 👑' : 'CHỦ TỊCH GÁNH TEAM 👑'}</span>
                </div>

                <div className="relative inline-block mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#252532] border-2 border-[#18181b] dark:border-zinc-700 shadow-[2px_2px_0px_#18181b] p-0.5 overflow-hidden">
                    <img
                      src={topPayer.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${topPayer.userId || topPayer.uid || topPayer.id}`}
                      alt=""
                      className="w-full h-full rounded-xl object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md bg-[#fef08a] dark:bg-amber-400 border border-[#18181b] text-[8px] font-black text-[#18181b] shadow-[1px_1px_0px_#18181b]">
                    #1 MVP
                  </div>
                </div>

                <div className="space-y-0.5">
                  <h3 className="text-lg sm:text-xl font-black text-[#18181b] dark:text-white uppercase truncate">
                    {topPayer.displayName}
                  </h3>
                  <p className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 font-mono">
                    {isEn ? 'MOST GENEROUS SPENDER OF THE TRIP' : 'NGƯỜI CHỊU CHI BẠO TAY NHẤT CHUYẾN ĐI'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white dark:bg-[#252532] border-2 border-[#18181b] dark:border-zinc-700 shadow-[2px_2px_0px_#18181b] text-left space-y-0.5">
                  <div className="text-[9px] font-mono font-black uppercase text-zinc-500 dark:text-zinc-400">
                    {isEn ? 'TOTAL PAID UPFRONT:' : 'SỐ TIỀN ĐÃ ỨNG TRƯỚC:'}
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-[#ff5400] font-mono">
                    {formatVND(topPayer.totalPaid)}
                  </div>
                  <p className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 pt-0.5 border-t border-dashed border-[#18181b]/20 dark:border-white/15">
                    {isEn ? 'Represents' : 'Chiếm tới'} <strong className="text-[#18181b] dark:text-white">{topPayerPercent}%</strong> {isEn ? 'of total trip expenses.' : 'toàn bộ chi phí cả đoàn.'}
                  </p>
                </div>
              </div>
            )}

            {/* SLIDE 2: TOP EXPENSE (🥩 KHOẢN CHI KỶ LỤC) */}
            {currentSlide === 2 && (
              <div className="space-y-3 animate-fade-in my-auto pt-1">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] text-[11px] font-black uppercase tracking-wider">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-[#ff5400] stroke-[2.5]" />
                  <span>{isEn ? 'MOST EXPENSIVE BILL 🥩' : 'KHOẢN CHI ĐẮT ĐỎ NHẤT 🥩'}</span>
                </div>

                {topExpense ? (
                  <div className="space-y-2">
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#252532] border-2 border-[#18181b] dark:border-zinc-700 shadow-[2px_2px_0px_#18181b] space-y-1">
                      <span className="text-[8px] font-mono font-black uppercase text-zinc-500 dark:text-zinc-400">
                        {isEn ? 'RECORD BILL OF THE TRIP' : 'BILL KỶ LỤC CỦA CHUYẾN ĐI'}
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-[#18181b] dark:text-white uppercase truncate">
                        "{topExpense.title}"
                      </h3>
                      <div className="text-xl sm:text-2xl font-black text-[#ff5400] font-mono">
                        {formatVND(topExpense.amount)}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#fef08a] dark:bg-[#2d2919] border-2 border-[#18181b] dark:border-amber-500/40 shadow-[2px_2px_0px_#18181b] text-[11px] space-y-1 font-bold">
                      <div className="flex items-center justify-between text-[#18181b] dark:text-amber-100">
                        <span>{isEn ? 'Paid by:' : 'Người chi trả:'}</span>
                        <strong className="font-black truncate max-w-[140px]">{topExpensePayer?.displayName || (isEn ? 'Member' : 'Thành viên')}</strong>
                      </div>
                      <div className="flex items-center justify-between text-zinc-700 dark:text-amber-200/80">
                        <span>{isEn ? 'Date logged:' : 'Ngày ghi nhận:'}</span>
                        <span className="font-mono">{topExpense.date || (isEn ? 'During trip' : 'Trong chuyến đi')}</span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-700 dark:text-amber-200/80">
                        <span>{isEn ? 'Split between:' : 'Số người chia bill:'}</span>
                        <span>{topExpense.participants?.length || members.length} {isEn ? 'members' : 'thành viên'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center bg-white dark:bg-[#252532] rounded-2xl border-2 border-[#18181b] dark:border-zinc-700 font-bold text-xs text-zinc-500 dark:text-zinc-400">
                    {isEn ? 'No expenses recorded in this trip yet.' : 'Chưa có khoản chi nào được ghi nhận trong chuyến đi này.'}
                  </div>
                )}
              </div>
            )}

            {/* SLIDE 3: TEAM SPIRIT & FAST SETTLEMENT (⚡ SÒNG PHẲNG 100%) */}
            {currentSlide === 3 && (
              <div className="space-y-3 animate-fade-in my-auto text-center pt-1">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#ff5400] text-white border-2 border-[#18181b] dark:border-black shadow-[1.5px_1.5px_0px_#18181b] text-[11px] font-black uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{isEn ? 'LIGHTNING-FAST SETTLEMENT ⚡' : 'SÒNG PHẲNG THẦN TỐC ⚡'}</span>
                </div>

                <div className="space-y-0.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#18181b] dark:bg-[#252532] text-[#ff5400] border-2 border-[#18181b] dark:border-zinc-700 shadow-[2px_2px_0px_#18181b] flex items-center justify-center mx-auto mb-1">
                    <Sparkles className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-[#18181b] dark:text-white uppercase tracking-tight">
                    {isEn ? 'PLAY FAIR • SPLIT EVEN' : 'CHƠI ĐẸP • CHIA ĐỀU • TRỌN TÌNH BẠN'}
                  </h3>
                  <p className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 font-mono">
                    {isEn ? '100% RECONCILED TRANSPARENTLY' : '100% CÔNG NỢ ĐÃ TẤT TOÁN MINH BẠCH'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white dark:bg-[#252532] border-2 border-[#18181b] dark:border-zinc-700 shadow-[2px_2px_0px_#18181b] text-left space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-black text-[#18181b] dark:text-white">
                    <span>{isEn ? 'RECONCILIATION PROGRESS:' : 'TIẾN ĐỘ ĐỐI SOÁT:'}</span>
                    <span className="text-[#ff5400] font-mono">{isEn ? '100% COMPLETE' : '100% HOÀN TẤT'}</span>
                  </div>
                  <div className="w-full bg-[#edebe4] dark:bg-[#1a1a24] h-2 rounded-md border border-[#18181b] dark:border-zinc-600 overflow-hidden">
                    <div className="bg-[#ff5400] h-full w-full" />
                  </div>
                  <p className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 pt-0.5 border-t border-dashed border-[#18181b]/20 dark:border-white/15">
                    ⚡ {isEn ? 'Fastest payer:' : 'Thành viên thanh toán thần tốc:'} <strong className="text-[#18181b] dark:text-white font-black">{fastestSettler?.displayName || (isEn ? 'Whole crew' : 'Cả nhóm')}</strong>!
                  </p>
                </div>
              </div>
            )}

            {/* SLIDE 4: FULL RETRO SHAREABLE TICKET CARD (Clean, no duplicate buttons!) */}
            {currentSlide === 4 && (
              <div className="space-y-2.5 animate-fade-in my-auto pt-1">
                <div className="flex items-center justify-between border-b-2 border-[#18181b] dark:border-zinc-700 pb-1">
                  <div>
                    <span className="px-1.5 py-0.2 rounded bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] text-[8px] font-mono font-bold uppercase">
                      SPLIQO TICKET
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-[#18181b] dark:text-white uppercase truncate max-w-[180px]">
                      {trip.name}
                    </h3>
                  </div>
                  <span className="text-[9px] font-mono font-black text-zinc-600 dark:text-zinc-400">
                    {trip.startDate}
                  </span>
                </div>

                {/* Ticket Breakdown Card */}
                <div className="p-3 rounded-2xl bg-white dark:bg-[#252532] border-2 border-[#18181b] dark:border-zinc-700 shadow-[2px_2px_0px_#18181b] space-y-1 text-[11px]">
                  <div className="flex items-center justify-between pb-0.5 border-b border-dashed border-[#18181b]/20 dark:border-white/15 font-bold">
                    <span className="text-zinc-600 dark:text-zinc-400">{isEn ? 'Total spent:' : 'Tổng chi:'}</span>
                    <strong className="text-[#ff5400] font-mono font-black text-xs sm:text-sm">
                      {formatVND(totalExpense)}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between font-bold">
                    <span className="text-zinc-600 dark:text-zinc-400">{isEn ? '👑 Top spender:' : '👑 Chi bạo nhất:'}</span>
                    <strong className="text-[#18181b] dark:text-white font-black truncate max-w-[130px]">{topPayer.displayName} ({formatVND(topPayer.totalPaid)})</strong>
                  </div>

                  <div className="flex items-center justify-between font-bold">
                    <span className="text-zinc-600 dark:text-zinc-400">{isEn ? '🥩 Biggest bill:' : '🥩 Bill đắt nhất:'}</span>
                    <strong className="text-[#18181b] dark:text-white font-black truncate max-w-[130px]">
                      {topExpense ? `${topExpense.title}` : (isEn ? 'None' : 'Chưa có')}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between font-bold">
                    <span className="text-zinc-600 dark:text-zinc-400">{isEn ? '⚡ Settlement:' : '⚡ Đối soát:'}</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-black">{isEn ? '100% Fair & Settled' : '100% Sòng phẳng'}</strong>
                  </div>
                </div>

                {/* Retro Stamp of Authenticity */}
                <div className="p-2 rounded-xl bg-[#fef08a] dark:bg-[#2d2919] border-2 border-[#18181b] dark:border-amber-500/40 shadow-[1.5px_1.5px_0px_#18181b] flex items-center justify-between text-[11px] font-bold">
                  <span className="flex items-center gap-1.5 text-[#18181b] dark:text-amber-100 text-[10px]">
                    <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>{isEn ? 'SPLIQO CERTIFIED ADVENTURE' : 'CHỨNG NHẬN SÒNG PHẲNG SPLIQO'}</span>
                  </span>
                  <span className="font-mono font-black text-[#ff5400] text-xs">10/10 ★</span>
                </div>
              </div>
            )}

            {/* Bottom Neo-Retro Barcode & Step footer (Always visible, never cut off!) */}
            <div className="flex items-center justify-between text-[9px] font-mono font-bold text-zinc-600 dark:text-zinc-400 pt-2 border-t-2 border-[#18181b]/20 dark:border-white/20">
              <span className="tracking-widest">||| | |||| | |||</span>
              <span 
                onClick={handleNext}
                className="font-black text-[#ff5400] hover:underline cursor-pointer flex items-center gap-1"
              >
                {currentSlide < totalSlides - 1 ? (
                  <>
                    <span>{isEn ? 'NEXT' : 'TIẾP THEO'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </>
                ) : (
                  <span>{isEn ? 'FINISH ★' : 'KẾT THÚC ★'}</span>
                )}
              </span>
            </div>
          </div>
        </div>
      </Modal>

      {/* iOS & Mobile Fallback Image Preview Modal */}
      {previewImage && (
        <Modal
          isOpen={!!previewImage}
          onClose={() => setPreviewImage(null)}
          title={
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#18181b] dark:text-white">
                {isEn ? 'Save Wrapped Photo 📸' : 'Lưu ảnh Wrapped 📸'}
              </span>
            </div>
          }
          maxWidth="max-w-md"
          footer={
            <div className="flex items-center justify-between w-full gap-2">
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="tactile-btn-pill px-4 py-2 text-xs font-bold cursor-pointer"
              >
                {isEn ? 'Close' : 'Đóng'}
              </button>
              {navigator.share && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const arr = previewImage.split(',');
                      const mime = arr[0].match(/:(.*?);/)[1];
                      const bstr = atob(arr[1]);
                      let n = bstr.length;
                      const u8arr = new Uint8Array(n);
                      while (n--) {
                        u8arr[n] = bstr.charCodeAt(n);
                      }
                      const blob = new Blob([u8arr], { type: mime });
                      const file = new File([blob], `Spliqo_Wrapped_${trip.name.replace(/\s+/g, '_')}_Trang${currentSlide + 1}.png`, { type: 'image/png' });
                      if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({
                          files: [file],
                          title: `Spliqo Wrapped - ${trip.name}`
                        });
                      }
                    } catch (err) {
                      if (err.name !== 'AbortError') console.warn(err);
                    }
                  }}
                  className="tactile-btn-dark px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>{isEn ? 'Share / Save Photo' : 'Chia sẻ / Lưu ảnh'}</span>
                </button>
              )}
            </div>
          }
        >
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200">
              <p className="font-bold flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300">
                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                {isEn ? 'How to save photo on iPhone:' : 'Hướng dẫn lưu ảnh trên iPhone:'}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-amber-950 dark:text-amber-100">
                {isEn 
                  ? <>Press and hold the image below for <strong>1 second</strong>, then select <strong>"Save to Photos"</strong> to download.</>
                  : <>Nhấn giữ vào ảnh bên dưới trong <strong>1 giây</strong>, sau đó chọn <strong>"Lưu vào Ảnh" (Save to Photos)</strong> để tải về máy.</>}
              </p>
            </div>

            <div className="max-h-[60vh] overflow-y-auto rounded-2xl border-2 border-[#18181b] dark:border-zinc-700 shadow-md flex justify-center bg-zinc-100 dark:bg-zinc-900 p-2">
              <img
                src={previewImage}
                alt="Spliqo Wrapped"
                className="w-full h-auto object-contain rounded-xl select-auto"
                style={{ WebkitTouchCallout: 'default' }}
              />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
