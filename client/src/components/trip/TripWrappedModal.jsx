import React, { useState, useRef } from 'react';
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
  Users, 
  Receipt,
  Ticket,
  Flame,
  Award,
  ArrowRight
} from 'lucide-react';
import { formatVND } from '../../services/calculation';
import confetti from 'canvas-confetti';
import { useTheme } from '../../contexts/ThemeContext';

export default function TripWrappedModal({
  isOpen,
  onClose,
  trip,
  expenses = [],
  members = [],
  balances,
  settlements = [],
  t
}) {
  const { isDark } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const cardRef = useRef(null);

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

  const totalSlides = 5;

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

  // Copy text recap to clipboard with retro style formatting
  const handleCopyRecap = async () => {
    const text = `┌──────────────────────────────────┐
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
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Export Neo-Retro Brutalism Canvas (Cream / Orange / Black)
  const handleDownloadImage = async () => {
    setExporting(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');

      // Theme-adaptive poster color scheme
      const isDarkPoster = isDark;
      const bgPaper = isDarkPoster ? '#16161f' : '#fbf9f3';
      const cardFill = isDarkPoster ? '#22222e' : '#ffffff';
      const textPrimary = isDarkPoster ? '#ffffff' : '#18181b';
      const textMuted = isDarkPoster ? '#a1a1aa' : '#71717a';
      const borderStroke = isDarkPoster ? '#ffffff' : '#18181b';
      const shadowColor = isDarkPoster ? '#000000' : '#18181b';
      const dotColor = isDarkPoster ? 'rgba(255, 255, 255, 0.08)' : 'rgba(24, 24, 27, 0.04)';
      const yellowCardBg = isDarkPoster ? '#2d2919' : '#fef08a';
      const peachCardBg = isDarkPoster ? '#2e2118' : '#fed7aa';
      const yellowCardText = isDarkPoster ? '#fef08a' : '#18181b';
      const peachCardText = isDarkPoster ? '#fed7aa' : '#18181b';

      // 1. Background Paper
      ctx.fillStyle = bgPaper;
      ctx.fillRect(0, 0, 1080, 1920);

      // 2. Retro Dot-Matrix Halftone Texture
      ctx.fillStyle = dotColor;
      for (let x = 30; x < 1080; x += 36) {
        for (let y = 30; y < 1920; y += 36) {
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, 2 * Math.PI);
          ctx.fill();
        }
      }

      // 3. Thick Brutalist Outer Frame
      ctx.lineWidth = 6;
      ctx.strokeStyle = borderStroke;
      ctx.strokeRect(40, 40, 1000, 1840);

      // Inner thin frame line
      ctx.lineWidth = 2;
      ctx.strokeStyle = borderStroke;
      ctx.strokeRect(52, 52, 976, 1816);

      // Helper function for Brutalist Neomorphic Drop-Shadow Cards
      const drawBrutalistCard = (x, y, w, h, fill = cardFill, shadowOffset = 12) => {
        // Hard Drop Shadow
        ctx.fillStyle = shadowColor;
        ctx.fillRect(x + shadowOffset, y + shadowOffset, w, h);
        // Main Card Body
        ctx.fillStyle = fill;
        ctx.fillRect(x, y, w, h);
        // Border
        ctx.lineWidth = 5;
        ctx.strokeStyle = borderStroke;
        ctx.strokeRect(x, y, w, h);
      };

      // 4. Top Retro Header Ribbon
      drawBrutalistCard(80, 90, 920, 110, '#ff5400', 8);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 42px sans-serif';
      ctx.fillText('★ SPLIQO WRAPPED • RECAP 2026 ★', 120, 162);
      ctx.fillStyle = '#18181b';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('#EXP-DOC', 960, 155);
      ctx.textAlign = 'left';

      // 5. Trip Name Headline
      ctx.fillStyle = textPrimary;
      ctx.font = '900 68px sans-serif';
      const truncatedName = trip.name.length > 20 ? trip.name.substring(0, 18) + '...' : trip.name;
      ctx.fillText(truncatedName.toUpperCase(), 80, 275);

      ctx.fillStyle = textMuted;
      ctx.font = 'bold 28px monospace';
      ctx.fillText(`KỲ NGHỈ ${totalDays} NGÀY • ${members.length} THÀNH VIÊN • ${expenses.length} HÓA ĐƠN`, 80, 325);

      // 6. Giant Main Metric Card (Total Spent)
      drawBrutalistCard(80, 370, 920, 270, cardFill, 14);
      
      // Orange Accent corner tag
      ctx.fillStyle = isDarkPoster ? '#ff5400' : '#18181b';
      ctx.fillRect(80, 370, 380, 50);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('● TỔNG CHI PHÍ CHUYẾN ĐI', 105, 404);

      ctx.fillStyle = '#ff5400';
      ctx.font = '900 102px monospace';
      ctx.fillText(formatVND(totalExpense), 115, 535);

      ctx.fillStyle = textMuted;
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText(`Bình quân mỗi người: ${formatVND(avgPerPerson)}`, 115, 595);

      // 7. Grid of 2 Mini Cards (Duration & Number of Bills)
      drawBrutalistCard(80, 675, 440, 170, yellowCardBg, 10);
      ctx.fillStyle = yellowCardText;
      ctx.font = 'bold 24px monospace';
      ctx.fillText('✦ THỜI GIAN', 110, 725);
      ctx.font = '900 52px sans-serif';
      ctx.fillText(`${totalDays} NGÀY`, 110, 795);

      drawBrutalistCard(560, 675, 440, 170, peachCardBg, 10);
      ctx.fillStyle = peachCardText;
      ctx.font = 'bold 24px monospace';
      ctx.fillText('✦ TỔNG SỐ BILL', 590, 725);
      ctx.font = '900 52px sans-serif';
      ctx.fillText(`${expenses.length} BILL`, 590, 795);

      // 8. Card 1: Top Payer (👑 Đại gia chuyến đi)
      drawBrutalistCard(80, 885, 920, 260, cardFill, 14);
      
      // Top orange tag
      ctx.fillStyle = '#ff5400';
      ctx.fillRect(80, 885, 420, 48);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 22px sans-serif';
      ctx.fillText('👑 ĐẠI GIA GÁNH TEAM TOÀN ĐOÀN', 105, 918);

      ctx.fillStyle = textPrimary;
      ctx.font = '900 56px sans-serif';
      ctx.fillText(topPayer.displayName.toUpperCase(), 115, 995);

      ctx.fillStyle = '#ff5400';
      ctx.font = '900 46px monospace';
      ctx.fillText(`ĐÃ CHI: ${formatVND(topPayer.totalPaid)}`, 115, 1060);

      ctx.fillStyle = textMuted;
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(`Gánh ${topPayerPercent}% toàn bộ ngân sách chuyến đi.`, 115, 1105);

      // 9. Card 2: Top Expense (🥩 Món ăn / Bill kỷ lục)
      if (topExpense) {
        drawBrutalistCard(80, 1185, 920, 240, cardFill, 14);
        
        ctx.fillStyle = isDarkPoster ? '#ff5400' : '#18181b';
        ctx.fillRect(80, 1185, 390, 48);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 22px sans-serif';
        ctx.fillText('🥩 KHOẢN CHI KỶ LỤC NHẤT', 105, 1218);

        ctx.fillStyle = textPrimary;
        ctx.font = '900 48px sans-serif';
        const expTrunc = topExpense.title.length > 24 ? topExpense.title.substring(0, 22) + '...' : topExpense.title;
        ctx.fillText(`"${expTrunc.toUpperCase()}"`, 115, 1290);

        ctx.fillStyle = '#ff5400';
        ctx.font = '900 46px monospace';
        ctx.fillText(formatVND(topExpense.amount), 115, 1355);

        ctx.fillStyle = textMuted;
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText(`Người thanh toán: ${topExpensePayer?.displayName || 'Thành viên'}`, 115, 1395);
      }

      // 10. Card 3: 100% Sòng phẳng Stamp & Barcode
      drawBrutalistCard(80, 1465, 920, 220, '#ff5400', 14);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 36px sans-serif';
      ctx.fillText('⚡ TINH THẦN SÒNG PHẲNG: 100% HOÀN TẤT', 120, 1530);
      
      ctx.fillStyle = isDarkPoster ? '#ffffff' : '#18181b';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('Mọi khoản nợ được cân bằng đối soát chuẩn từng đồng qua VietQR!', 120, 1585);
      ctx.fillText(`Thành viên thanh toán nhanh như chớp: ${fastestSettler?.displayName || 'Cả nhóm'}`, 120, 1630);

      // 11. Bottom Ticket Barcode & Footer
      ctx.fillStyle = textPrimary;
      // Draw pseudo barcode
      const barcodeX = 80;
      const barcodeY = 1730;
      const barPattern = [4, 2, 8, 3, 2, 6, 4, 3, 7, 2, 4, 8, 3, 2, 5, 4, 2, 7, 3, 8, 2, 4, 6, 3, 2, 8, 5, 3, 2, 7];
      let currentX = barcodeX;
      for (const width of barPattern) {
        ctx.fillRect(currentX, barcodeY, width, 55);
        currentX += width + 6;
      }
      ctx.font = 'bold 22px monospace';
      ctx.fillText('* SPLIQO-EXPENSE-SHARING-2026 *', barcodeX, 1815);

      ctx.textAlign = 'right';
      ctx.font = 'bold 26px monospace';
      ctx.fillText('SPLIQO.APP • SMART GROUP EXPENSE', 1000, 1770);
      ctx.fillText('QUÉT MÃ & CHIA TIỀN TỨC THÌ', 1000, 1805);
      ctx.textAlign = 'left';

      // Convert canvas to image
      const dataUrl = canvas.toDataURL('image/png');
      const filename = `Spliqo_RetroWrapped_${trip.name.replace(/\s+/g, '_')}.png`;

      // Helper: convert dataURL to Blob
      const dataURLtoBlob = (data) => {
        const arr = data.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
      };

      const blob = dataURLtoBlob(dataUrl);
      const file = new File([blob], filename, { type: 'image/png' });

      // Detect iOS (iPhone / iPad / iPod)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

      // 1. Try Native Web Share API first (Native iOS Action Sheet with "Lưu hình ảnh" / Save Image)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `Spliqo Wrapped - ${trip.name}`,
            text: `Ký ức tài chính chuyến đi ${trip.name} trên Spliqo!`
          });
          return;
        } catch (shareErr) {
          if (shareErr.name === 'AbortError') {
            return; // User dismissed share sheet
          }
          console.warn('[Wrapped] navigator.share error:', shareErr);
        }
      }

      // 2. If on iOS (or if Web Share failed/unavailable), open the touch-and-hold Preview Modal
      if (isIOS) {
        setPreviewImage(dataUrl);
      } else {
        // Desktop / Android: Standard direct file download via blob URL
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = blobUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
      }
    } catch (err) {
      console.error('Export error:', err);
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
          <span className="px-2.5 py-0.5 rounded-md bg-[#ff5400] text-white font-black text-xs tracking-wider uppercase">
            NEO-RETRO
          </span>
          <span className="font-extrabold text-[#18181b] dark:text-white">
            Spliqo Wrapped 📊
          </span>
        </div>
      }
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center justify-between w-full">
          {/* Navigation Controls */}
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
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
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
            >
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyRecap}
              className="px-3 py-1.5 rounded-xl border-2 border-[#18181b] dark:border-zinc-700 bg-white dark:bg-[#252530] text-[#18181b] dark:text-white font-bold text-xs flex items-center gap-1.5 shadow-[2px_2px_0px_#18181b] dark:shadow-[2px_2px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
              title="Sao chép tóm tắt định dạng Retro"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã copy!' : 'Copy recap'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={exporting}
              className="px-3.5 py-1.5 rounded-xl border-2 border-[#18181b] dark:border-zinc-700 bg-[#ff5400] hover:bg-[#ea580c] text-white font-black text-xs flex items-center gap-1.5 shadow-[3px_3px_0px_#18181b] dark:shadow-[3px_3px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
              title="Tải ảnh Story Neo-Retro cực nét"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{exporting ? 'Đang tạo...' : 'Lưu ảnh Story'}</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Chunky Brutalist Story Progress Bar */}
        <div className="flex items-center gap-2 w-full">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <div
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className="h-2 flex-1 rounded-md cursor-pointer overflow-hidden border border-[#18181b] dark:border-zinc-700 bg-[#edebe4] dark:bg-zinc-800 transition-all"
            >
              <div
                className={`h-full transition-all duration-300 ${
                  idx <= currentSlide ? 'bg-[#ff5400]' : 'bg-transparent'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Neo-Retro Brutalist Slide Container */}
        <div 
          ref={cardRef}
          className="relative min-h-[440px] rounded-3xl p-6 sm:p-7 flex flex-col justify-between overflow-hidden border-[3px] border-[#18181b] dark:border-zinc-700 shadow-[6px_6px_0px_#18181b] dark:shadow-[6px_6px_0px_rgba(0,0,0,0.8)] bg-[#fbf9f3] dark:bg-[#1a1a24] text-[#18181b] dark:text-[#f4f4f5] select-none transition-all duration-300"
          style={{
            backgroundImage: isDark 
              ? 'radial-gradient(rgba(255, 255, 255, 0.12) 1.5px, transparent 1.5px)' 
              : 'radial-gradient(rgba(24, 24, 27, 0.18) 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px'
          }}
        >
          {/* Top Tape Sticker */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-5 py-1 bg-[#ff5400] border-2 border-[#18181b] dark:border-black shadow-[2px_2px_0px_#18181b] dark:shadow-[2px_2px_0px_#000000] text-white text-[11px] font-black uppercase tracking-widest rotate-[-1deg]">
            ★ SPLIQO VINTAGE TICKET ★
          </div>

          {/* SLIDE 0: RETRO INTRO & BIG METRICS */}
          {currentSlide === 0 && (
            <div className="space-y-5 animate-fade-in my-auto pt-2">
              <div className="space-y-1">
                <div className="inline-block px-2.5 py-0.5 rounded-md bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] text-[10px] font-mono font-bold tracking-widest uppercase">
                  FINANCIAL OVERVIEW • #{trip.tripCode || 'SPLIQO'}
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#18181b] dark:text-white tracking-tight uppercase">
                  {trip.name}
                </h2>
                <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400 font-mono">
                  {totalDays} NGÀY KHÁM PHÁ • {members.length} THÀNH VIÊN
                </p>
              </div>

              {/* Big Brutalist Number Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#252532] border-2 border-[#18181b] dark:border-zinc-700 shadow-[4px_4px_0px_#18181b] dark:shadow-[4px_4px_0px_#000000] space-y-1.5">
                <span className="text-[11px] font-mono font-black uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">
                  TỔNG CHI PHÍ TOÀN BỘ CHUYẾN ĐI
                </span>
                <div className="text-3xl sm:text-4xl font-black text-[#ff5400] font-mono tracking-tight">
                  {formatVND(totalExpense)}
                </div>
                <div className="pt-2 border-t-2 border-dashed border-[#18181b]/20 dark:border-white/15 flex items-center justify-between text-xs font-bold">
                  <span className="text-zinc-600 dark:text-zinc-400">Định mức bình quân:</span>
                  <span className="font-mono text-[#18181b] dark:text-white font-black">{formatVND(avgPerPerson)}/người</span>
                </div>
              </div>

              {/* Mini Stat Cards */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#fef08a] dark:bg-[#2d2919] border-2 border-[#18181b] dark:border-amber-500/40 shadow-[3px_3px_0px_#18181b] dark:shadow-[3px_3px_0px_#000000]">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-black text-[#18181b] dark:text-amber-300 mb-1">
                    <Receipt className="w-3.5 h-3.5" />
                    <span>HÓA ĐƠN</span>
                  </div>
                  <div className="text-lg font-black text-[#18181b] dark:text-amber-100">
                    {expenses.length} KHOẢN CHI
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#fed7aa] dark:bg-[#2e2118] border-2 border-[#18181b] dark:border-orange-500/40 shadow-[3px_3px_0px_#18181b] dark:shadow-[3px_3px_0px_#000000]">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-black text-[#18181b] dark:text-orange-300 mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>HÀNH TRÌNH</span>
                  </div>
                  <div className="text-lg font-black text-[#18181b] dark:text-orange-100">
                    {totalDays} NGÀY ĐỒNG HÀNH
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 1: TOP PAYER (👑 ĐẠI GIA CHI TIÊU BẠO NHẤT) */}
          {currentSlide === 1 && (
            <div className="space-y-5 animate-fade-in my-auto text-center pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#ff5400] text-white border-2 border-[#18181b] dark:border-black shadow-[2px_2px_0px_#18181b] dark:shadow-[2px_2px_0px_#000000] text-xs font-black uppercase tracking-wider">
                <Crown className="w-4 h-4 stroke-[2.5]" />
                <span>CHỦ TỊCH GÁNH TEAM 👑</span>
              </div>

              <div className="relative inline-block mx-auto">
                <div className="w-24 h-24 rounded-2xl bg-white dark:bg-[#252532] border-3 border-[#18181b] dark:border-zinc-700 shadow-[4px_4px_0px_#18181b] dark:shadow-[4px_4px_0px_#000000] p-1 overflow-hidden">
                  <img
                    src={topPayer.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${topPayer.userId || topPayer.uid || topPayer.id}`}
                    alt=""
                    className="w-full h-full rounded-xl object-cover"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md bg-[#fef08a] dark:bg-amber-400 border-2 border-[#18181b] text-[10px] font-black text-[#18181b] shadow-[2px_2px_0px_#18181b] dark:shadow-[2px_2px_0px_#000000]">
                  #1 MVP
                </div>
              </div>

              <div className="space-y-0.5">
                <h3 className="text-2xl font-black text-[#18181b] dark:text-white uppercase">
                  {topPayer.displayName}
                </h3>
                <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400 font-mono">
                  NGƯỜI CHỊU CHI BẠO TAY NHẤT CHUYẾN ĐI
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#252532] border-2 border-[#18181b] dark:border-zinc-700 shadow-[4px_4px_0px_#18181b] dark:shadow-[4px_4px_0px_#000000] text-left space-y-1">
                <div className="text-[10px] font-mono font-black uppercase text-zinc-500 dark:text-zinc-400">
                  SỐ TIỀN ĐÃ ỨNG TRƯỚC:
                </div>
                <div className="text-2xl sm:text-3xl font-black text-[#ff5400] font-mono">
                  {formatVND(topPayer.totalPaid)}
                </div>
                <p className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 pt-1 border-t border-dashed border-[#18181b]/20 dark:border-white/15">
                  Chiếm tới <strong className="text-[#18181b] dark:text-white">{topPayerPercent}%</strong> toàn bộ chi phí cả đoàn.
                </p>
              </div>
            </div>
          )}

          {/* SLIDE 2: TOP EXPENSE (🥩 KHOẢN CHI KỶ LỤC) */}
          {currentSlide === 2 && (
            <div className="space-y-5 animate-fade-in my-auto pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] text-xs font-black uppercase tracking-wider">
                <UtensilsCrossed className="w-4 h-4 text-[#ff5400] stroke-[2.5]" />
                <span>KHOẢN CHI ĐẮT ĐỎ NHẤT 🥩</span>
              </div>

              {topExpense ? (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#252532] border-2 border-[#18181b] dark:border-zinc-700 shadow-[4px_4px_0px_#18181b] dark:shadow-[4px_4px_0px_#000000] space-y-2">
                    <span className="text-[10px] font-mono font-black uppercase text-zinc-500 dark:text-zinc-400">
                      BILL KỶ LỤC CỦA CHUYẾN ĐI
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-[#18181b] dark:text-white uppercase">
                      "{topExpense.title}"
                    </h3>
                    <div className="text-3xl font-black text-[#ff5400] font-mono">
                      {formatVND(topExpense.amount)}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#fef08a] dark:bg-[#2d2919] border-2 border-[#18181b] dark:border-amber-500/40 shadow-[3px_3px_0px_#18181b] dark:shadow-[3px_3px_0px_#000000] text-xs space-y-1 font-bold">
                    <div className="flex items-center justify-between text-[#18181b] dark:text-amber-100">
                      <span>Người chi trả:</span>
                      <strong className="font-black">{topExpensePayer?.displayName || 'Thành viên'}</strong>
                    </div>
                    <div className="flex items-center justify-between text-zinc-700 dark:text-amber-200/80">
                      <span>Ngày ghi nhận:</span>
                      <span className="font-mono">{topExpense.date || 'Trong chuyến đi'}</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-700 dark:text-amber-200/80">
                      <span>Số người chia bill:</span>
                      <span>{topExpense.participants?.length || members.length} thành viên</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-white dark:bg-[#252532] rounded-2xl border-2 border-[#18181b] dark:border-zinc-700 font-bold text-xs text-zinc-500 dark:text-zinc-400">
                  Chưa có khoản chi nào được ghi nhận trong chuyến đi này.
                </div>
              )}
            </div>
          )}

          {/* SLIDE 3: TEAM SPIRIT & FAST SETTLEMENT (⚡ SÒNG PHẲNG 100%) */}
          {currentSlide === 3 && (
            <div className="space-y-5 animate-fade-in my-auto text-center pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#ff5400] text-white border-2 border-[#18181b] dark:border-black shadow-[2px_2px_0px_#18181b] dark:shadow-[2px_2px_0px_#000000] text-xs font-black uppercase tracking-wider">
                <Zap className="w-4 h-4 stroke-[2.5]" />
                <span>SÒNG PHẲNG THẦN TỐC ⚡</span>
              </div>

              <div className="space-y-1">
                <div className="w-16 h-16 rounded-2xl bg-[#18181b] dark:bg-[#252532] text-[#ff5400] border-2 border-[#18181b] dark:border-zinc-700 shadow-[4px_4px_0px_#18181b] dark:shadow-[4px_4px_0px_#000000] flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 stroke-[2.5]" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[#18181b] dark:text-white uppercase tracking-tight">
                  CHƠI ĐẸP • CHIA ĐỀU • TRỌN TÌNH BẠN
                </h3>
                <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400 font-mono">
                  100% CÔNG NỢ ĐÃ TẤT TOÁN MINH BẠCH
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#252532] border-2 border-[#18181b] dark:border-zinc-700 shadow-[4px_4px_0px_#18181b] dark:shadow-[4px_4px_0px_#000000] text-left space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-[#18181b] dark:text-white">
                  <span>TIẾN ĐỘ ĐỐI SOÁT:</span>
                  <span className="text-[#ff5400] font-mono">100% HOÀN TẤT</span>
                </div>
                <div className="w-full bg-[#edebe4] dark:bg-[#1a1a24] h-3 rounded-md border border-[#18181b] dark:border-zinc-600 overflow-hidden">
                  <div className="bg-[#ff5400] h-full w-full" />
                </div>
                <p className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 pt-1 border-t border-dashed border-[#18181b]/20 dark:border-white/15">
                  ⚡ Thành viên thanh toán thần tốc: <strong className="text-[#18181b] dark:text-white font-black">{fastestSettler?.displayName || 'Cả nhóm'}</strong>!
                </p>
              </div>
            </div>
          )}

          {/* SLIDE 4: FULL RETRO SHAREABLE TICKET CARD */}
          {currentSlide === 4 && (
            <div className="space-y-4 animate-fade-in my-auto pt-2">
              <div className="flex items-center justify-between border-b-2 border-[#18181b] dark:border-zinc-700 pb-2">
                <div>
                  <span className="px-2 py-0.5 rounded bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] text-[9px] font-mono font-bold uppercase">
                    SPLIQO TICKET
                  </span>
                  <h3 className="text-lg font-black text-[#18181b] dark:text-white uppercase truncate max-w-[200px]">
                    {trip.name}
                  </h3>
                </div>
                <span className="text-[11px] font-mono font-black text-zinc-600 dark:text-zinc-400">
                  {trip.startDate}
                </span>
              </div>

              {/* Ticket Breakdown Card */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#252532] border-2 border-[#18181b] dark:border-zinc-700 shadow-[3px_3px_0px_#18181b] dark:shadow-[3px_3px_0px_#000000] space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-dashed border-[#18181b]/20 dark:border-white/15 font-bold">
                  <span className="text-zinc-600 dark:text-zinc-400">Tổng chi:</span>
                  <strong className="text-[#ff5400] font-mono font-black text-sm">
                    {formatVND(totalExpense)}
                  </strong>
                </div>

                <div className="flex items-center justify-between font-bold">
                  <span className="text-zinc-600 dark:text-zinc-400">👑 Chi bạo nhất:</span>
                  <strong className="text-[#18181b] dark:text-white font-black">{topPayer.displayName} ({formatVND(topPayer.totalPaid)})</strong>
                </div>

                <div className="flex items-center justify-between font-bold">
                  <span className="text-zinc-600 dark:text-zinc-400">🥩 Bill đắt nhất:</span>
                  <strong className="text-[#18181b] dark:text-white font-black truncate max-w-[140px]">
                    {topExpense ? `${topExpense.title}` : 'Chưa có'}
                  </strong>
                </div>

                <div className="flex items-center justify-between font-bold">
                  <span className="text-zinc-600 dark:text-zinc-400">⚡ Đối soát:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-black">100% Sòng phẳng</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-1 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  disabled={exporting}
                  className="w-full py-3 rounded-2xl border-2 border-[#18181b] dark:border-zinc-700 bg-[#ff5400] hover:bg-[#ea580c] text-white font-black text-xs flex items-center justify-center gap-2 shadow-[3px_3px_0px_#18181b] dark:shadow-[3px_3px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>{exporting ? 'Đang xuất ảnh...' : 'Lưu ảnh Story Neo-Retro (PNG)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyRecap}
                  className="w-full py-2.5 rounded-2xl border-2 border-[#18181b] dark:border-zinc-700 bg-white hover:bg-zinc-50 dark:bg-[#252532] dark:hover:bg-[#2c2c3b] text-[#18181b] dark:text-white font-black text-xs flex items-center justify-center gap-2 shadow-[2px_2px_0px_#18181b] dark:shadow-[2px_2px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã copy vào bộ nhớ tạm!' : 'Copy văn bản định dạng Retro'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Bottom Neo-Retro Barcode & Step footer */}
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 pt-3 border-t-2 border-[#18181b]/20 dark:border-white/20">
            <span className="tracking-widest">||| | |||| | |||</span>
            <span 
              onClick={handleNext}
              className="font-black text-[#ff5400] hover:underline cursor-pointer flex items-center gap-1"
            >
              {currentSlide < totalSlides - 1 ? (
                <>
                  <span>TIẾP THEO</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              ) : (
                'KẾT THÚC ★'
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
              Lưu ảnh Wrapped 📸
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
              Đóng
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
                    const file = new File([blob], `Spliqo_RetroWrapped_${trip.name.replace(/\s+/g, '_')}.png`, { type: 'image/png' });
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
                <span>Chia sẻ / Lưu ảnh</span>
              </button>
            )}
          </div>
        }
      >
        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200">
            <p className="font-bold flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              Hướng dẫn lưu ảnh trên iPhone:
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-amber-950 dark:text-amber-100">
              Nhấn giữ vào ảnh bên dưới trong <strong>1 giây</strong>, sau đó chọn <strong>"Lưu vào Ảnh" (Save to Photos)</strong> để tải về máy.
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
