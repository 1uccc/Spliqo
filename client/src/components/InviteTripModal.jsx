import React, { useState } from 'react';
import Modal from './Modal';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Link2, 
  Copy, 
  Check, 
  Share2, 
  QrCode, 
  Users, 
  UserPlus, 
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function InviteTripModal({ isOpen, onClose, trip, onOpenFriendList }) {
  const { showToast } = useToast();
  const { t, language } = useLanguage();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQR, setShowQR] = useState(true);

  if (!trip) return null;

  const origin = window.location.origin;
  const inviteUrl = `${origin}/join/${trip.tripCode || ''}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(inviteUrl)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    showToast(t('copiedLinkToast', 'Đã sao chép liên kết mời vào bộ nhớ tạm!'), 'success');
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleCopyCode = () => {
    if (!trip.tripCode) return;
    navigator.clipboard.writeText(trip.tripCode);
    setCopiedCode(true);
    showToast(t('copiedCodeToast', `Đã sao chép mã #${trip.tripCode}!`), 'success');
    setTimeout(() => setCopiedCode(false), 2200);
  };

  const handleNativeShare = async () => {
    const shareText = language === 'en'
      ? `Join my trip "${trip.name}" on Spliqo to track expenses together! Click the link to join:`
      : `Tham gia chuyến đi "${trip.name}" cùng mình trên Spliqo để cùng chia sẻ chi phí và quyết toán nhé! Bấm vào link để vào nhóm:`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Mời tham gia: ${trip.name}`,
          text: shareText,
          url: inviteUrl
        });
        showToast(t('shareSuccess', 'Đã mở bảng chia sẻ thành công!'), 'success');
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      // Fallback: Copy invite text with link
      const fullText = `${shareText}\n${inviteUrl}`;
      navigator.clipboard.writeText(fullText);
      showToast(t('shareFallbackToast', 'Đã sao chép nội dung & link mời để gửi qua Zalo/Messenger!'), 'success');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
              {t('inviteModalTitle', 'Mời bạn bè & khách vào chuyến đi')}
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal">
              {trip.name}
            </p>
          </div>
        </div>
      }
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-xs">
        
        {/* Intro banner */}
        <div className="p-3 rounded-2xl bg-[#edebe4]/70 dark:bg-[#1f1f28] border border-[#dedbd0] dark:border-[#2e2e38] flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {t(
              'inviteModalDesc',
              'Gửi link hoặc mã chuyến đi cho bạn bè. Người nhận chỉ cần mở link để xem thông tin và tham gia ngay lập tức.'
            )}
          </p>
        </div>

        {/* 1. Direct Invite Link Card */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{t('directInviteLink', 'Link mời tham gia trực tiếp')}</span>
          </label>

          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 p-2.5 rounded-xl bg-white dark:bg-[#18181f] border border-[#dedbd0] dark:border-[#2e2e38] font-mono text-[11px] text-zinc-700 dark:text-zinc-200 truncate select-all">
              {inviteUrl}
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs cursor-pointer shadow-xs shrink-0 ${
                copiedLink
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] hover:opacity-90'
              }`}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? t('copied', 'Đã chép') : t('copy', 'Sao chép')}</span>
            </button>
          </div>
        </div>

        {/* Action button: Native Share */}
        <button
          type="button"
          onClick={handleNativeShare}
          className="w-full py-2.5 px-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100/70 dark:hover:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
        >
          <Share2 className="w-4 h-4" />
          <span>{t('shareViaSocial', 'Chia sẻ qua Zalo, Messenger, SMS...')}</span>
        </button>

        {/* 2. QR Code Box (Scan to join instantly on phone) */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#18181f] border border-[#dedbd0] dark:border-[#2e2e38] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>{t('scanQrToJoin', 'Mã QR quét tham gia ngay')}</span>
            </span>
            <button
              type="button"
              onClick={() => setShowQR(!showQR)}
              className="text-[10px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-semibold cursor-pointer"
            >
              {showQR ? t('hide', 'Thu gọn') : t('show', 'Hiển thị')}
            </button>
          </div>

          {showQR && (
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <div className="p-2 bg-white rounded-xl border border-zinc-200 shadow-xs shrink-0">
                <img
                  src={qrApiUrl}
                  alt="QR Code"
                  className="w-28 h-28 object-contain"
                  loading="lazy"
                />
              </div>
              <div className="space-y-1.5 text-center sm:text-left">
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                  {t('qrInstruction', 'Bạn bè chỉ cần bật camera điện thoại quét mã QR này để truy cập chuyến đi tức thì.')}
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{t('instantAccess', 'Tiện lợi • Không cần cài app')}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Manual Trip Code Card */}
        <div className="p-3 rounded-2xl bg-[#edebe4]/50 dark:bg-[#212129] border border-[#dedbd0] dark:border-[#2e2e38] flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-400 uppercase tracking-wider block font-bold">
              {t('tripCodeLabel', 'Mã chuyến đi:')}
            </span>
            <span className="font-mono text-base font-extrabold text-zinc-900 dark:text-white tracking-wider">
              #{trip.tripCode}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyCode}
            className="tactile-btn-pill py-1.5 px-3 text-xs flex items-center gap-1.5"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? t('copied', 'Đã chép') : t('copyCode', 'Chép mã')}</span>
          </button>
        </div>

        {/* 4. Link to existing friend modal */}
        {onOpenFriendList && (
          <div className="pt-2 border-t border-[#dedbd0] dark:border-[#2e2e38] text-center">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFriendList();
              }}
              className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t('inviteFromSpliqoFriends', 'Hoặc chọn nhanh từ danh sách bạn bè Spliqo')}</span>
            </button>
          </div>
        )}

      </div>
    </Modal>
  );
}
