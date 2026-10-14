import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { ArrowRightLeft, Mail, Lock, User, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { loginWithEmail, registerWithEmail, loginWithGoogle, resetPassword } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

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
        showToast('Đăng ký tài khoản thành công! Chào mừng đến với SplitMate.', 'success');
      } else {
        if (!email || !password) throw new Error('Vui lòng điền đầy đủ email và mật khẩu.');
        await loginWithEmail(email, password);
        showToast('Đăng nhập thành công!', 'success');
      }
      navigate('/dashboard');
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
      navigate('/dashboard');
    } catch (err) {
      showToast(err.message || 'Lỗi đăng nhập Google', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClasses = "w-full pl-10 pr-4 py-3 rounded-2xl liquid-glass-input text-sm outline-none transition-all placeholder:text-slate-400";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #064e3b 0%, #0f172a 40%, #1e1b4b 70%, #0f172a 100%)' }}
    >
      {/* Dynamic background orbs */}
      <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none animate-glow-orb" />
      <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-teal-500/15 rounded-full blur-[120px] pointer-events-none animate-glow-orb" style={{ animationDelay: '2.5s' }} />
      <div className="absolute top-3/4 left-1/3 w-[300px] h-[300px] bg-violet-500/10 rounded-full blur-[100px] pointer-events-none animate-glow-orb" style={{ animationDelay: '4s' }} />

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        <div 
          className="rounded-4xl p-8 sm:p-10"
          style={{ 
            background: 'rgba(255, 255, 255, 0.12)', 
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 24px 80px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
          }}
        >
          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 mx-auto flex items-center justify-center text-white shadow-xl shadow-emerald-500/40 mb-4 hover:scale-110 transition-transform duration-300">
              <ArrowRightLeft className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Split<span className="text-emerald-400">Mate</span>
            </h1>
            <p className="text-sm font-medium text-white/50 mt-1">
              Split expenses. Stay friends.
            </p>
          </div>

          {/* Form Container */}
          {isForgotPassword ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-base font-bold text-white">Quên mật khẩu</h2>
                <p className="text-xs text-white/50">Nhập email của bạn để nhận liên kết đặt lại mật khẩu.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={inputClasses}
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-sm shadow-xl shadow-emerald-500/30 transition-all disabled:opacity-50 hover:shadow-emerald-500/40"
              >
                {submitting ? 'Đang gửi...' : 'Gửi liên kết khôi phục'}
              </button>

              <button
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="w-full text-center text-xs font-semibold text-white/50 hover:text-white transition-colors pt-2"
              >
                ← Quay lại đăng nhập
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">Họ và tên (Full Name)</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required={isRegister}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className={inputClasses}
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={inputClasses}
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-white/70">Mật khẩu (Password)</label>
                  {!isRegister && (
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
                    >
                      Quên mật khẩu?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputClasses}
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
                  />
                </div>
              </div>

              {isRegister && (
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">Xác nhận mật khẩu (Confirm Password)</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required={isRegister}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={inputClasses}
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-sm shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2 hover:shadow-emerald-500/40 active:scale-[0.98]"
              >
                {submitting ? 'Đang xử lý...' : isRegister ? 'Đăng ký tài khoản' : 'Đăng nhập'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/15"></div>
            </div>
            <span className="relative px-3 text-xs font-medium text-white/30 uppercase tracking-wider" style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '999px', padding: '2px 12px' }}>
              Hoặc
            </span>
          </div>

          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={submitting}
            className="w-full py-3 px-4 rounded-2xl text-white/90 text-sm font-semibold flex items-center justify-center gap-3 transition-all hover:bg-white/15 active:scale-[0.98]"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Continue with Google
          </button>

          {/* Toggle Register / Login */}
          <div className="mt-6 text-center text-xs text-white/40">
            {isRegister ? (
              <p>
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
                >
                  Đăng nhập
                </button>
              </p>
            ) : (
              <p>
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
                >
                  Đăng ký ngay
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
