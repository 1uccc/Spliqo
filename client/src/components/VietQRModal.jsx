import React, { useState } from 'react';
import Modal from './Modal';
import { formatVND } from '../services/calculation';
import { Copy, Check, QrCode, Building, CreditCard, User, ExternalLink, Loader2, Clock } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

export default function VietQRModal({
  isOpen,
  onClose,
  settlement,
  tripName,
  onMarkAsPaid,
  onConfirmPayment,
  onPaymentSuccess,
  isPayer
}) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const { currentUser } = useAuth();

  if (!settlement) return null;

  const currentUid = String(currentUser?.uid || currentUser?.id || '');
  const fromUid = String(settlement.fromUserId || settlement.fromUser?.id || settlement.fromUser?.uid || '');
  const toUid = String(settlement.toUserId || settlement.toUser?.id || settlement.toUser?.uid || '');

  const isUserPayer = Boolean((currentUid && fromUid && currentUid === fromUid) || isPayer);
  const isUserReceiver = Boolean(currentUid && toUid && currentUid === toUid);

  const recipient = settlement.toUser || {};
  const amount = settlement.amount || 0;
  const transferMessage = `Spliqo ${tripName || settlement.tripName || ''}`.trim();

  // If VietQR URL not provided or generated, build standard one
  const cleanBank = (recipient.bankName || 'VCB').toUpperCase();
  const cleanAcc = recipient.bankAccountNumber || '';
  const holderName = recipient.bankAccountHolder || recipient.displayName || '';

  const qrUrl = settlement.vietQrUrl || (
    cleanAcc ? `https://img.vietqr.io/image/${cleanBank}-${cleanAcc}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferMessage)}&accountName=${encodeURIComponent(holderName)}` : null
  );

  const handleCopyAccount = () => {
    if (!cleanAcc) return;
    navigator.clipboard.writeText(cleanAcc);
    setCopied(true);
    showToast('Đã sao chép số tài khoản vào clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkPaid = async () => {
    try {
      setLoading(true);
      if (onMarkAsPaid) {
        await onMarkAsPaid(settlement);
      }
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
      showToast('Đã xác nhận đã chuyển tiền! Đang chờ người nhận xác nhận.', 'success');
      onClose();
    } catch (err) {
      showToast(err.message || 'Lỗi khi cập nhật thanh toán', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPaid = async () => {
    try {
      setLoading(true);
      if (onConfirmPayment) {
        await onConfirmPayment(settlement);
      }
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
      showToast('Xác nhận nhận tiền thành công! Giao dịch đã được tất toán.', 'success');
      onClose();
    } catch (err) {
      showToast(err.message || 'Lỗi khi xác nhận thanh toán', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isPaid = settlement.status === 'PAID';
  const isConfirmed = settlement.status === 'CONFIRMED';
  const isPending = !isPaid && !isConfirmed;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Thanh toán cho ${recipient.displayName || 'thành viên'}`} maxWidth="max-w-md">
      <div className="space-y-5 text-[#18181b] dark:text-zinc-100">
        {/* Amount Banner */}
        <div className="p-4 rounded-2xl bg-[#f4f3ec] dark:bg-[#1a1a20] border border-[#e6e4dc] dark:border-[#2e2e38] text-center">
          <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Số tiền cần chuyển</span>
          <div className="text-3xl font-extrabold text-[#18181b] dark:text-white tracking-tight mt-1">
            {formatVND(amount)}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 flex items-center justify-center gap-1.5 flex-wrap">
            <span>Nội dung:</span>
            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-[#252530] px-2.5 py-0.5 rounded-full border border-[#e6e4dc] dark:border-[#2e2e38]">
              {transferMessage}
            </span>
          </div>
        </div>

        {/* VietQR Code Display */}
        {qrUrl ? (
          <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-[#1a1a20] rounded-2xl border border-[#e6e4dc] dark:border-[#2e2e38] shadow-sm">
            <div className="relative group">
              <img
                src={qrUrl}
                alt="VietQR Chuyển khoản"
                className="w-56 h-auto object-contain rounded-xl shadow-xs"
              />
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2.5 flex items-center gap-1.5 font-medium">
              <QrCode className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
              Mở App ngân hàng quét mã QR để chuyển tiền chính xác
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs">
            Người nhận chưa cung cấp số tài khoản ngân hàng để tạo mã QR tự động. Vui lòng liên hệ trực tiếp.
          </div>
        )}

        {/* Bank Details Table */}
        <div className="bg-[#f4f3ec] dark:bg-[#1a1a20] rounded-2xl p-4 border border-[#e6e4dc] dark:border-[#2e2e38] space-y-2.5 text-xs sm:text-sm">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-zinc-400" />
              Ngân hàng:
            </span>
            <span className="font-bold text-zinc-900 dark:text-white">{cleanBank || 'Chưa cập nhật'}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-zinc-400" />
              Số tài khoản:
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-zinc-900 dark:text-white">{cleanAcc || 'Chưa cập nhật'}</span>
              {cleanAcc && (
                <button
                  onClick={handleCopyAccount}
                  className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
                  title="Sao chép số tài khoản"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <User className="w-4 h-4 text-zinc-400" />
              Chủ tài khoản:
            </span>
            <span className="font-bold text-zinc-900 dark:text-white">{holderName || 'Chưa cập nhật'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2">
          {cleanAcc && (
            <button
              onClick={handleCopyAccount}
              className="tactile-btn-pill w-full py-2.5 justify-center border border-[#e6e4dc] dark:border-[#2e2e38] text-xs font-bold"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Đã sao chép số tài khoản' : 'Sao chép số tài khoản'}</span>
            </button>
          )}

          {/* NÚT XÁC NHẬN ĐÃ CHUYỂN - Chỉ hiển thị cho người nợ tiền (isUserPayer) */}
          {isPending && isUserPayer && (
            <button
              onClick={handleMarkPaid}
              disabled={loading}
              className="tactile-btn-dark w-full py-3 justify-center text-xs font-bold disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-emerald-400" />}
              <span>Xác nhận đã chuyển</span>
            </button>
          )}

          {/* ĐÃ CHUYỂN - CHỜ DUYỆT */}
          {isPaid && (
            <div className="space-y-2">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 text-center text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Đã gửi thông báo chuyển tiền • Đang chờ người nhận duyệt</span>
              </div>

              {/* Chỉ người nhận tiền (isUserReceiver) mới có nút duyệt */}
              {onConfirmPayment && isUserReceiver && (
                <button
                  onClick={handleConfirmPaid}
                  disabled={loading}
                  className="tactile-btn-dark w-full py-3 justify-center text-xs font-bold disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-emerald-400" />}
                  <span>Xác nhận đã nhận tiền</span>
                </button>
              )}
            </div>
          )}

          {/* Nếu là người nhận và người nợ đã đưa tiền mặt / thanh toán trực tiếp */}
          {isPending && isUserReceiver && onConfirmPayment && (
            <button
              onClick={handleConfirmPaid}
              disabled={loading}
              className="tactile-btn-pill w-full py-2.5 justify-center text-xs font-bold border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-emerald-500" />}
              <span>Đã nhận tiền (Xác nhận tất toán)</span>
            </button>
          )}

          {/* ĐÃ TẤT TOÁN */}
          {isConfirmed && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Giao dịch đã tất toán thành công</span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

