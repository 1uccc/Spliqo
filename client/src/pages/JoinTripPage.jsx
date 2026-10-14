import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../services/api';
import confetti from 'canvas-confetti';
import { 
  Flame, 
  Users, 
  Calendar, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Sun, 
  Moon,
  Loader2,
  LogIn,
  UserPlus,
  Home,
  UserCheck,
  LogOut
} from 'lucide-react';

export default function JoinTripPage() {
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, loading: authLoading, loginWithGoogle, logout } = useAuth();
  const { showToast } = useToast();
  const { isDark, setDarkMode } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [inviteData, setInviteData] = useState(null);
  const [error, setError] = useState(null);
  const autoJoinAttempted = useRef(false);

  // Fetch trip invite preview
  useEffect(() => {
    if (!code) {
      setError(t('invalidTripCodeTitle', 'Mã mời không hợp lệ.'));
      setLoading(false);
      return;
    }

    const fetchPreview = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/trips/invite/${code.trim()}`);
        const data = (res && res.trip) ? res : (res?.data || res);
        if (!data || !data.trip) {
          throw new Error('Không tìm thấy chuyến đi tương ứng với mã mời này.');
        }
        setInviteData(data);
      } catch (err) {
        console.error('[JoinTripPage] Error fetching preview:', err);
        setError(err.message || 'Không tìm thấy chuyến đi tương ứng với mã mời này.');
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [code, currentUser, t]);

  // Handle Joining
  const handleJoinTrip = async () => {
    if (!currentUser) {
      sessionStorage.setItem('spliqo_auto_join', code);
      sessionStorage.setItem('spliqo_redirect', `/join/${code}?autoJoin=1`);
      navigate(`/auth?redirect=${encodeURIComponent(`/join/${code}?autoJoin=1`)}`);
      return;
    }

    try {
      setJoining(true);
      const res = await api.post('/trips/join', {
        tripCode: code.trim().toUpperCase()
      });

      const resData = (res && res.trip) ? res : (res?.data || res);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      if (resData?.alreadyMember) {
        showToast(resData.message || t('alreadyJoinedNotice', 'Bạn đã là thành viên của chuyến đi này.'), 'info');
      } else {
        showToast(t('joinSuccessToast', `Tham gia chuyến đi "${inviteData?.trip?.name || resData?.trip?.name}" thành công!`), 'success');
      }

      sessionStorage.removeItem('spliqo_auto_join');
      sessionStorage.removeItem('spliqo_redirect');

      const targetTripId = resData?.trip?.id || inviteData?.trip?.id;
      if (targetTripId) {
        navigate(`/trips/${targetTripId}`);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      showToast(err.message || 'Lỗi khi tham gia chuyến đi.', 'error');
    } finally {
      setJoining(false);
    }
  };

  // Google 1-Click Join for Unauthenticated Guests
  const handleGoogleJoin = async () => {
    try {
      setJoining(true);
      const user = await loginWithGoogle();
      if (user) {
        showToast(t('loginSuccess', 'Đăng nhập Google thành công! Đang vào chuyến đi...'), 'success');
        const res = await api.post('/trips/join', {
          tripCode: code.trim().toUpperCase()
        });
        const resData = (res && res.trip) ? res : (res?.data || res);

        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });

        if (resData?.alreadyMember) {
          showToast(resData.message || t('alreadyJoinedNotice', 'Bạn đã là thành viên của chuyến đi này.'), 'info');
        } else {
          showToast(`Tham gia chuyến đi "${inviteData?.trip?.name || resData?.trip?.name}" thành công!`, 'success');
        }

        const targetTripId = resData?.trip?.id || inviteData?.trip?.id;
        navigate(targetTripId ? `/trips/${targetTripId}` : '/dashboard');
      }
    } catch (err) {
      showToast(err.message || 'Lỗi đăng nhập Google', 'error');
      setJoining(false);
    }
  };

  // Auto-join effect when redirected back after login/register
  useEffect(() => {
    if (authLoading || loading || !inviteData || !currentUser) return;
    
    const isAutoJoin = searchParams.get('autoJoin') === '1' || sessionStorage.getItem('spliqo_auto_join') === code;
    if (isAutoJoin && !inviteData.isMember && !autoJoinAttempted.current) {
      autoJoinAttempted.current = true;
      handleJoinTrip();
    }
  }, [authLoading, loading, inviteData, currentUser, searchParams, code]);

  const handleLoginToJoin = (register = false) => {
    sessionStorage.setItem('spliqo_auto_join', code);
    sessionStorage.setItem('spliqo_redirect', `/join/${code}?autoJoin=1`);
    navigate(`/auth?${register ? 'register=1&' : ''}redirect=${encodeURIComponent(`/join/${code}?autoJoin=1`)}`);
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f3ec] dark:bg-[#0f0f12] text-[#18181b] dark:text-[#f4f4f5] flex flex-col items-center justify-center p-4 relative select-none transition-colors">
      
      {/* Top Floating Controls: Language + Dark Mode Toggle */}
      <div className="fixed top-4 right-4 z-20 flex items-center gap-2">
        <div className="flex items-center p-0.5 rounded-full bg-white dark:bg-[#24242b] border border-[#dedbd0] dark:border-[#32323c] text-xs shadow-xs">
          <button
            type="button"
            onClick={() => setLanguage('vi')}
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
              language === 'vi'
                ? 'bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            VI
          </button>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
              language === 'en'
                ? 'bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            EN
          </button>
        </div>

        <div className="flex items-center p-0.5 rounded-full bg-white dark:bg-[#24242b] border border-[#dedbd0] dark:border-[#32323c] shadow-xs">
          <button
            type="button"
            onClick={() => setDarkMode(true)}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isDark ? 'bg-[#32323d] text-amber-400 font-bold shadow-xs' : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
            title="Dark Mode"
          >
            <Moon className="w-3.5 h-3.5 stroke-[2.2]" />
          </button>
          <button
            type="button"
            onClick={() => setDarkMode(false)}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              !isDark ? 'bg-[#edebe4] text-zinc-900 font-bold shadow-xs' : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
            title="Light Mode"
          >
            <Sun className="w-3.5 h-3.5 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 animate-fade-in my-6">
        
        {/* Outer Tactile Shell */}
        <div className="bg-[#edebe4] dark:bg-[#15151a] rounded-4xl border border-[#dedbd0] dark:border-[#272730] p-4 sm:p-5 shadow-xl">
          
          {/* Inner Card */}
          <div className="bg-white dark:bg-[#1a1a20] rounded-3xl p-6 sm:p-7 border border-[#e6e4dc] dark:border-[#2e2e38] shadow-xs">
            
            {/* Brand Logo & Header */}
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] rounded-full mx-auto flex items-center justify-center shadow-md mb-3 hover:scale-105 transition-all">
                <Flame className="w-7 h-7 text-amber-400 fill-amber-400" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-[#18181b] dark:text-white">
                Spliqo
              </h1>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold mt-1.5 border border-amber-200 dark:border-amber-800/40">
                <Sparkles className="w-3 h-3" />
                <span>{t('joinTripInvitationBadge', 'Lời mời tham gia chuyến đi')}</span>
              </div>
            </div>

            {/* State: Loading */}
            {(loading || (authLoading && !inviteData)) && (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  {t('loadingTripInfo', 'Đang tải thông tin chuyến đi...')}
                </p>
              </div>
            )}

            {/* State: Error */}
            {!loading && error && (
              <div className="py-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">
                    {t('invalidTripCodeTitle', 'Không tìm thấy chuyến đi')}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                    {error}
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] text-xs font-bold shadow-xs hover:opacity-90"
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>{t('goToDashboard', 'Về trang chủ Spliqo')}</span>
                  </Link>
                </div>
              </div>
            )}

            {/* State: Trip Info Found */}
            {!loading && !error && inviteData && (
              <div className="space-y-4">
                
                {/* Trip Card Box */}
                <div className="p-4 rounded-2xl bg-[#f4f3ec] dark:bg-[#212129] border border-[#dedbd0] dark:border-[#2e2e38] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-extrabold text-amber-700 dark:text-amber-400 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/40">
                      #{inviteData.trip?.tripCode}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> {t('verifiedTrip', 'Chuyến đi hợp lệ')}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                      {inviteData.trip?.name}
                    </h2>
                    {inviteData.trip?.description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                        {inviteData.trip.description}
                      </p>
                    )}
                  </div>

                  {/* Dates & Scale */}
                  <div className="pt-1 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 border-t border-[#dedbd0]/70 dark:border-[#2e2e38]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {inviteData.trip?.startDate} → {inviteData.trip?.endDate}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-zinc-800 dark:text-zinc-200">
                      <Users className="w-3.5 h-3.5" />
                      {inviteData.memberCount || 1} {t('membersUnit', 'thành viên')}
                    </span>
                  </div>

                  {/* Creator and preview avatars */}
                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#dedbd0]/70 dark:border-[#2e2e38]">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={inviteData.creator?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${inviteData.creator?.displayName || 'Host'}`}
                        alt=""
                        className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 object-cover ring-1 ring-white/50 shrink-0"
                      />
                      <div className="truncate">
                        <span className="text-[10px] text-zinc-400 block">{t('invitedBy', 'Được mời bởi')}</span>
                        <strong className="text-xs text-zinc-900 dark:text-white truncate block">
                          {inviteData.creator?.displayName}
                        </strong>
                      </div>
                    </div>

                    {/* Avatars stack */}
                    {inviteData.membersPreview && inviteData.membersPreview.length > 0 && (
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {inviteData.membersPreview.slice(0, 4).map((m, idx) => (
                          <img
                            key={idx}
                            src={m.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.displayName || idx}`}
                            alt=""
                            className="inline-block w-6 h-6 rounded-full ring-2 ring-white dark:ring-[#212129] bg-zinc-200 dark:bg-zinc-700 object-cover"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* State: Auto-joining in progress */}
                {joining && (
                  <div className="py-4 px-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 flex items-center justify-center gap-2.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-600 dark:text-amber-400" />
                    <span>{t('autoJoiningProgress', 'Đang tự động thêm bạn vào chuyến đi...')}</span>
                  </div>
                )}

                {/* State: Logged In vs Not Logged In */}
                {!joining && (
                  currentUser ? (
                    inviteData.isMember ? (
                      <div className="space-y-3">
                        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span>{t('alreadyJoinedNotice', 'Bạn đã là thành viên của chuyến đi này!')}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate(`/trips/${inviteData.trip?.id}`)}
                          className="w-full py-3 px-5 rounded-2xl bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:opacity-95 transition-all cursor-pointer active:scale-[0.98]"
                        >
                          <span>{t('viewTripNow', 'Đi tới chi tiết chuyến đi')}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={handleJoinTrip}
                          disabled={joining}
                          className="w-full py-3.5 px-5 rounded-2xl bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:opacity-95 transition-all cursor-pointer active:scale-[0.98]"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>{t('joinTripNowBtn', 'Chấp nhận lời mời & Tham gia ngay')}</span>
                        </button>

                        {/* Current User Info & Switch Account */}
                        <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-zinc-500 dark:text-zinc-400 border-t border-[#dedbd0]/60 dark:border-[#2e2e38]">
                          <div className="flex items-center gap-1.5 truncate max-w-[220px]">
                            <span className="text-zinc-400">{t('loggedInAs', 'Đang đăng nhập:')}</span>
                            <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate">
                              {currentUser.displayName || currentUser.email}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              await logout();
                              showToast('Đã đăng xuất tài khoản.', 'info');
                            }}
                            className="text-amber-600 dark:text-amber-400 hover:underline font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            <LogOut className="w-3 h-3" />
                            <span>{t('switchAccountPrompt', 'Đổi tài khoản')}</span>
                          </button>
                        </div>
                      </div>
                    )
                  ) : (
                    /* UNREGISTERED / GUEST FLOW */
                    <div className="space-y-3 pt-1">
                      
                      {/* Notice Box */}
                      <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 text-xs">
                        <div className="flex items-start gap-2.5">
                          <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
                            <UserCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-amber-900 dark:text-amber-200">
                              {t('guestInvitePromptTitle', 'Bạn chưa đăng nhập')}
                            </p>
                            <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                              {t('guestInvitePromptDesc', 'Vui lòng đăng nhập hoặc tạo tài khoản để hệ thống ghi nhận bạn vào danh sách thành viên và chia tiền tự động.')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Google One-Click Join Button */}
                      <button
                        type="button"
                        onClick={handleGoogleJoin}
                        disabled={joining}
                        className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-[#24242b] border border-[#dedbd0] dark:border-[#383844] hover:border-zinc-400 dark:hover:border-zinc-500 text-zinc-800 dark:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-3 shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
                      >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                        <span>{t('continueWithGoogleToJoin', 'Tiếp tục với Google để tham gia ngay')}</span>
                      </button>

                      {/* Divider */}
                      <div className="relative my-2 text-center">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-[#e6e4dc] dark:border-[#2e2e38]"></div>
                        </div>
                        <span className="relative px-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 bg-white dark:bg-[#1a1a20] uppercase tracking-wider">
                          {t('orContinueWith', 'Hoặc')}
                        </span>
                      </div>

                      {/* Email Sign In & Register Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleLoginToJoin(false)}
                          className="w-full py-2.5 px-3 rounded-2xl bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs hover:opacity-90 transition-all cursor-pointer active:scale-[0.98]"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>{t('loginEmailBtn', 'Đăng nhập Email')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleLoginToJoin(true)}
                          className="w-full py-2.5 px-3 rounded-2xl bg-[#edebe4] dark:bg-[#2b2b35] hover:bg-[#e4e1d6] dark:hover:bg-[#343440] text-zinc-900 dark:text-zinc-100 font-bold text-xs border border-[#dedbd0] dark:border-[#383844] flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>{t('registerFastBtn', 'Đăng ký tài khoản')}</span>
                        </button>
                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] font-medium text-zinc-400 dark:text-zinc-600 mt-4">
          Spliqo • VietQR Expense Sharing & Balance Algorithm
        </p>

      </div>
    </div>
  );
}
