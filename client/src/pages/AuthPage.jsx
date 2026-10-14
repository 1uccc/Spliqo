import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Flame,
  Mail,
  Lock,
  User,
  ArrowRight,
  Sun,
  Moon,
  ArrowLeft,
  Loader2,
  Sparkles
} from 'lucide-react';

export default function AuthPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirectTarget = searchParams.get('redirect') || sessionStorage.getItem('spliqo_redirect') || '/dashboard';

  const [isRegister, setIsRegister] = useState(searchParams.get('register') === '1');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { loginWithEmail, registerWithEmail, loginWithGoogle, resetPassword } = useAuth();
  const { showToast } = useToast();
  const { isDark, setDarkMode } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handlePostAuthRedirect = () => {
    sessionStorage.removeItem('spliqo_redirect');
    navigate(redirectTarget);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isForgotPassword) {
        if (!email) throw new Error('Vui lòng nhập email.');
        await resetPassword(email);
        showToast('Đã gửi email khôi phục mật khẩu. Vui lòng kiểm tra hộp thư.', 'success');
        setIsForgotPassword(false);
        setSubmitting(false);
        return;
      }

      if (isRegister) {
        if (!displayName) throw new Error('Vui lòng nhập họ và tên.');
        if (!email) throw new Error('Vui lòng nhập email.');
        if (password.length < 6) throw new Error('Mật khẩu phải có ít nhất 6 ký tự.');
        if (password !== confirmPassword) throw new Error('Mật khẩu xác nhận không khớp.');

        await registerWithEmail(email, password, displayName);
        showToast('Đăng ký tài khoản thành công! Chào mừng bạn đến với Spliqo.', 'success');
      } else {
        if (!email || !password) throw new Error('Vui lòng điền đầy đủ email và mật khẩu.');
        await loginWithEmail(email, password);
        showToast('Đăng nhập thành công!', 'success');
      }
      handlePostAuthRedirect();
    } catch (err) {
      showToast(err.message || 'Lỗi thao tác xác thực', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setSubmitting(true);
      await loginWithGoogle();
      showToast('Đăng nhập với Google thành công!', 'success');
      handlePostAuthRedirect();
    } catch (err) {
      showToast(err.message || 'Lỗi đăng nhập Google', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#f4f3ec] dark:bg-[#212129] border border-[#e6e4dc] dark:border-[#32323e] text-xs sm:text-sm text-[#18181b] dark:text-white outline-none focus:border-zinc-900 dark:focus:border-white focus:bg-white dark:focus:bg-[#1a1a20] transition-all placeholder:text-zinc-400";

  return (
    <div className="min-h-screen w-full bg-[#f4f3ec] dark:bg-[#0f0f12] text-[#18181b] dark:text-[#f4f4f5] flex flex-col items-center justify-center p-4 relative select-none transition-colors">

      {/* Top Right: Language Selector (VI / EN) */}
      <div className="fixed top-4 right-4 z-30 flex items-center p-0.5 rounded-full bg-white dark:bg-[#24242b] border border-[#dedbd0] dark:border-[#32323c] text-xs shadow-xs">
        <button
          type="button"
          onClick={() => setLanguage('vi')}
          className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${language === 'vi'
              ? 'bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] shadow-xs'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
        >
          VI
        </button>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${language === 'en'
              ? 'bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] shadow-xs'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
        >
          EN
        </button>
      </div>

      {/* Bottom Left: Vertical Light / Dark Mode Toggle */}
      <div className="fixed bottom-4 left-4 sm:bottom-5 sm:left-5 z-30 flex flex-col items-center p-1 rounded-full bg-white dark:bg-[#24242b] border border-[#dedbd0] dark:border-[#32323c] shadow-xs gap-1">
        <button
          type="button"
          onClick={() => setDarkMode(true)}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${isDark ? 'bg-[#34343f] text-white font-bold shadow-xs' : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          title="Dark Mode"
        >
          <Moon className="w-3.5 h-3.5 stroke-[2.2]" />
        </button>
        <button
          type="button"
          onClick={() => setDarkMode(false)}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${!isDark ? 'bg-[#edebe4] text-zinc-900 font-bold shadow-xs' : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          title="Light Mode"
        >
          <Sun className="w-3.5 h-3.5 stroke-[2.2]" />
        </button>
      </div>

      {/* Main Tactile Bento Container */}
      <div className="w-full max-w-md relative z-10 animate-fade-in my-6">

        {/* Outer Tactile Shell */}
        <div className="bg-[#edebe4] dark:bg-[#15151a] rounded-4xl border border-[#dedbd0] dark:border-[#272730] p-4 sm:p-5 shadow-xl">

          {/* Inner Card */}
          <div className="bg-white dark:bg-[#1a1a20] rounded-3xl p-6 sm:p-7 border border-[#e6e4dc] dark:border-[#2e2e38] shadow-xs">

            {/* Brand Logo & Title */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] rounded-full mx-auto flex items-center justify-center shadow-md mb-3 hover:scale-105 active:scale-95 transition-all">
                <Flame className="w-7 h-7 text-amber-400 fill-amber-400" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-[#18181b] dark:text-white">
                Spli<span className="text-amber-500">qo</span>
              </h1>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
                {isForgotPassword
                  ? t('forgotPasswordSubtitle', 'Nhập email để nhận liên kết khôi phục mật khẩu')
                  : isRegister
                    ? t('registerSubtitle', 'Tạo tài khoản mới để chia sẻ chi phí và quyết toán VietQR')
                    : t('loginSubtitle', 'Chào mừng quay trở lại! Đăng nhập để quản lý chi tiêu nhóm')}
              </p>

              {redirectTarget.includes('/join/') && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] font-bold mt-2.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{t('authJoinBanner', 'Đăng nhập hoặc đăng ký để tiếp tục tham gia chuyến đi')}</span>
                </div>
              )}
            </div>

            {/* Segmented Tactile Tab Switcher (Đăng nhập / Đăng ký) */}
            {!isForgotPassword && (
              <div className="flex items-center p-1 rounded-full bg-[#f4f3ec] dark:bg-[#212129] border border-[#e6e4dc] dark:border-[#32323e] mb-5">
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className={`flex-1 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${!isRegister
                      ? 'bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                >
                  {t('login', 'Đăng nhập')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className={`flex-1 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${isRegister
                      ? 'bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                >
                  {t('register', 'Đăng ký')}
                </button>
              </div>
            )}

            {/* Form Section */}
            {isForgotPassword ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Email
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className={inputClass}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="tactile-btn-dark w-full py-3 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{t('sendResetLink', 'Gửi liên kết khôi phục')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsForgotPassword(false)}
                  className="w-full text-center text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors pt-1 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{t('backToLogin', 'Quay lại đăng nhập')}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {isRegister && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Họ và tên *
                    </label>
                    <div className="relative flex items-center">
                      <User className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5" />
                      <input
                        type="text"
                        required={isRegister}
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        className={inputClass}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Email *
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Mật khẩu *
                    </label>
                    {!isRegister && (
                      <button
                        type="button"
                        onClick={() => setIsForgotPassword(true)}
                        className="text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        {t('forgotPassword', 'Quên mật khẩu?')}
                      </button>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={inputClass}
                    />
                  </div>
                </div>

                {isRegister && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      {t('passwordConfirm', 'Xác nhận mật khẩu *')}
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5" />
                      <input
                        type="password"
                        required={isRegister}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className={inputClass}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="tactile-btn-dark w-full py-3 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50 mt-1"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{isRegister ? t('register', 'Đăng ký tài khoản') : t('login', 'Đăng nhập')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#e6e4dc] dark:border-[#2e2e38]"></div>
              </div>
              <span className="relative px-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 bg-white dark:bg-[#1a1a20] uppercase tracking-wider">
                {t('orContinueWith', 'Hoặc tiếp tục với')}
              </span>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-full border border-[#dedbd0] dark:border-[#32323c] bg-[#f4f3ec] dark:bg-[#24242b] hover:bg-[#edebe4] dark:hover:bg-[#2c2c36] text-xs sm:text-sm font-bold text-[#18181b] dark:text-white flex items-center justify-center gap-2.5 transition-all shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{t('continueWithGoogle', 'Tiếp tục với Google')}</span>
            </button>


          </div>
        </div>

        {/* Footer copyright */}
        <p className="text-center text-[11px] font-medium text-zinc-400 dark:text-zinc-600 mt-4">
          Spliqo • Thuật toán cân bằng và chia sẻ chi phí
        </p>
      </div>
    </div>
  );
}
