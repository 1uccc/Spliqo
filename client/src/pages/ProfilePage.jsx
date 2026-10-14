import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  CreditCard, 
  QrCode, 
  Save, 
  Loader2, 
  Camera, 
  CheckCircle2, 
  Sparkles,
  ExternalLink 
} from 'lucide-react';

// Common Vietnamese Banks list
const VIETNAM_BANKS = [
  { code: 'VCB', name: 'Vietcombank (Ngoại Thương Việt Nam)' },
  { code: 'MB', name: 'MB Bank (Quân Đội)' },
  { code: 'TCB', name: 'Techcombank (Kỹ Thương Việt Nam)' },
  { code: 'ACB', name: 'ACB (Á Châu)' },
  { code: 'VPB', name: 'VPBank (Việt Nam Thịnh Vượng)' },
  { code: 'BIDV', name: 'BIDV (Đầu tư và Phát triển Việt Nam)' },
  { code: 'CTG', name: 'VietinBank (Công Thương Việt Nam)' },
  { code: 'TPB', name: 'TPBank (Tiên Phong)' },
  { code: 'HDB', name: 'HDBank (Phát triển TP.HCM)' },
  { code: 'STB', name: 'Sacombank (Sài Gòn Thương Tín)' },
  { code: 'VIB', name: 'VIB (Quốc Tế Việt Nam)' },
];

export default function ProfilePage() {
  const { currentUser, updateUserProfile } = useAuth();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [bankName, setBankName] = useState('VCB');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [paymentQrUrl, setPaymentQrUrl] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      setPhone(currentUser.phone || '');
      setBankName(currentUser.bankName || 'VCB');
      setBankAccountNumber(currentUser.bankAccountNumber || '');
      setBankAccountHolder(currentUser.bankAccountHolder || '');
      setPaymentQrUrl(currentUser.paymentQrUrl || '');
      setPhotoURL(currentUser.photoURL || '');
    }
  }, [currentUser]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateUserProfile({
        displayName,
        phone,
        bankName,
        bankAccountNumber,
        bankAccountHolder: bankAccountHolder.toUpperCase(),
        paymentQrUrl,
        photoURL,
      });
      showToast('Cập nhật hồ sơ và thông tin thanh toán thành công!', 'success');
    } catch (err) {
      showToast(err.message || 'Lỗi khi cập nhật hồ sơ', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Preview live VietQR
  const cleanBank = bankName.trim().toUpperCase();
  const cleanAcc = bankAccountNumber.trim();
  const cleanHolder = bankAccountHolder.trim().toUpperCase();
  const liveVietQr = cleanAcc
    ? `https://img.vietqr.io/image/${cleanBank}-${cleanAcc}-compact2.png?amount=100000&addInfo=SplitMate%20Test&accountName=${encodeURIComponent(cleanHolder)}`
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in text-[#18181b]">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#18181b]">
          Hồ sơ cá nhân & Tài khoản thanh toán
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Quản lý thông tin và tài khoản ngân hàng để nhận tiền chia sẻ chi phí tự động qua VietQR
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Details Card */}
        <div className="tactile-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 border-b border-[#e6e4dc] pb-4">
            <div className="w-8 h-8 rounded-full bg-[#18181b] text-white flex items-center justify-center shadow-xs">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[#18181b]">Thông tin cơ bản</h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <img
                src={photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.uid}`}
                alt="Avatar"
                className="w-24 h-24 rounded-full bg-[#f4f3ec] object-cover ring-2 ring-[#e6e4dc] shadow-sm"
              />
              <button
                type="button"
                onClick={() => {
                  const seed = prompt('Nhập tên hoặc chữ cái để đổi Avatar mới:', displayName || 'NewSeed');
                  if (seed) {
                    setPhotoURL(`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`);
                  }
                }}
                className="absolute -bottom-1 -right-1 p-2 rounded-full bg-[#18181b] text-white hover:bg-black shadow-md transition-all text-xs hover:scale-105"
                title="Đổi Avatar ngẫu nhiên"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#f4f3ec] border border-[#e6e4dc] text-sm font-semibold text-[#18181b] outline-none focus:border-zinc-900 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Email</label>
                <input
                  type="email"
                  disabled
                  value={currentUser?.email || ''}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-100 border border-[#e6e4dc] text-zinc-500 text-sm font-semibold outline-none cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  placeholder="0901234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#f4f3ec] border border-[#e6e4dc] text-sm font-semibold text-[#18181b] outline-none focus:border-zinc-900 focus:bg-white transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bank & VietQR Payment Information Card */}
        <div className="tactile-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-[#e6e4dc] pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#18181b] text-white flex items-center justify-center shadow-xs">
                <Building className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#18181b]">Thông tin tài khoản ngân hàng (VietQR)</h3>
            </div>
            <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
              Tự động tạo VietQR
            </span>
          </div>

          <p className="text-xs text-zinc-500">
            Khi các thành viên khác nợ tiền bạn trong chuyến đi, hệ thống SplitMate sẽ tự động sinh mã VietQR dựa trên thông tin này để họ quét mã chuyển khoản ngay tức thì.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Ngân hàng nhận tiền *</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#f4f3ec] border border-[#e6e4dc] text-sm font-semibold text-[#18181b] outline-none focus:border-zinc-900 focus:bg-white transition-colors"
                >
                  {VIETNAM_BANKS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.code} - {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Số tài khoản ngân hàng *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 0071001234567"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#f4f3ec] border border-[#e6e4dc] text-sm font-mono font-bold text-[#18181b] outline-none focus:border-zinc-900 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Tên chủ tài khoản *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: NGUYEN VAN A"
                  value={bankAccountHolder}
                  onChange={(e) => setBankAccountHolder(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#f4f3ec] border border-[#e6e4dc] text-sm font-mono font-bold text-[#18181b] uppercase outline-none focus:border-zinc-900 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Live VietQR Preview */}
            <div className="flex flex-col items-center justify-center p-6 rounded-3xl text-center bg-[#f4f3ec] border border-[#e6e4dc]">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-3">
                Xem trước mã VietQR của bạn
              </span>

              {liveVietQr ? (
                <div className="bg-white p-4 rounded-2xl border border-[#e6e4dc] shadow-sm">
                  <img
                    src={liveVietQr}
                    alt="VietQR Preview"
                    className="w-44 h-auto object-contain rounded-xl"
                  />
                  <div className="text-[11px] font-bold text-[#18181b] mt-2">
                    {cleanBank} • {cleanAcc}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    {cleanHolder}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-xs text-zinc-400 flex flex-col items-center gap-2">
                  <QrCode className="w-10 h-10 text-zinc-300" />
                  <span>Nhập số tài khoản để xem trước mã QR chuyển khoản tự động.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="tactile-btn-dark py-3 px-6 text-xs sm:text-sm font-bold shadow-md disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu thay đổi hồ sơ
          </button>
        </div>
      </form>
    </div>
  );
}
