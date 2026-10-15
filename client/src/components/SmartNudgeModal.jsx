import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { formatVND } from '../services/calculation';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  Share2, 
  QrCode, 
  CreditCard, 
  Clock, 
  MessageCircle, 
  AlertCircle
} from 'lucide-react';

const NUDGE_TONES = [
  {
    id: 'gentle',
    label: 'Nhẹ nhàng & Tinh tế',
    icon: '🌸',
    color: 'hover:border-rose-300 dark:hover:border-rose-700 bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300',
    activeColor: 'border-rose-500 bg-rose-100/70 dark:bg-rose-900/40 text-rose-900 dark:text-rose-200 ring-2 ring-rose-400',
    getMessage: (debtorName, amountStr, tripName) => 
      `Alo ${debtorName} ơi! Khi nào rảnh kiểm tra và ting ting giúp mình ${amountStr} khoản ăn chơi trong chuyến "${tripName}" nha. Cảm ơn bạn iu nhiều! 🥰`
  },
  {
    id: 'playful',
    label: 'Hài hước & Cứu đói',
    icon: '🍕',
    color: 'hover:border-amber-300 dark:hover:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300',
    activeColor: 'border-amber-500 bg-amber-100/70 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 ring-2 ring-amber-400',
    getMessage: (debtorName, amountStr, tripName) => 
      `Ví của mình đang phát tín hiệu cấp cứu 🆘! ${debtorName} cứu đói mình khoản ${amountStr} chuyến "${tripName}" với nhé, mãi bên nhau bạn nhé! 🍕🥤`
  },
  {
    id: 'coffee',
    label: 'Kèo Cà phê & Bạn bè',
    icon: '☕',
    color: 'hover:border-teal-300 dark:hover:border-teal-700 bg-teal-50/50 dark:bg-teal-950/20 text-teal-800 dark:text-teal-300',
    activeColor: 'border-teal-500 bg-teal-100/70 dark:bg-teal-900/40 text-teal-900 dark:text-teal-200 ring-2 ring-teal-400',
    getMessage: (debtorName, amountStr, tripName) => 
      `Hôm nào lại làm kèo cà phê nữa nhé! Tiện tay thì ${debtorName} chuyển giúp mình ${amountStr} tiền chuyến "${tripName}" nha. Chúc bạn một ngày siêu năng lượng! ☕✨`
  },
  {
    id: 'direct',
    label: 'Ngắn gọn & Rõ ràng',
    icon: '📋',
    color: 'hover:border-blue-300 dark:hover:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300',
    activeColor: 'border-blue-500 bg-blue-100/70 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-400',
    getMessage: (debtorName, amountStr, tripName) => 
      `Chào ${debtorName}, tổng kết chuyến "${tripName}" bạn còn khoản ${amountStr} cần chuyển lại mình nhé. Thông tin chuyển khoản và mã VietQR bên dưới, cảm ơn bạn!`
  }
];

export default function SmartNudgeModal({
  isOpen,
  onClose,
  settlement,
  tripName,
  onNudgeSent
}) {
  const { showToast } = useToast();
  const { currentUser } = useAuth();

  const [selectedTone, setSelectedTone] = useState('gentle');
  const [customMessage, setCustomMessage] = useState('');
  const [sendingInApp, setSendingInApp] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [copiedKey, setCopiedKey] = useState(null);

  const debtor = settlement?.fromUser || {};
  const debtorName = debtor.displayName || 'Bạn';
  const amount = settlement?.amount || 0;
  const formattedAmount = formatVND(amount);
  const effectiveTripName = tripName || settlement?.tripName || 'Chuyến đi';

  // Bank Info (from creditor / recipient)
  const recipient = settlement?.toUser || currentUser || {};
  const bankName = (recipient.bankName || currentUser?.bankName || 'VCB').toUpperCase();
  const bankAccount = recipient.bankAccountNumber || currentUser?.bankAccountNumber || '';
  const bankHolder = recipient.bankAccountHolder || currentUser?.bankAccountHolder || recipient.displayName || currentUser?.displayName || '';
  const transferMessage = `Spliqo ${effectiveTripName}`.trim();

  const vietQrUrl = settlement?.vietQrUrl || (
    bankAccount ? `https://img.vietqr.io/image/${bankName}-${bankAccount}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferMessage)}&accountName=${encodeURIComponent(bankHolder)}` : null
  );

  // Initialize and update message whenever tone or settlement changes
  useEffect(() => {
    if (settlement) {
      const toneConfig = NUDGE_TONES.find(t => t.id === selectedTone) || NUDGE_TONES[0];
      setCustomMessage(toneConfig.getMessage(debtorName, formattedAmount, effectiveTripName));
    }
  }, [selectedTone, settlement, debtorName, formattedAmount, effectiveTripName]);

  // Handle anti-spam cooldown from settlement.lastNudgedAt
  useEffect(() => {
    if (settlement?.lastNudgedAt) {
      const elapsed = Math.floor((Date.now() - new Date(settlement.lastNudgedAt).getTime()) / 1000);
      if (elapsed < 20) {
        setCooldownSeconds(20 - elapsed);
      }
    }
  }, [settlement]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds(prev => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  if (!isOpen || !settlement) return null;

  // Switch tone
  const handleSelectTone = (toneId) => {
    setSelectedTone(toneId);
    const toneConfig = NUDGE_TONES.find(t => t.id === toneId);
    if (toneConfig) {
      setCustomMessage(toneConfig.getMessage(debtorName, formattedAmount, effectiveTripName));
    }
  };

  // Build full message for external sharing (Zalo, Telegram, SMS, Clipboard)
  const getFullShareText = () => {
    let text = `${customMessage}\n\n`;
    text += `💳 THÔNG TIN CHUYỂN KHOẢN:\n`;
    if (bankAccount) {
      text += `• Ngân hàng: ${bankName}\n`;
      text += `• Số tài khoản: ${bankAccount}\n`;
      text += `• Chủ tài khoản: ${bankHolder}\n`;
    }
    text += `• Số tiền: ${formattedAmount}\n`;
    text += `• Nội dung CK: ${transferMessage}\n`;
    if (vietQrUrl) {
      text += `\n📲 Quét mã VietQR chuyển khoản nhanh:\n${vietQrUrl}\n`;
    }
    text += `\n— Gửi từ Spliqo - Quản lý chi tiêu nhóm thông minh`;
    return text;
  };

  // 1. Send In-App Notification (Realtime SSE)
  const handleSendInApp = async () => {
    if (cooldownSeconds > 0) {
      showToast(`Vui lòng đợi ${cooldownSeconds}s trước khi gửi tiếp nhé!`, 'info');
      return;
    }

    try {
      setSendingInApp(true);
      const tripId = settlement.tripId;
      const settlementId = settlement.id;

      const res = await api.post(`/trips/${tripId}/settlements/${settlementId}/nudge`, {
        message: customMessage,
        tone: selectedTone
      });

      showToast(`Đã gửi lời nhắc chuyển khoản tới ${debtorName} trong ứng dụng!`, 'success');
      setCooldownSeconds(20);

      if (onNudgeSent && res?.settlement) {
        onNudgeSent(res.settlement);
      }
    } catch (err) {
      const errMsg = err?.response?.data?.error || err.message || 'Lỗi khi gửi thông báo nhắc nợ';
      showToast(errMsg, 'error');
    } finally {
      setSendingInApp(false);
    }
  };

  // 2. Share via Zalo
  const handleShareZalo = () => {
    const text = getFullShareText();
    navigator.clipboard.writeText(text);
    setCopiedKey('zalo');
    showToast(`Đã sao chép tin nhắn nhắc nợ! Hãy dán (Ctrl+V) vào Zalo với ${debtorName}.`, 'success');
    setTimeout(() => setCopiedKey(null), 2500);

    // Open Zalo web or protocol
    window.open('https://chat.zalo.me/', '_blank');
  };

  // 3. Share via Telegram
  const handleShareTelegram = () => {
    const text = getFullShareText();
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(vietQrUrl || window.location.origin)}&text=${encodeURIComponent(text)}`;
    window.open(telegramUrl, '_blank');
    showToast('Đang mở Telegram...', 'info');
  };

  // 4. Web Share API (Native mobile share: Messenger, SMS, AirDrop, etc.)
  const handleNativeShare = async () => {
    const text = getFullShareText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Nhắc chuyển khoản: ${effectiveTripName}`,
          text: text,
          url: vietQrUrl || window.location.href
        });
        showToast('Chia sẻ thành công!', 'success');
      } catch (err) {
        if (err.name !== 'AbortError') {
          showToast('Không thể chia sẻ qua ứng dụng này', 'error');
        }
      }
    } else {
      // Fallback: Copy to clipboard
      handleCopyText();
    }
  };

  // 5. Copy Text to Clipboard
  const handleCopyText = () => {
    const text = getFullShareText();
    navigator.clipboard.writeText(text);
    setCopiedKey('clipboard');
    showToast('Đã sao chép toàn bộ tin nhắn & mã VietQR vào bộ nhớ tạm!', 'success');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nhắc chuyển khoản nhẹ nhàng"
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            className="tactile-btn-pill px-4 py-2.5 justify-center border border-[#e6e4dc] dark:border-[#2e2e38] text-xs font-bold cursor-pointer"
          >
            Đóng
          </button>
          <button
            onClick={handleSendInApp}
            disabled={sendingInApp || cooldownSeconds > 0}
            className="flex-1 tactile-btn-dark py-2.5 px-4 justify-center text-xs sm:text-sm font-bold disabled:opacity-60 flex items-center gap-2 cursor-pointer shadow-sm transition-all"
          >
            {sendingInApp ? (
              <>
                <Clock className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Đang gửi thông báo...</span>
              </>
            ) : cooldownSeconds > 0 ? (
              <>
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Đã gửi • Đợi {cooldownSeconds}s</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-emerald-400" />
                <span>Gửi thông báo trong App</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-5 text-[#18181b] dark:text-zinc-100">
        {/* 1. Context Banner: Debtor Info & Amount */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#f4f3ec] dark:bg-[#1a1a20] border border-[#e6e4dc] dark:border-[#2e2e38] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={debtor.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${settlement.fromUserId}`}
              alt=""
              className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 object-cover border border-[#e6e4dc] dark:border-[#2e2e38]"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">Gửi lời nhắc tới:</span>
                <span className="font-bold text-sm text-[#18181b] dark:text-white">
                  {debtorName}
                </span>
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Chuyến đi: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{effectiveTripName}</span>
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Cần nhận</span>
            <span className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {formattedAmount}
            </span>
          </div>
        </div>

        {/* 2. Tone Selector */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Chọn phong cách nhắc nợ khéo léo</span>
          </label>
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            {NUDGE_TONES.map((tone) => {
              const isSelected = selectedTone === tone.id;
              return (
                <button
                  key={tone.id}
                  type="button"
                  onClick={() => handleSelectTone(tone.id)}
                  className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    isSelected
                      ? tone.activeColor
                      : `border-[#e6e4dc] dark:border-[#2e2e38] ${tone.color}`
                  }`}
                >
                  <span className="text-lg sm:text-xl shrink-0">{tone.icon}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold leading-tight truncate">
                      {tone.label}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Editable Message Box */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-zinc-500" />
              <span>Nội dung lời nhắn (Có thể chỉnh sửa)</span>
            </label>
            <span className="text-[11px] text-zinc-400">
              {customMessage.length} ký tự
            </span>
          </div>
          <textarea
            rows={3}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="w-full text-xs sm:text-sm p-3 rounded-2xl border border-[#dedbd0] dark:border-[#2e2e38] bg-white dark:bg-[#18181f] text-[#18181b] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#18181b] dark:focus:ring-white transition-all resize-none shadow-inner"
            placeholder="Nhập lời nhắn nhắc nợ vui vẻ..."
          />
        </div>

        {/* 4. Payment Info Preview with VietQR */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#edebe4]/70 dark:bg-[#1f1f28] border border-[#e6e4dc] dark:border-[#2e2e38] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-zinc-500" />
              <span>Thông tin chuyển khoản đính kèm</span>
            </span>
            {vietQrUrl && (
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <QrCode className="w-3 h-3" /> Mã VietQR sẵn sàng
              </span>
            )}
          </div>

          {bankAccount ? (
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="font-mono font-bold text-[#18181b] dark:text-white">
                  {bankAccount} <span className="font-sans font-semibold text-zinc-500">({bankName})</span>
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase font-medium">
                  {bankHolder}
                </div>
              </div>

              {vietQrUrl && (
                <img
                  src={vietQrUrl}
                  alt="VietQR Preview"
                  className="w-14 h-14 rounded-xl border border-white dark:border-zinc-700 shadow-xs bg-white shrink-0 object-contain p-0.5"
                />
              )}
            </div>
          ) : (
            <div className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Bạn chưa cập nhật tài khoản ngân hàng. Hãy cập nhật trong Hồ sơ để tạo mã VietQR tự động.</span>
            </div>
          )}
        </div>


        {/* 6. External Share Channels: Zalo, Telegram, Web Share, Copy */}
        <div className="space-y-2 pt-2 border-t border-[#e6e4dc] dark:border-[#2e2e38]">
          <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
            Hoặc gửi thẳng qua mạng xã hội
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Zalo Button */}
            <button
              onClick={handleShareZalo}
              className="p-2.5 rounded-2xl border border-[#dedbd0] dark:border-[#2e2e38] bg-white dark:bg-[#1a1a20] hover:bg-blue-50 dark:hover:bg-blue-950/20 text-[#18181b] dark:text-white flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-xs hover:border-blue-400"
              title="Sao chép tin nhắn và mở Zalo"
            >
              <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                Z
              </div>
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                {copiedKey === 'zalo' ? 'Đã chép!' : 'Qua Zalo'}
              </span>
            </button>

            {/* Telegram Button */}
            <button
              onClick={handleShareTelegram}
              className="p-2.5 rounded-2xl border border-[#dedbd0] dark:border-[#2e2e38] bg-white dark:bg-[#1a1a20] hover:bg-sky-50 dark:hover:bg-sky-950/20 text-[#18181b] dark:text-white flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-xs hover:border-sky-400"
              title="Mở Telegram chia sẻ"
            >
              <div className="w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                ✈️
              </div>
              <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400">
                Telegram
              </span>
            </button>

            {/* Native Mobile Share */}
            <button
              onClick={handleNativeShare}
              className="p-2.5 rounded-2xl border border-[#dedbd0] dark:border-[#2e2e38] bg-white dark:bg-[#1a1a20] hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-[#18181b] dark:text-white flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-xs hover:border-emerald-400"
              title="Chia sẻ qua Messenger, Tin nhắn SMS, AirDrop..."
            >
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Share2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                Chia sẻ khác
              </span>
            </button>

            {/* Copy Full Message */}
            <button
              onClick={handleCopyText}
              className="p-2.5 rounded-2xl border border-[#dedbd0] dark:border-[#2e2e38] bg-white dark:bg-[#1a1a20] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[#18181b] dark:text-white flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
              title="Sao chép toàn bộ tin nhắn & mã VietQR"
            >
              <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center justify-center shadow-xs">
                {copiedKey === 'clipboard' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </div>
              <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                {copiedKey === 'clipboard' ? 'Đã chép!' : 'Chép tin nhắn'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
