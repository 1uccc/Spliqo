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

  // Generate canvas image for a specific slide (0 to 4)
  const generateSlideCanvas = (slideIndex) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');

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
      ctx.fillStyle = shadowColor;
      ctx.fillRect(x + shadowOffset, y + shadowOffset, w, h);
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, w, h);
      ctx.lineWidth = 5;
      ctx.strokeStyle = borderStroke;
      ctx.strokeRect(x, y, w, h);
    };

    // 4. Top Retro Header Ribbon
    drawBrutalistCard(80, 85, 920, 105, '#ff5400', 8);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 38px sans-serif';
    ctx.fillText('★ SPLIQO WRAPPED ★', 115, 150);
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(isEn ? `STORY ${slideIndex + 1}/5` : `TRANG ${slideIndex + 1}/5`, 965, 148);
    ctx.textAlign = 'left';

    // 5. Trip Name Headline & Subtitle
    ctx.fillStyle = textPrimary;
    ctx.font = '900 64px sans-serif';
    const truncatedName = trip.name.length > 20 ? trip.name.substring(0, 18) + '...' : trip.name;
    ctx.fillText(truncatedName.toUpperCase(), 80, 260);

    ctx.fillStyle = textMuted;
    ctx.font = 'bold 26px monospace';
    ctx.fillText(
      isEn
        ? `${totalDays} DAYS EXPLORING • ${members.length} MEMBERS • ${expenses.length} BILLS`
        : `KỲ NGHỈ ${totalDays} NGÀY • ${members.length} THÀNH VIÊN • ${expenses.length} HÓA ĐƠN`,
      80,
      305
    );

    // 6. RENDER SPECIFIC SLIDE CONTENT
    if (slideIndex === 0) {
      // SLIDE 0: TỔNG QUAN TÀI CHÍNH
      drawBrutalistCard(80, 360, 920, 380, cardFill, 14);
      ctx.fillStyle = isDarkPoster ? '#ff5400' : '#18181b';
      ctx.fillRect(80, 360, 460, 52);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(isEn ? '● TOTAL TRIP EXPENSES' : '● TỔNG CHI PHÍ CHUYẾN ĐI', 105, 396);

      ctx.fillStyle = '#ff5400';
      ctx.font = '900 102px monospace';
      ctx.fillText(formatVND(totalExpense), 115, 540);

      ctx.fillStyle = textMuted;
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText(
        isEn ? `Average per person: ${formatVND(avgPerPerson)}` : `Bình quân mỗi người: ${formatVND(avgPerPerson)}`, 
        115, 
        640
      );

      // Grid of 2 Mini Cards
      drawBrutalistCard(80, 780, 440, 220, yellowCardBg, 10);
      ctx.fillStyle = yellowCardText;
      ctx.font = 'bold 24px monospace';
      ctx.fillText(isEn ? '✦ DURATION' : '✦ THỜI GIAN', 110, 840);
      ctx.font = '900 58px sans-serif';
      ctx.fillText(isEn ? `${totalDays} DAYS` : `${totalDays} NGÀY`, 110, 925);

      drawBrutalistCard(560, 780, 440, 220, peachCardBg, 10);
      ctx.fillStyle = peachCardText;
      ctx.font = 'bold 24px monospace';
      ctx.fillText(isEn ? '✦ TOTAL BILLS' : '✦ TỔNG SỐ BILL', 590, 840);
      ctx.font = '900 58px sans-serif';
      ctx.fillText(isEn ? `${expenses.length} BILLS` : `${expenses.length} BILL`, 590, 925);

      // Summary Highlight Card
      drawBrutalistCard(80, 1040, 920, 280, cardFill, 14);
      ctx.fillStyle = '#ff5400';
      ctx.fillRect(80, 1040, 440, 48);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 22px sans-serif';
      ctx.fillText(isEn ? '👑 TOP SPENDER' : '👑 NGƯỜI CHI BẠO NHẤT', 105, 1073);

      ctx.fillStyle = textPrimary;
      ctx.font = '900 52px sans-serif';
      ctx.fillText(topPayer.displayName.toUpperCase(), 115, 1160);

      ctx.fillStyle = '#ff5400';
      ctx.font = '900 42px monospace';
      ctx.fillText(isEn ? `PAID UPFRONT: ${formatVND(topPayer.totalPaid)}` : `ĐÃ ỨNG TRƯỚC: ${formatVND(topPayer.totalPaid)}`, 115, 1225);

      ctx.fillStyle = textMuted;
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(isEn ? `Covered ${topPayerPercent}% of total trip budget.` : `Chiếm ${topPayerPercent}% toàn bộ ngân sách cả chuyến đi.`, 115, 1275);

      // Slogan Card
      drawBrutalistCard(80, 1360, 920, 280, yellowCardBg, 12);
      ctx.fillStyle = yellowCardText;
      ctx.font = '900 36px sans-serif';
      ctx.fillText(isEn ? '⚡ FAIR PLAY • QUICK SETTLE' : '⚡ CHIA SÒNG PHẲNG • ĐI KHẮP NƠI', 120, 1445);
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(isEn ? 'All expenses calculated smartly with Spliqo.' : 'Mọi chi phí được tính toán tự động chuẩn xác cùng Spliqo.', 120, 1515);
      ctx.fillText(isEn ? 'No awkward calculations, pure good memories!' : 'Không lo tính toán, trọn vẹn kỷ niệm đẹp bên bạn bè!', 120, 1565);

    } else if (slideIndex === 1) {
      // SLIDE 1: CHỦ TỊCH GÁNH TEAM MVP
      drawBrutalistCard(80, 360, 920, 140, '#ff5400', 10);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 38px sans-serif';
      ctx.fillText(isEn ? '👑 TOP SPENDER MVP OF THE TRIP 👑' : '👑 CHỦ TỊCH GÁNH TEAM TOÀN ĐOÀN 👑', 120, 445);

      // MVP Avatar Showcase Card
      drawBrutalistCard(340, 550, 400, 380, cardFill, 16);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(360, 570, 360, 260);
      ctx.lineWidth = 4;
      ctx.strokeStyle = borderStroke;
      ctx.strokeRect(360, 570, 360, 260);
      
      // Crown & MVP Tag
      ctx.fillStyle = '#ff5400';
      ctx.font = '900 90px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('👑', 540, 720);
      ctx.font = '900 30px sans-serif';
      ctx.fillStyle = '#18181b';
      ctx.fillText('#1 MVP SPENDER', 540, 785);
      ctx.textAlign = 'left';

      // Name & title
      ctx.fillStyle = textPrimary;
      ctx.font = '900 68px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(topPayer.displayName.toUpperCase(), 540, 1010);
      ctx.fillStyle = textMuted;
      ctx.font = 'bold 26px monospace';
      ctx.fillText(isEn ? 'MOST GENEROUS SPENDER OF THE TRIP' : 'NGƯỜI CHỊU CHI BẠO TAY NHẤT CẢ CHUYẾN ĐI', 540, 1060);
      ctx.textAlign = 'left';

      // Giant Stat Card
      drawBrutalistCard(80, 1130, 920, 300, cardFill, 14);
      ctx.fillStyle = '#ff5400';
      ctx.fillRect(80, 1130, 480, 50);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 22px sans-serif';
      ctx.fillText(isEn ? '● TOTAL AMOUNT ADVANCED' : '● SỐ TIỀN ĐÃ ỨNG TRƯỚC', 105, 1163);

      ctx.fillStyle = '#ff5400';
      ctx.font = '900 96px monospace';
      ctx.fillText(formatVND(topPayer.totalPaid), 115, 1290);

      ctx.fillStyle = textMuted;
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(
        isEn 
          ? `Covered ${topPayerPercent}% of total trip budget!`
          : `Gánh tới ${topPayerPercent}% toàn bộ ngân sách chi tiêu cả đoàn!`,
        115, 
        1370
      );

      // Gratitude Card
      drawBrutalistCard(80, 1470, 920, 180, yellowCardBg, 10);
      ctx.fillStyle = yellowCardText;
      ctx.font = '900 30px sans-serif';
      ctx.fillText(isEn ? '🙏 CREW SHOUTOUT' : '🙏 THAY LỜI CẢM ƠN TỪ CẢ ĐOÀN', 120, 1540);
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(isEn ? 'Big thanks for paying upfront and keeping the trip smooth!' : 'Cảm ơn chủ tịch đã quẹt thẻ chi trả trước cho mọi hoạt động ăn chơi!', 120, 1595);

    } else if (slideIndex === 2) {
      // SLIDE 2: KHOẢN CHI KỶ LỤC
      drawBrutalistCard(80, 360, 920, 130, '#18181b', 10);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 36px sans-serif';
      ctx.fillText(isEn ? '🥩 BIGGEST RECORD EXPENSE 🥩' : '🥩 KHOẢN CHI ĐẮT ĐỎ NHẤT CHUYẾN ĐI 🥩', 120, 440);

      // Giant Expense Card
      drawBrutalistCard(80, 530, 920, 440, cardFill, 14);
      ctx.fillStyle = '#ff5400';
      ctx.fillRect(80, 530, 480, 50);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 22px sans-serif';
      ctx.fillText(isEn ? '● RECORD BILL OF TRIP' : '● HÓA ĐƠN KỶ LỤC', 105, 563);

      ctx.fillStyle = textPrimary;
      ctx.font = '900 60px sans-serif';
      const expTitle = topExpense ? topExpense.title : (isEn ? 'No Expenses' : 'Chưa có khoản chi');
      const expTrunc = expTitle.length > 22 ? expTitle.substring(0, 20) + '...' : expTitle;
      ctx.fillText(`"${expTrunc.toUpperCase()}"`, 115, 680);

      ctx.fillStyle = '#ff5400';
      ctx.font = '900 102px monospace';
      ctx.fillText(formatVND(topExpense ? topExpense.amount : 0), 115, 830);

      ctx.fillStyle = textMuted;
      ctx.font = 'bold 26px sans-serif';
      const expSharePercent = totalExpense > 0 && topExpense ? Math.round((topExpense.amount / totalExpense) * 100) : 0;
      ctx.fillText(isEn ? `Accounted for ${expSharePercent}% of total trip spending.` : `Chiếm ${expSharePercent}% tổng toàn bộ chi phí cả chuyến đi.`, 115, 910);

      // Detail Breakdown Card
      drawBrutalistCard(80, 1010, 920, 380, yellowCardBg, 12);
      ctx.fillStyle = yellowCardText;
      ctx.font = '900 32px sans-serif';
      ctx.fillText(isEn ? '✦ BILL DETAILS' : '✦ CHI TIẾT HÓA ĐƠN', 120, 1080);

      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(isEn ? `• Payer: ${topExpensePayer?.displayName || 'Member'}` : `• Người thanh toán: ${topExpensePayer?.displayName || 'Thành viên'}`, 120, 1160);
      ctx.fillText(isEn ? `• Date logged: ${topExpense?.date || 'During trip'}` : `• Ngày chi tiêu: ${topExpense?.date || 'Trong chuyến đi'}`, 120, 1230);
      ctx.fillText(isEn ? `• Split between: ${topExpense?.participants?.length || members.length} members` : `• Số người cùng chia: ${topExpense?.participants?.length || members.length} thành viên`, 120, 1300);

      // Quote Card
      drawBrutalistCard(80, 1430, 920, 210, peachCardBg, 10);
      ctx.fillStyle = peachCardText;
      ctx.font = '900 32px sans-serif';
      ctx.fillText(isEn ? '✨ BEST MEMORIES EVER' : '✨ ĂN CHƠI HẾT MÌNH', 120, 1510);
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(isEn ? 'Expensive bills turn into the richest travel memories!' : 'Những bữa ăn ngon nhất chính là những kỷ niệm đáng nhớ nhất!', 120, 1575);

    } else if (slideIndex === 3) {
      // SLIDE 3: SÒNG PHẲNG THẦN TỐC 100%
      drawBrutalistCard(80, 360, 920, 140, '#ff5400', 10);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 36px sans-serif';
      ctx.fillText(isEn ? '⚡ LIGHTNING-FAST SETTLEMENT ⚡' : '⚡ TINH THẦN SÒNG PHẲNG TUYỆT ĐỐI ⚡', 120, 445);

      // Sparkles Icon
      drawBrutalistCard(420, 540, 240, 240, cardFill, 14);
      ctx.fillStyle = '#ff5400';
      ctx.font = '900 120px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡', 540, 705);
      ctx.textAlign = 'left';

      // Title
      ctx.fillStyle = textPrimary;
      ctx.font = '900 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isEn ? 'PLAY FAIR • SPLIT EVEN' : 'CHƠI ĐẸP • CHIA ĐỀU', 540, 850);
      ctx.fillText(isEn ? 'TRIP COMPLETE!' : 'TRỌN VẸN TÌNH BẠN!', 540, 915);
      ctx.fillStyle = textMuted;
      ctx.font = 'bold 24px monospace';
      ctx.fillText(isEn ? '100% BALANCED VIA VIETQR' : '100% CÔNG NỢ ĐÃ TẤT TOÁN MINH BẠCH', 540, 965);
      ctx.textAlign = 'left';

      // Progress Card
      drawBrutalistCard(80, 1030, 920, 320, cardFill, 14);
      ctx.fillStyle = '#ff5400';
      ctx.fillRect(80, 1030, 480, 50);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 22px sans-serif';
      ctx.fillText(isEn ? '● RECONCILIATION PROGRESS' : '● TIẾN ĐỘ ĐỐI SOÁT CÔNG NỢ', 105, 1063);

      ctx.fillStyle = '#ff5400';
      ctx.font = '900 86px monospace';
      ctx.fillText(isEn ? '100% COMPLETE' : '100% HOÀN TẤT', 115, 1185);

      // Progress bar
      ctx.fillStyle = '#edebe4';
      ctx.fillRect(115, 1225, 850, 36);
      ctx.fillStyle = '#ff5400';
      ctx.fillRect(115, 1225, 850, 36);
      ctx.lineWidth = 3;
      ctx.strokeStyle = borderStroke;
      ctx.strokeRect(115, 1225, 850, 36);

      ctx.fillStyle = textMuted;
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(isEn ? 'All debts balanced & settled cleanly via VietQR!' : 'Mọi khoản nợ được cân bằng đối soát chuẩn từng đồng qua VietQR!', 115, 1300);

      // MVP Settler Card
      drawBrutalistCard(80, 1390, 920, 250, yellowCardBg, 12);
      ctx.fillStyle = yellowCardText;
      ctx.font = '900 26px monospace';
      ctx.fillText(isEn ? '✦ LIGHTNING-FAST SETTLER' : '✦ THÀNH VIÊN THANH TOÁN NHANH NHƯ CHỚP', 120, 1460);
      ctx.font = '900 52px sans-serif';
      ctx.fillText(fastestSettler?.displayName?.toUpperCase() || (isEn ? 'EVERYONE' : 'CẢ NHÓM'), 120, 1540);
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(isEn ? 'Zero hesitation, 10/10 credibility points!' : 'Tinh thần sòng phẳng thần tốc, chuẩn 10 điểm uy tín!', 120, 1600);

    } else if (slideIndex === 4) {
      // SLIDE 4: VÉ TỔNG KẾT SPLIQO VINTAGE TICKET
      drawBrutalistCard(80, 360, 920, 130, '#ff5400', 10);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 36px sans-serif';
      ctx.fillText(isEn ? '★ SPLIQO VINTAGE TICKET • CHỐT SỔ ★' : '★ VÉ CHỐT SỔ CHUYẾN ĐI • VINTAGE TICKET ★', 120, 440);

      // Giant Ticket Boarding Pass Card
      drawBrutalistCard(80, 530, 920, 840, cardFill, 16);

      // Top Ticket Label
      ctx.fillStyle = '#18181b';
      ctx.fillRect(80, 530, 360, 50);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('SPLIQO TICKET PASS', 105, 563);

      ctx.fillStyle = textPrimary;
      ctx.font = '900 58px sans-serif';
      ctx.fillText(truncatedName.toUpperCase(), 115, 660);

      ctx.fillStyle = textMuted;
      ctx.font = 'bold 26px monospace';
      ctx.fillText(`TRIP CODE: #${trip.tripCode || 'SPLIQO'} • ${trip.startDate || '2026'}`, 115, 715);

      // Perforation Dashed Line
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 10]);
      ctx.strokeStyle = textMuted;
      ctx.beginPath();
      ctx.moveTo(100, 755);
      ctx.lineTo(980, 755);
      ctx.stroke();
      ctx.setLineDash([]);

      // Row 1: Total spent
      ctx.fillStyle = textMuted;
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(isEn ? 'Total Trip Spent:' : 'Tổng chi toàn chuyến:', 115, 825);
      ctx.fillStyle = '#ff5400';
      ctx.font = '900 38px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(formatVND(totalExpense), 965, 825);
      ctx.textAlign = 'left';

      // Row 2: Top Spender
      ctx.fillStyle = textMuted;
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(isEn ? '👑 Top Spender:' : '👑 Chi bạo nhất:', 115, 915);
      ctx.fillStyle = textPrimary;
      ctx.font = '900 32px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${topPayer.displayName} (${formatVND(topPayer.totalPaid)})`, 965, 915);
      ctx.textAlign = 'left';

      // Row 3: Biggest bill
      ctx.fillStyle = textMuted;
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(isEn ? '🥩 Biggest Bill:' : '🥩 Bill đắt nhất:', 115, 1005);
      ctx.fillStyle = textPrimary;
      ctx.font = '900 32px sans-serif';
      ctx.textAlign = 'right';
      const billTrunc = topExpense ? (topExpense.title.length > 14 ? topExpense.title.substring(0, 12) + '...' : topExpense.title) : 'None';
      ctx.fillText(`${billTrunc} (${formatVND(topExpense?.amount || 0)})`, 965, 1005);
      ctx.textAlign = 'left';

      // Row 4: Settlement
      ctx.fillStyle = textMuted;
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(isEn ? '⚡ Settlement:' : '⚡ Đối soát:', 115, 1095);
      ctx.fillStyle = '#16a34a';
      ctx.font = '900 32px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(isEn ? '100% Fair & Settled' : '100% Sòng phẳng', 965, 1095);
      ctx.textAlign = 'left';

      // Row 5: Scale
      ctx.fillStyle = textMuted;
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(isEn ? '👥 Scale:' : '👥 Quy mô:', 115, 1185);
      ctx.fillStyle = textPrimary;
      ctx.font = '900 30px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${members.length} members • ${expenses.length} bills`, 965, 1185);
      ctx.textAlign = 'left';

      // Final Stamp Box
      drawBrutalistCard(80, 1410, 920, 230, yellowCardBg, 12);
      ctx.fillStyle = yellowCardText;
      ctx.font = '900 36px sans-serif';
      ctx.fillText(isEn ? '★ CERTIFIED SPLIQO TRIP ★' : '★ CHỨNG NHẬN SÒNG PHẲNG SPLIQO ★', 120, 1490);
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(isEn ? 'Fair financial habits build long-lasting friendships!' : 'Tài chính rõ ràng minh bạch giúp tình bạn luôn bền chặt!', 120, 1555);
      ctx.fillText(isEn ? 'All debts settled seamlessly via VietQR.' : 'Toàn bộ công nợ đã được tất toán trọn vẹn qua VietQR.', 120, 1600);
    }

    // 7. Bottom Ticket Barcode & Footer (Common to all slides)
    ctx.fillStyle = textPrimary;
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
            className="relative rounded-3xl p-3.5 sm:p-4 flex flex-col justify-between border-[3px] border-[#18181b] dark:border-zinc-700 shadow-[4px_4px_0px_#18181b] dark:shadow-[4px_4px_0px_rgba(0,0,0,0.8)] bg-[#fbf9f3] dark:bg-[#1a1a24] text-[#18181b] dark:text-[#f4f4f5] select-none transition-all duration-300"
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
