import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Flame, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  QrCode, 
  Zap, 
  Heart, 
  ArrowLeft,
  Smartphone,
  Layers
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';

function InstagramIcon({ className = "w-4 h-4" }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export default function AboutPage() {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const instagramHandle = '1uccc.ng';
  const instagramUrl = 'https://instagram.com/1uccc.ng';

  const handleCopyInstagram = async () => {
    try {
      await navigator.clipboard.writeText(instagramHandle);
      setCopied(true);
      showToast('Đã sao chép Instagram: @1uccc.ng', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Không thể sao chép, vui lòng thử lại', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in text-[#18181b] dark:text-[#f4f4f5]">
      {/* Header with Back button */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18181b] dark:text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] flex items-center justify-center shadow-xs">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <span>{t('aboutTitle', 'Giới thiệu về Spliqo')}</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {t('aboutSubtitle', 'Ứng dụng chia tiền nhóm thông minh, tối ưu công nợ và quyết toán')}
          </p>
        </div>

        <Link
          to="/dashboard"
          className="tactile-btn-pill py-2 px-3.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('back', 'Quay lại')}</span>
        </Link>
      </div>

      {/* Creator Highlight Card (Product by 1uccc, Contact: ig:1uccc.ng) */}
      <div className="tactile-card p-6 sm:p-8 relative overflow-hidden bg-gradient-to-br from-white via-[#faf9f5] to-amber-50/40 dark:from-[#1b1b22] dark:via-[#16161b] dark:to-purple-950/20 border-amber-500/20 shadow-md">
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-gradient-to-br from-amber-400/20 to-pink-500/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
          {/* Creator Avatar / Badge */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-600 via-pink-600 to-amber-500 p-1 shadow-lg group-hover:scale-105 transition-all">
              <div className="w-full h-full rounded-[22px] bg-white dark:bg-[#18181f] flex flex-col items-center justify-center p-2 text-center">
                <Flame className="w-8 h-8 text-amber-500 fill-amber-400 animate-pulse" />
                <span className="text-[11px] font-black tracking-tight text-[#18181b] dark:text-white mt-1">1uccc</span>
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] text-[9px] font-black uppercase tracking-wider shadow-xs">
              Author
            </div>
          </div>

          {/* Details & Social Contacts */}
          <div className="flex-1 space-y-3">

            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-[#18181b] dark:text-white tracking-tight">
                Product by 1uccc
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">
                Được phát triển với tâm huyết nhằm giải quyết bài toán chia tiền nhóm sòng phẳng, nhanh chóng và tinh tế nhất cho các bạn trẻ Việt Nam.
              </p>
            </div>

            {/* Contact Information & Action Pills */}
            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              {/* Instagram link button */}
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white font-bold text-xs flex items-center gap-2 hover:opacity-95 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Mở Instagram của 1uccc"
              >
                <InstagramIcon className="w-4 h-4" />
                <span>Contact: 1uccc.ng</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* About Spliqo Key Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="tactile-card p-5 space-y-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
            <Zap className="w-5 h-5 stroke-[2.2]" />
          </div>
          <h4 className="font-bold text-sm text-[#18181b] dark:text-white">Tối ưu hóa công nợ</h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Thuật toán thông minh tự động triệt tiêu và cân bằng công nợ chéo giữa các thành viên, giảm số giao dịch chuyển tiền xuống ít nhất có thể.
          </p>
        </div>

        <div className="tactile-card p-5 space-y-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
            <QrCode className="w-5 h-5 stroke-[2.2]" />
          </div>
          <h4 className="font-bold text-sm text-[#18181b] dark:text-white">VietQR 1 Chạm</h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Tự động sinh mã VietQR kèm số tài khoản người nhận và số tiền cần thanh toán chính xác từng đồng, quét mã là chuyển xong tức thì.
          </p>
        </div>

        <div className="tactile-card p-5 space-y-2.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs">
            <Smartphone className="w-5 h-5 stroke-[2.2]" />
          </div>
          <h4 className="font-bold text-sm text-[#18181b] dark:text-white">Realtime & Ngoại tuyến</h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Hỗ trợ ghi chép chi tiêu ngay cả khi đi phượt vùng sâu mất sóng (Offline Sync), cập nhật tức thì tới tất cả thành viên khi có mạng.
          </p>
        </div>
      </div>

      {/* Tech Stack & App Specs Card */}
      <div className="tactile-card p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-2 border-b border-[#e6e4dc] dark:border-[#2e2e38] pb-4">
          <div className="w-8 h-8 rounded-full bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] flex items-center justify-center shadow-xs">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#18181b] dark:text-white">Thông tin phiên bản & Công nghệ</h3>
            <p className="text-[11px] text-zinc-400">Kiến trúc hiện đại, bảo mật và tốc độ cao</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-[#f4f3ec] dark:bg-[#212129] border border-[#e6e4dc] dark:border-[#32323e]">
            <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Phiên bản</span>
            <span className="font-mono font-bold text-[#18181b] dark:text-white">v1.2.3 (Production)</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#e6e4dc] dark:border-[#2e2e38] text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500 inline" />
            <span>Crafted with love by <strong className="text-[#18181b] dark:text-white">1uccc</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
