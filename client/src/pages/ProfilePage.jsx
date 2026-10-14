import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
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
  ExternalLink,
  Globe,
  Check,
  Palette,
  RefreshCw
} from 'lucide-react';
import AvatarPickerModal from '../components/AvatarPickerModal';
import { auth } from '../firebase/config';

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
  const { language, setLanguage, t } = useLanguage();

  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [bankName, setBankName] = useState('VCB');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [paymentQrUrl, setPaymentQrUrl] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const isUidLike = currentUser.displayName && (
        currentUser.displayName === currentUser.uid ||
        currentUser.displayName === currentUser.uid?.toUpperCase() ||
        (currentUser.uid && currentUser.displayName.includes(currentUser.uid))
      );

      const effectiveName = !isUidLike && currentUser.displayName
        ? currentUser.displayName
        : (auth?.currentUser?.displayName || currentUser.displayName || '');

      setDisplayName(effectiveName);
      setPhone(currentUser.phone || '');
      setBankName(currentUser.bankName || 'VCB');
      setBankAccountNumber(currentUser.bankAccountNumber || '');
      setBankAccountHolder(currentUser.bankAccountHolder || '');
      setPaymentQrUrl(currentUser.paymentQrUrl || '');
      const userPhoto = (currentUser.photoURL && !currentUser.photoURL.includes('googleusercontent.com'))
        ? currentUser.photoURL
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid || 'Felix'}`;
      setPhotoURL(userPhoto);
    }
  }, [currentUser]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const emailToSave = currentUser?.email && !currentUser.email.includes('@spliqo.local')
        ? currentUser.email
        : (auth?.currentUser?.email || '');

      await updateUserProfile({
        displayName,
        email: emailToSave || undefined,
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
    ? `https://img.vietqr.io/image/${cleanBank}-${cleanAcc}-compact2.png?amount=100000&addInfo=Spliqo%20Test&accountName=${encodeURIComponent(cleanHolder)}`
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in text-[#18181b]">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18181b] dark:text-white flex items-center gap-2.5">
          <User className="w-6 h-6 text-[#18181b] dark:text-white shrink-0" />
          <span>{t('profileTitle', 'Hồ sơ cá nhân & Tài khoản thanh toán')}</span>
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          {t('profileSubtitle', 'Quản lý thông tin và tài khoản ngân hàng để nhận tiền chia sẻ chi phí tự động qua VietQR')}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Details Card */}
        <div className="tactile-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 border-b border-[#e6e4dc] dark:border-[#2e2e38] pb-4">
            <div className="w-8 h-8 rounded-full bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] flex items-center justify-center shadow-xs">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[#18181b] dark:text-white">{t('basicInfo', 'Thông tin cơ bản')}</h3>
          </div>

          {/* Avatar Studio Section */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-[#e6e4dc] dark:border-[#2e2e38]">
            {/* Avatar circle with click to open picker */}
            <div className="relative group shrink-0">
              <div 
                onClick={() => setAvatarModalOpen(true)}
                className="cursor-pointer relative"
                title="Bấm để mở Kho Avatar"
              >
                <img
                  src={photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.uid}`}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full bg-[#f4f3ec] dark:bg-[#252530] object-cover ring-4 ring-[#e6e4dc] dark:ring-[#32323e] group-hover:ring-amber-500/70 transition-all shadow-md group-hover:scale-105"
                />
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity text-[10px] font-bold">
                  <Palette className="w-5 h-5 mb-0.5" />
                  <span>Đổi Avatar</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAvatarModalOpen(true)}
                className="absolute -bottom-1 -right-1 p-2 rounded-full bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] hover:bg-black dark:hover:bg-zinc-200 shadow-md transition-all text-xs hover:scale-110 cursor-pointer"
                title="Kho Avatar"
              >
                <Palette className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Avatar controls & Quick Presets */}
            <div className="flex-1 space-y-2.5 text-center sm:text-left w-full">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setAvatarModalOpen(true)}
                  className="tactile-btn-dark py-2 px-3.5 text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kho Avatar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const pool = ['Felix', 'Aneka', 'Alexander', 'Molly', 'Jack', 'Sophie', 'Oliver', 'Mia', 'Ninja', 'Mochi', 'Gamer', 'Sunny', 'Boba', 'Ethan', 'Chloe', 'Noah', 'Rocker', 'Pixel'];
                    const random = pool[Math.floor(Math.random() * pool.length)];
                    const uniqueSeed = `${random}_${Math.floor(Math.random() * 899 + 100)}`;
                    setPhotoURL(`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(uniqueSeed)}`);
                  }}
                  className="tactile-btn-pill py-2 px-3 text-xs flex items-center gap-1.5 font-bold cursor-pointer"
                  title="Đổi Avatar ngẫu nhiên ngay"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Ngẫu nhiên 🎲</span>
                </button>
              </div>

              {/* Quick 1-click Preset avatars */}
              <div className="pt-1">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block mb-1.5">
                  Gợi ý mẫu phổ biến (chọn nhanh 1 chạm):
                </span>
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  {['Felix', 'Aneka', 'Alexander', 'Molly', 'Jack', 'Sophie', 'Ninja', 'Mochi'].map((seed) => {
                    const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
                    const isSelected = photoURL.includes(`seed=${seed}`) || photoURL.includes(`seed=${encodeURIComponent(seed)}`);

                    return (
                      <button
                        key={seed}
                        type="button"
                        onClick={() => setPhotoURL(url)}
                        className={`relative p-0.5 rounded-full transition-all cursor-pointer ${
                          isSelected
                            ? 'ring-2 ring-amber-500 scale-110 shadow-xs'
                            : 'opacity-70 hover:opacity-100 hover:scale-105'
                        }`}
                        title={`Chọn mẫu ${seed}`}
                      >
                        <img
                          src={url}
                          alt={seed}
                          className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                ✨ Chọn trực tiếp từ <strong>Kho Avatar</strong>, không cần tải ảnh cá nhân lên máy chủ.
              </p>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">{t('fullNameRequired', 'Họ và tên *')}</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#f4f3ec] dark:bg-[#212129] border border-[#e6e4dc] dark:border-[#32323e] text-sm font-semibold text-[#18181b] dark:text-white outline-none focus:border-zinc-900 dark:focus:border-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
              <input
                type="email"
                disabled
                value={
                  currentUser?.email && !currentUser.email.includes('@spliqo.local')
                    ? currentUser.email
                    : (auth?.currentUser?.email || currentUser?.email || '')
                }
                className="w-full px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-[#e6e4dc] dark:border-[#32323e] text-zinc-500 dark:text-zinc-400 text-sm font-semibold outline-none cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">{t('phoneNumber', 'Số điện thoại')}</label>
              <input
                type="tel"
                placeholder="0901234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#f4f3ec] dark:bg-[#212129] border border-[#e6e4dc] dark:border-[#32323e] text-sm font-semibold text-[#18181b] dark:text-white outline-none focus:border-zinc-900 dark:focus:border-white transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Bank & VietQR Payment Information Card */}
        <div className="tactile-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-[#e6e4dc] dark:border-[#2e2e38] pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] flex items-center justify-center shadow-xs">
                <Building className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#18181b] dark:text-white">{t('bankInfoVietQR', 'Thông tin tài khoản ngân hàng (VietQR)')}</h3>
            </div>
            <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
              {t('autoGenerateVietQR', 'Tự động tạo VietQR')}
            </span>
          </div>

          <p className="text-xs text-zinc-500">
            {t('bankInfoDesc', 'Khi các thành viên khác nợ tiền bạn trong chuyến đi, hệ thống Spliqo sẽ tự động sinh mã VietQR dựa trên thông tin này để họ quét mã chuyển khoản ngay tức thì.')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">{t('receivingBankRequired', 'Ngân hàng nhận tiền *')}</label>
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
                <label className="block text-xs font-bold text-zinc-700 mb-1">{t('bankAccountNumberRequired', 'Số tài khoản ngân hàng *')}</label>
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
                <label className="block text-xs font-bold text-zinc-700 mb-1">{t('accountHolderNameRequired', 'Tên chủ tài khoản *')}</label>
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
                {t('previewYourVietQR', 'XEM TRƯỚC MÃ VIETQR CỦA BẠN')}
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
                  <span>{t('previewQrPlaceholder', 'Nhập số tài khoản để xem trước mã QR chuyển khoản tự động.')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Language Settings Card */}
        <div className="tactile-card p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#e6e4dc] pb-4">
            <div className="w-8 h-8 rounded-full bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] flex items-center justify-center shadow-xs">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#18181b]">{t('languageSettings', 'Cài đặt ngôn ngữ (Language Settings)')}</h3>
              <p className="text-xs text-zinc-500 mt-0.5">{t('languageSettingsDesc', 'Chọn ngôn ngữ hiển thị cho giao diện người dùng ứng dụng Spliqo')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setLanguage('vi');
                showToast('Đã đổi ngôn ngữ sang Tiếng Việt', 'success');
              }}
              className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                language === 'vi'
                  ? 'bg-purple-50/60 dark:bg-purple-950/20 border-purple-500 text-purple-900 dark:text-purple-300 shadow-xs ring-1 ring-purple-500/30'
                  : 'bg-[#f4f3ec] dark:bg-[#212129] border-[#e6e4dc] dark:border-[#32323e] text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🇻🇳</span>
                <div>
                  <div className="font-bold text-sm">Tiếng Việt</div>
                  <div className="text-[11px] text-zinc-500">{t('defaultLanguage', 'Ngôn ngữ mặc định')}</div>
                </div>
              </div>
              {language === 'vi' && (
                <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setLanguage('en');
                showToast('Language switched to English', 'success');
              }}
              className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-purple-50/60 dark:bg-purple-950/20 border-purple-500 text-purple-900 dark:text-purple-300 shadow-xs ring-1 ring-purple-500/30'
                  : 'bg-[#f4f3ec] dark:bg-[#212129] border-[#e6e4dc] dark:border-[#32323e] text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🇬🇧</span>
                <div>
                  <div className="font-bold text-sm">English</div>
                  <div className="text-[11px] text-zinc-500">United States / Global</div>
                </div>
              </div>
              {language === 'en' && (
                <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </button>
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
            {t('saveProfileBtn', 'Lưu thay đổi hồ sơ')}
          </button>
        </div>

        {/* Avatar Picker Modal */}
        <AvatarPickerModal
          isOpen={avatarModalOpen}
          onClose={() => setAvatarModalOpen(false)}
          currentPhotoURL={photoURL}
          onSelectAvatar={(url) => setPhotoURL(url)}
        />
      </form>
    </div>
  );
}
