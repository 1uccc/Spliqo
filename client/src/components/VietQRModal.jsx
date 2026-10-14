import React, { useState } from 'react';
import Modal from './Modal';
import { formatVND } from '../services/calculation';
import { Copy, Check, QrCode, Building, CreditCard, User, ExternalLink, Loader2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export default function VietQRModal({ isOpen, onClose, settlement, tripName, onMarkAsPaid, isPayer }) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  if (!settlement) return null;

  const recipient = settlement.toUser || {};
  const amount = settlement.amount || 0;
  const transferMessage = `SplitMate ${tripName || ''}`.trim();

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
      await onMarkAsPaid(settlement);
      showToast('Đã đánh dấu đã thanh toán! Đang chờ người nhận xác nhận.', 'success');
      onClose();
    } catch (err) {
      showToast(err.message || 'Lỗi khi cập nhật thanh toán', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Thanh toán cho ${recipient.displayName || 'thành viên'}`} maxWidth="max-w-md">
      <div className="space-y-5">
        {/* Amount Banner */}
        <div className="p-4 rounded-2xl bg-[#f4f3ec] border border-[#e6e4dc] text-center">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Số tiền cần chuyển</span>
          <div className="text-3xl font-extrabold text-[#18181b] tracking-tight mt-1">
            {formatVND(amount)}
          </div>
          <div className="text-xs text-zinc-500 mt-1.5">
            Nội dung: <span className="font-mono font-bold text-zinc-900 bg-white px-2.5 py-0.5 rounded-full border border-[#e6e4dc]">{transferMessage}</span>
          </div>
        </div>

        {/* VietQR Code Display */}
        {qrUrl ? (
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-[#e6e4dc] shadow-sm">
            <div className="relative group">
              <img
                src={qrUrl}
                alt="VietQR Chuyển khoản"
                className="w-56 h-auto object-contain rounded-xl shadow-xs"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-2.5 flex items-center gap-1.5 font-medium">
              <QrCode className="w-3.5 h-3.5 text-zinc-700" />
              Mở App ngân hàng quét mã QR để chuyển tiền chính xác
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            Người nhận chưa cung cấp số tài khoản ngân hàng để tạo mã QR tự động. Vui lòng liên hệ trực tiếp.
          </div>
        )}

        {/* Bank Details Table */}
        <div className="bg-[#f4f3ec] rounded-2xl p-4 border border-[#e6e4dc] space-y-2.5 text-xs sm:text-sm">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-zinc-400" />
              Ngân hàng:
            </span>
            <span className="font-bold text-zinc-900">{cleanBank || 'Chưa cập nhật'}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-500 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-zinc-400" />
              Số tài khoản:
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-zinc-900">{cleanAcc || 'Chưa cập nhật'}</span>
              {cleanAcc && (
                <button
                  onClick={handleCopyAccount}
                  className="p-1 rounded-full hover:bg-zinc-200 text-zinc-600 transition-colors"
                  title="Sao chép số tài khoản"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-500 flex items-center gap-1.5">
              <User className="w-4 h-4 text-zinc-400" />
              Chủ tài khoản:
            </span>
            <span className="font-bold text-zinc-900">{holderName || 'Chưa cập nhật'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2">
          {cleanAcc && (
            <button
              onClick={handleCopyAccount}
              className="tactile-btn-pill w-full py-2.5 justify-center border border-[#e6e4dc] text-xs font-bold"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Đã sao chép số tài khoản' : 'Sao chép số tài khoản'}
            </button>
          )}

          {isPayer && settlement.status === 'PENDING' && (
            <button
              onClick={handleMarkPaid}
              disabled={loading}
              className="tactile-btn-dark w-full py-3 justify-center text-xs font-bold disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-emerald-400" />}
              Đã chuyển tiền (Mark as Paid)
            </button>
          )}

          {settlement.status === 'PAID' && (
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-center text-xs font-semibold text-amber-800">
              Đã đánh dấu đã thanh toán. Đang chờ người nhận kiểm tra và xác nhận.
            </div>
          )}

          {settlement.status === 'CONFIRMED' && (
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4" />
              Đã xác nhận thanh toán thành công
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
