import React, { useState, useRef } from 'react';
import Modal from '../Modal';
import { 
  Sparkles, 
  Crown, 
  Zap, 
  TrendingUp, 
  UtensilsCrossed, 
  Share2, 
  Download, 
  Copy, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Calendar, 
  Users, 
  Receipt,
  Flame
} from 'lucide-react';
import { formatVND } from '../../services/calculation';
import confetti from 'canvas-confetti';

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
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
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

  // Copy text recap to clipboard
  const handleCopyRecap = async () => {
    const text = `✨ SPLIQO WRAPPED - ${trip.name} ✨
━━━━━━━━━━━━━━━━━━
💰 Tổng chi phí: ${formatVND(totalExpense)} (${members.length} người • ${expenses.length} hóa đơn • ${totalDays} ngày)
👑 Đại gia chuyến đi: ${topPayer.displayName} (đã gánh ${formatVND(topPayer.totalPaid)} ~ ${topPayerPercent}%)
🥩 Khoản chi đắt đỏ nhất: ${topExpense ? `${topExpense.title} (${formatVND(topExpense.amount)})` : 'Chưa có'}
⚡ Tinh thần sòng phẳng: ${confirmedSettlements.length}/${settlements.length || confirmedSettlements.length} khoản nợ đã hoàn tất!
📊 Chi phí trung bình: ${formatVND(avgPerPerson)}/người
━━━━━━━━━━━━━━━━━━
📲 Quản lý & cân bằng tài chính bởi Spliqo`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Generate PNG Canvas Image of the Story Card
  const handleDownloadImage = () => {
    setExporting(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');

      // Background Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, 1920);
      grad.addColorStop(0, '#09090b');
      grad.addColorStop(0.3, '#18181b');
      grad.addColorStop(0.7, '#1e1b4b');
      grad.addColorStop(1, '#064e3b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1920);

      // Decorative Circles
      ctx.beginPath();
      ctx.arc(900, 250, 300, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(150, 1600, 350, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.fill();

      // Top Logo
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 44px sans-serif';
      ctx.fillText('SPLIQO WRAPPED', 80, 140);

      ctx.fillStyle = '#a1a1aa';
      ctx.font = '30px sans-serif';
      ctx.fillText('HÀNH TRÌNH TÀI CHÍNH KỶ NIỆM', 80, 190);

      // Trip Name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 76px sans-serif';
      const truncatedName = trip.name.length > 22 ? trip.name.substring(0, 20) + '...' : trip.name;
      ctx.fillText(truncatedName, 80, 310);

      // Total Money Box
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.roundRect(80, 370, 920, 260, 36);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('TỔNG CHI PHÍ CHUYẾN ĐI', 130, 440);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 96px sans-serif';
      ctx.fillText(formatVND(totalExpense), 130, 560);

      // Row Stats
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.roundRect(80, 660, 445, 180, 28);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '28px sans-serif';
      ctx.fillText('QUY MÔ', 120, 720);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 46px sans-serif';
      ctx.fillText(`${members.length} người • ${totalDays} ngày`, 120, 790);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.roundRect(555, 660, 445, 180, 28);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '28px sans-serif';
      ctx.fillText('TRUNG BÌNH MỖI NGƯỜI', 595, 720);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 46px sans-serif';
      ctx.fillText(formatVND(avgPerPerson), 595, 790);

      // Card 1: Top Payer
      ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
      ctx.roundRect(80, 880, 920, 240, 32);
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('👑 ĐẠI GIA CHI TIÊU BẠO NHẤT', 130, 950);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 52px sans-serif';
      ctx.fillText(topPayer.displayName, 130, 1025);
      ctx.fillStyle = '#fde68a';
      ctx.font = '32px sans-serif';
      ctx.fillText(`Đã ứng trước: ${formatVND(topPayer.totalPaid)} (${topPayerPercent}% toàn chuyến)`, 130, 1080);

      // Card 2: Top Expense
      if (topExpense) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
        ctx.roundRect(80, 1160, 920, 240, 32);
        ctx.fill();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.stroke();

        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 32px sans-serif';
        ctx.fillText('🥩 MÓN ĂN / KHOẢN CHI ĐẮT ĐỎ NHẤT', 130, 1230);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 52px sans-serif';
        ctx.fillText(topExpense.title, 130, 1305);
        ctx.fillStyle = '#fecaca';
        ctx.font = '32px sans-serif';
        ctx.fillText(`${formatVND(topExpense.amount)} (Người trả: ${topExpensePayer?.displayName || 'Thành viên'})`, 130, 1360);
      }

      // Card 3: Team Spirit
      ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
      ctx.roundRect(80, 1440, 920, 220, 32);
      ctx.fill();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
      ctx.stroke();

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('⚡ TINH THẦN SÒNG PHẲNG 100%', 130, 1510);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px sans-serif';
      ctx.fillText('Tất cả công nợ đã được chốt sổ trọn vẹn!', 130, 1580);

      // Bottom Footer Brand
      ctx.fillStyle = '#a1a1aa';
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('spliqo.app • Chia tiền nhóm thông minh qua VietQR', 540, 1820);

      // Download
      const link = document.createElement('a');
      link.download = `Spliqo_Wrapped_${trip.name.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('tripWrappedTitle', 'Spliqo Wrapped: Nhìn lại chuyến đi 📊')}
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentSlide === 0}
              className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                currentSlide === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/5 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-200'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-mono font-bold text-zinc-500">
              {currentSlide + 1} / {totalSlides}
            </span>
            <button
              type="button"
              onClick={handleNext}
              disabled={currentSlide === totalSlides - 1}
              className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                currentSlide === totalSlides - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/5 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-200'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyRecap}
              className="tactile-btn-pill text-xs px-3 py-1.5 flex items-center gap-1.5 cursor-pointer font-bold"
              title="Sao chép tóm tắt để dán vào Zalo/Messenger"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép!' : 'Copy tóm tắt'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={exporting}
              className="tactile-btn-dark text-xs px-3.5 py-1.5 flex items-center gap-1.5 font-bold cursor-pointer shadow-md"
              title="Tải ảnh Story đẹp mắt để chia sẻ"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exporting ? 'Đang tạo ảnh...' : 'Lưu ảnh Story'}</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Story Progress Bar Indicators */}
        <div className="flex items-center gap-1.5 w-full">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <div
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className="h-1.5 flex-1 rounded-full cursor-pointer overflow-hidden bg-zinc-200 dark:bg-zinc-800 transition-all"
            >
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  idx <= currentSlide ? 'bg-gradient-to-r from-amber-400 to-emerald-500' : ''
                }`}
              />
            </div>
          ))}
        </div>

        {/* Slide Canvas Area */}
        <div 
          ref={cardRef}
          className="relative min-h-[420px] rounded-3xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-2xl text-white select-none transition-all duration-500"
          style={{
            background: currentSlide === 0
              ? 'linear-gradient(135deg, #18181b 0%, #1e1b4b 60%, #064e3b 100%)'
              : currentSlide === 1
              ? 'linear-gradient(135deg, #18181b 0%, #451a03 50%, #78350f 100%)'
              : currentSlide === 2
              ? 'linear-gradient(135deg, #18181b 0%, #4c0519 50%, #881337 100%)'
              : currentSlide === 3
              ? 'linear-gradient(135deg, #18181b 0%, #064e3b 50%, #047857 100%)'
              : 'linear-gradient(135deg, #09090b 0%, #1e1b4b 50%, #0f172a 100%)'
          }}
        >
          {/* Subtle Ambient Orb */}
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          {/* SLIDE 0: INTRO & TOTAL EXPENSE */}
          {currentSlide === 0 && (
            <div className="space-y-6 animate-fade-in relative z-10 my-auto">
              <div>
                <span className="text-[11px] font-bold tracking-widest text-emerald-400 uppercase">
                  ✨ SPLIQO WRAPPED
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
                  {trip.name}
                </h2>
                <p className="text-xs text-zinc-300 mt-1">
                  {totalDays} ngày khám phá cùng {members.length} người bạn đồng hành
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-2">
                <span className="text-[11px] text-zinc-300 uppercase font-semibold">
                  Cả nhóm đã cùng nhau trải nghiệm
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-emerald-300 tracking-tight">
                  {formatVND(totalExpense)}
                </div>
                <div className="text-xs text-zinc-300 pt-1 flex items-center justify-between">
                  <span>Trung bình mỗi người:</span>
                  <strong className="text-white font-bold">{formatVND(avgPerPerson)}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] mb-1">
                    <Receipt className="w-3.5 h-3.5 text-amber-400" />
                    <span>Hóa đơn</span>
                  </div>
                  <div className="text-base font-extrabold text-white">
                    {expenses.length} khoản chi
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] mb-1">
                    <Calendar className="w-3.5 h-3.5 text-teal-400" />
                    <span>Thời gian</span>
                  </div>
                  <div className="text-base font-extrabold text-white">
                    {totalDays} ngày vui
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 1: TOP PAYER (ĐẠI GIA CHI TIÊU BẠO NHẤT) */}
          {currentSlide === 1 && (
            <div className="space-y-6 animate-fade-in relative z-10 my-auto text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold">
                <Crown className="w-4 h-4 text-amber-300" />
                <span>CHỦ TỊCH GÁNH TEAM</span>
              </div>

              <div className="relative inline-block mx-auto">
                <img
                  src={topPayer.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${topPayer.userId || topPayer.uid || topPayer.id}`}
                  alt=""
                  className="w-24 h-24 rounded-3xl mx-auto bg-white/20 border-4 border-amber-400 shadow-2xl object-cover"
                />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-xs shadow-lg">
                  👑
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-extrabold text-white">
                  {topPayer.displayName}
                </h3>
                <p className="text-xs text-amber-200">
                  Người chịu chi bạo tay nhất chuyến đi!
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-left space-y-1.5">
                <div className="text-[11px] text-amber-300 font-semibold uppercase">
                  Đã ứng trước thanh toán:
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-300">
                  {formatVND(topPayer.totalPaid)}
                </div>
                <p className="text-[11px] text-zinc-300">
                  Chiếm tới <strong>{topPayerPercent}%</strong> toàn bộ ngân sách chuyến đi của cả nhóm.
                </p>
              </div>
            </div>
          )}

          {/* SLIDE 2: TOP EXPENSE (MÓN ĂN / KHOẢN CHI ĐẮT ĐỎ NHẤT) */}
          {currentSlide === 2 && (
            <div className="space-y-6 animate-fade-in relative z-10 my-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-400/20 border border-rose-400/40 text-rose-300 text-xs font-bold">
                <UtensilsCrossed className="w-4 h-4 text-rose-300" />
                <span>KHOẢN CHI ĐẮT ĐỎ NHẤT 🥩</span>
              </div>

              {topExpense ? (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-500/30 space-y-2">
                    <span className="text-[11px] text-rose-300 font-semibold uppercase">
                      Hóa đơn kỷ lục của chuyến đi
                    </span>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                      "{topExpense.title}"
                    </h3>
                    <div className="text-3xl font-extrabold text-rose-300">
                      {formatVND(topExpense.amount)}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1">
                    <div className="flex items-center justify-between text-zinc-300">
                      <span>Người chi trả:</span>
                      <strong className="text-white font-bold">{topExpensePayer?.displayName || 'Thành viên'}</strong>
                    </div>
                    <div className="flex items-center justify-between text-zinc-300">
                      <span>Ngày thanh toán:</span>
                      <span className="text-zinc-200">{topExpense.date || 'Trong chuyến đi'}</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-300">
                      <span>Số người chia:</span>
                      <span className="text-zinc-200">{topExpense.participants?.length || members.length} người</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-300 py-10 text-center">
                  Chưa có khoản chi nào được ghi nhận.
                </p>
              )}
            </div>
          )}

          {/* SLIDE 3: TEAM SPIRIT & FAST SETTLER */}
          {currentSlide === 3 && (
            <div className="space-y-6 animate-fade-in relative z-10 my-auto text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold">
                <Zap className="w-4 h-4 text-emerald-300" />
                <span>THẦN TỐC & SÒNG PHẲNG ⚡</span>
              </div>

              <div className="space-y-2">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-xl">
                  <Sparkles className="w-8 h-8 text-amber-300" />
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                  Chơi đẹp - Chia đều - Trọn tình bạn
                </h3>
                <p className="text-xs text-emerald-200 max-w-xs mx-auto">
                  Toàn bộ công nợ đã được tất toán minh bạch qua VietQR chuẩn từng đồng!
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/30 text-left space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-300 font-semibold">Tỷ lệ tất toán công nợ:</span>
                  <span className="font-extrabold text-emerald-300">100% HOÀN TẤT</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full w-full rounded-full" />
                </div>
                <p className="text-[11px] text-zinc-300 pt-1">
                  ⚡ Thành viên tiêu biểu: <strong className="text-white">{fastestSettler?.displayName || 'Cả nhóm'}</strong> chuyển khoản nhanh như chớp!
                </p>
              </div>
            </div>
          )}

          {/* SLIDE 4: FULL RECAP STORY CARD (READY TO SAVE/SHARE) */}
          {currentSlide === 4 && (
            <div className="space-y-4 animate-fade-in relative z-10 my-auto">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-400 tracking-wider uppercase">
                    SPLIQO WRAPPED CARD
                  </span>
                  <h3 className="text-lg font-extrabold text-white truncate max-w-[240px]">
                    {trip.name}
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-zinc-400 font-bold">
                  {trip.startDate}
                </span>
              </div>

              {/* Miniature Card Summary */}
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-zinc-300">Tổng chi phí cả nhóm:</span>
                  <strong className="text-emerald-300 font-extrabold text-sm">
                    {formatVND(totalExpense)}
                  </strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-300">👑 Chi bạo nhất:</span>
                  <strong className="text-amber-300">{topPayer.displayName} ({formatVND(topPayer.totalPaid)})</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-300">🥩 Bill đắt nhất:</span>
                  <strong className="text-rose-300 truncate max-w-[150px]">
                    {topExpense ? `${topExpense.title} (${formatVND(topExpense.amount)})` : 'Chưa có'}
                  </strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-300">⚡ Tiến độ tất toán:</span>
                  <strong className="text-emerald-400">100% Sòng phẳng</strong>
                </div>
              </div>

              {/* Call to Action buttons inside slide */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  disabled={exporting}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{exporting ? 'Đang tạo file ảnh...' : 'Tải ảnh Story PNG chia sẻ bạn bè'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyRecap}
                  className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/15 transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã sao chép vào bộ nhớ tạm!' : 'Sao chép văn bản recap'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Bottom Tap Prompts */}
          <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-4 border-t border-white/10 relative z-10">
            <span>Spliqo • Ký ức tài chính</span>
            <span className="text-zinc-300 font-semibold cursor-pointer" onClick={handleNext}>
              {currentSlide < totalSlides - 1 ? 'Chạm để xem tiếp →' : 'Hành trình kết thúc ✨'}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
