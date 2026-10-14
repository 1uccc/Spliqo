import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  Home
} from 'lucide-react';

export default function JoinTripPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { isDark, setDarkMode } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [inviteData, setInviteData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!code) {
      setError('Mã mời không hợp lệ.');
      setLoading(false);
      return;
    }

    const fetchPreview = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/trips/invite/${code.trim()}`);
        setInviteData(res.data);
      } catch (err) {
        console.error('[JoinTripPage] Error fetching preview:', err);
        setError(err.response?.data?.error || 'Không tìm thấy chuyến đi tương ứng với mã mời này.');
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [code, currentUser]);

  const handleJoinTrip = async () => {
    if (!currentUser) {
      sessionStorage.setItem('spliqo_redirect', `/join/${code}`);
      navigate(`/auth?redirect=${encodeURIComponent(`/join/${code}`)}`);
      return;
    }

    try {
      setJoining(true);
      const res = await api.post('/trips/join', {
        tripCode: code.trim().toUpperCase()
      });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      if (res.data.alreadyMember) {
        showToast(res.data.message || 'Bạn đã là thành viên của chuyến đi này.', 'info');
      } else {
        showToast(`Tham gia chuyến đi "${inviteData?.trip?.name}" thành công!`, 'success');
      }

      const targetTripId = res.data?.trip?.id || inviteData?.trip?.id;
      navigate(`/trips/${targetTripId}`);
    } catch (err) {
      showToast(err.response?.data?.error || 'Lỗi khi tham gia chuyến đi.', 'error');
    } finally {
      setJoining(false);
    }
  };

  const handleLoginToJoin = (register = false) => {
    sessionStorage.setItem('spliqo_redirect', `/join/${code}`);
    navigate(`/auth?${register ? 'register=1&' : ''}redirect=${encodeURIComponent(`/join/${code}`)}`);
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
            {loading && (
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
              <div className="space-y-5">
                
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

                {/* Actions: Logged In vs Not Logged In */}
                {currentUser ? (
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
                    <button
                      type="button"
                      onClick={handleJoinTrip}
                      disabled={joining}
                      className="w-full py-3.5 px-5 rounded-2xl bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:opacity-95 transition-all cursor-pointer active:scale-[0.98]"
                    >
                      {joining ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{t('joiningTripProgress', 'Đang tham gia...')}</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          <span>{t('joinTripNowBtn', 'Chấp nhận lời mời & Tham gia ngay')}</span>
                        </>
                      )}
                    </button>
                  )
                ) : (
                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => handleLoginToJoin(false)}
                      className="w-full py-3.5 px-5 rounded-2xl bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:opacity-95 transition-all cursor-pointer active:scale-[0.98]"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>{t('loginToJoinBtn', 'Đăng nhập để tham gia chuyến đi')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLoginToJoin(true)}
                      className="w-full py-2.5 px-4 rounded-2xl border border-[#dedbd0] dark:border-[#32323c] bg-[#f4f3ec] dark:bg-[#24242b] hover:bg-[#edebe4] dark:hover:bg-[#2c2c36] text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t('registerNewToJoin', 'Chưa có tài khoản? Đăng ký nhanh')}</span>
                    </button>
                  </div>
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
