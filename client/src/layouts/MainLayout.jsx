import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, sanitizeDisplayName } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotifications } from '../contexts/NotificationContext';
import BottomNav from '../components/BottomNav';
import { 
  Home, 
  ShoppingBag, 
  Clock, 
  Tag, 
  Users, 
  Sun, 
  Moon, 
  Settings, 
  HelpCircle, 
  Bell, 
  BellOff,
  CheckCheck,
  CreditCard,
  Receipt,
  Compass,
  UserPlus,
  Trash2,
  ChevronDown, 
  Sparkles, 
  LogOut, 
  Flame,
  CheckCircle2,
  Info,
  Globe
} from 'lucide-react';

function formatTimeAgo(isoString) {
  if (!isoString) return '';
  const now = new Date();
  const date = new Date(isoString);
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 60) return 'Vừa xong';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function getNotificationIcon(type) {
  switch (type) {
    case 'PAYMENT_PAID':
    case 'PAYMENT_CONFIRMED':
      return {
        icon: CreditCard,
        bg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
        badge: 'bg-emerald-500'
      };
    case 'EXPENSE_ADDED':
      return {
        icon: Receipt,
        bg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
        badge: 'bg-amber-500'
      };
    case 'EXPENSE_UPDATED':
      return {
        icon: Info,
        bg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
        badge: 'bg-blue-500'
      };
    case 'TRIP_INVITE':
      return {
        icon: Compass,
        bg: 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
        badge: 'bg-purple-500'
      };
    case 'FRIEND_REQUEST':
    case 'FRIEND_ACCEPTED':
      return {
        icon: UserPlus,
        bg: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
        badge: 'bg-indigo-500'
      };
    default:
      return {
        icon: Bell,
        bg: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300',
        badge: 'bg-zinc-500'
      };
  }
}

export default function MainLayout({ onOpenAddExpense }) {
  const { currentUser, logout } = useAuth();
  const { isDark, setDarkMode } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotifications();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [notifTab, setNotifTab] = useState('ALL'); // 'ALL' | 'UNREAD'

  const filteredNotifs = notifTab === 'UNREAD' 
    ? notifications.filter(n => !n.read) 
    : notifications;

  const getPageTitle = () => {
    if (location.pathname.startsWith('/trips/')) return t('tripDetail', 'Chi tiết chuyến đi');
    if (location.pathname.startsWith('/trips')) return t('myTrips', 'Chuyến đi của tôi');
    if (location.pathname.startsWith('/settlements')) return t('settlement', 'Quyết toán công nợ');
    if (location.pathname.startsWith('/friends')) return t('friends', 'Bạn bè & Kết nối');
    if (location.pathname.startsWith('/profile')) return t('profile', 'Hồ sơ & Tài khoản');
    return t('dashboard', 'Dashboard');
  };

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/' || location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#f4f3ec] dark:bg-[#0f0f12] text-[#18181b] dark:text-[#f4f4f5]">
      
      {/* Left Vertical Dock (Detached Floating Capsule/Pill - Exact match to image!) */}
      <aside className="hidden md:flex flex-col items-center justify-between w-[68px] shrink-0 my-3 ml-3 sm:my-4 sm:ml-4 h-[calc(100vh-1.5rem)] sm:h-[calc(100vh-2rem)] sticky top-3 sm:top-4 z-30 bg-[#edebe4] dark:bg-[#1a1a20] rounded-full border border-[#dedbd0] dark:border-[#2e2e38] py-4 px-2 shadow-xs select-none">
        {/* Top Brand Logo - Dark Circle (White in Dark Mode) */}
        <Link 
          to="/dashboard"
          className="w-11 h-11 bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] rounded-full flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all group"
          title="Spliqo Dashboard"
        >
          <Flame className="w-5 h-5 text-amber-400 fill-amber-400 group-hover:scale-110 transition-transform" />
        </Link>

        {/* Middle Nav Icons Stack (White circle pills + Black active circle in Light, Stark White active circle in Dark) */}
        <nav className="flex flex-col items-center gap-2.5 my-auto">
          {/* Dashboard / Home */}
          <Link
            to="/dashboard"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isActive('/dashboard')
                ? 'bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] shadow-md dark:shadow-white/10 scale-105'
                : 'bg-white dark:bg-[#23232c] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:scale-105 shadow-xs border border-transparent dark:border-[#30303c]'
            }`}
            title="Dashboard"
          >
            <Home className="w-4 h-4 stroke-[2.2]" />
          </Link>

          {/* Trips (Shopping Bag icon as in reference) */}
          <Link
            to="/trips"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isActive('/trips')
                ? 'bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] shadow-md dark:shadow-white/10 scale-105'
                : 'bg-white dark:bg-[#23232c] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:scale-105 shadow-xs border border-transparent dark:border-[#30303c]'
            }`}
            title="Chuyến đi của tôi"
          >
            <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
          </Link>

          {/* Settlements / Tag */}
          <Link
            to="/settlements"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isActive('/settlements')
                ? 'bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] shadow-md dark:shadow-white/10 scale-105'
                : 'bg-white dark:bg-[#23232c] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:scale-105 shadow-xs border border-transparent dark:border-[#30303c]'
            }`}
            title={t('settlement', 'Quyết toán công nợ VietQR')}
          >
            <Tag className="w-4 h-4 stroke-[2.2]" />
          </Link>

          {/* Friends / Bạn bè & Kết nối (Icon Users requested by user) */}
          <Link
            to="/friends"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isActive('/friends')
                ? 'bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] shadow-md dark:shadow-white/10 scale-105'
                : 'bg-white dark:bg-[#23232c] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:scale-105 shadow-xs border border-transparent dark:border-[#30303c]'
            }`}
            title="Bạn bè & Mời chuyến đi"
          >
            <Users className="w-4 h-4 stroke-[2.2]" />
          </Link>
        </nav>

        {/* Bottom Dock Tools: Day/Night Capsule & Settings White Pill */}
        <div className="flex flex-col items-center gap-2.5">
          {/* Day/Night Capsule (White pill container) */}
          <div className="bg-white dark:bg-[#24242b] rounded-full p-1 flex flex-col items-center gap-1 shadow-xs border border-[#e6e4dc] dark:border-[#32323c]">
            <button
              onClick={() => setDarkMode(true)}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isDark ? 'bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] font-bold shadow-xs' : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
              title="Giao diện Tối (Dark Mode)"
            >
              <Moon className="w-3.5 h-3.5 stroke-[2.2]" />
            </button>
            <button
              onClick={() => setDarkMode(false)}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                !isDark ? 'bg-[#18181b] text-white dark:bg-[#34343f] font-bold shadow-xs' : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
              title="Giao diện Sáng (Light Mode)"
            >
              <Sun className="w-3.5 h-3.5 stroke-[2.2]" />
            </button>
          </div>

          {/* Settings Circle Button */}
          <Link
            to="/profile"
            className="w-9 h-9 rounded-full bg-white dark:bg-[#24242b] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center shadow-xs border border-[#e6e4dc] dark:border-[#32323c] transition-all hover:scale-105"
            title="Cài đặt tài khoản"
          >
            <Settings className="w-4 h-4 stroke-[2.2]" />
          </Link>
        </div>
      </aside>

      {/* Right Column: Floating Top Header Pill + Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col my-3 mr-3 ml-3 md:ml-3 sm:my-4 sm:mr-4 sm:ml-4">
        
        {/* Floating Top Header Bar (Detached Capsule/Pill - Responsive on mobile) */}
        <div className="sticky top-0 z-20 pt-1 pb-3 sm:pb-4 bg-[#f4f3ec]/95 dark:bg-[#0f0f12]/95 backdrop-blur-xs">
          <header className="w-full h-14 sm:h-16 bg-[#edebe4] dark:bg-[#1a1a20] rounded-full border border-[#dedbd0] dark:border-[#2e2e38] px-3 sm:px-6 md:px-8 flex items-center justify-between shadow-xs">
            {/* Left: Mobile Flame Icon + Page Title */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
              <Link 
                to="/dashboard"
                className="md:hidden w-8 h-8 sm:w-9 sm:h-9 bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] rounded-full flex items-center justify-center shadow-xs shrink-0 hover:scale-105 active:scale-95 transition-all"
                title="Spliqo"
              >
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              </Link>
              <h1 className="text-sm sm:text-base md:text-xl font-bold tracking-tight text-[#18181b] dark:text-white truncate whitespace-nowrap">
                {getPageTitle()}
              </h1>
            </div>

            {/* Right Tools: Test User Switcher + (?) + (🔔) + User Profile Pill */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">

              {/* Help (?) Circle Button - Hidden on mobile, visible on desktop */}
              <div className="hidden md:block relative">
                <button
                  onClick={() => setHelpOpen(!helpOpen)}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-[#24242b] hover:bg-zinc-50 dark:hover:bg-[#2e2e38] text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white border border-[#dedbd0]/70 dark:border-[#32323c] flex items-center justify-center shadow-xs transition-all hover:scale-105 active:scale-95"
                  title={t('help', 'Trợ giúp')}
                >
                  <HelpCircle className="w-4 h-4 stroke-[2.2]" />
                </button>

                {helpOpen && (
                  <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-[#18181f] rounded-3xl p-4 border border-[#dedbd0] dark:border-[#32323e] shadow-xl z-50 text-xs animate-fade-in text-[#18181b] dark:text-zinc-100">
                    <div className="font-bold text-[#18181b] dark:text-white mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> {t('quickGuide', 'Hướng dẫn nhanh Spliqo')}
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed mb-2">
                      {t('quickGuideDesc', 'Tạo chuyến đi, thêm khoản chi, hệ thống tự động tối ưu giao dịch chuyển khoản VietQR và tạo mã QR kèm STK sẵn sàng thanh toán!')}
                    </p>
                    <button 
                      onClick={() => setHelpOpen(false)}
                      className="w-full text-center py-1.5 bg-[#edebe4] dark:bg-[#252530] hover:bg-[#dedbd0] dark:hover:bg-[#2f2f3d] text-[#18181b] dark:text-white font-bold rounded-full transition-colors"
                    >
                      {t('gotIt', 'Đã hiểu')}
                    </button>
                  </div>
                )}
              </div>

              {/* Notification Bell (🔔) Button - Accessible on both Mobile & Desktop */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen(!notificationsOpen);
                    setHelpOpen(false);
                    setUserDropdownOpen(false);
                  }}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-[#24242b] hover:bg-zinc-50 dark:hover:bg-[#2e2e38] text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white border border-[#dedbd0]/70 dark:border-[#32323c] flex items-center justify-center shadow-xs transition-all hover:scale-105 active:scale-95 relative cursor-pointer"
                  title={t('notifications', 'Thông báo')}
                >
                  <Bell className="w-4 h-4 stroke-[2.2]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#24242b] shadow-xs animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto sm:right-0 top-16 sm:top-auto sm:mt-3 sm:w-96 max-h-[85vh] sm:max-h-[540px] flex flex-col bg-white dark:bg-[#18181f] rounded-3xl p-4 border border-[#dedbd0] dark:border-[#32323e] shadow-2xl z-50 text-xs animate-fade-in text-[#18181b] dark:text-zinc-100">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-[#e6e4dc] dark:border-[#2e2e38] shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] flex items-center justify-center shadow-xs">
                          <Bell className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-[#18181b] dark:text-white flex items-center gap-1.5">
                            <span>{t('notifications', 'Thông báo')}</span>
                            {unreadCount > 0 && (
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                {unreadCount} mới
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllAsRead}
                            className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white flex items-center gap-1 px-2 py-1 rounded-full hover:bg-[#edebe4] dark:hover:bg-[#252530] transition-colors cursor-pointer"
                            title="Đánh dấu tất cả đã đọc"
                          >
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="hidden sm:inline">Đã đọc tất cả</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setNotificationsOpen(false)}
                          className="w-7 h-7 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-[#edebe4] dark:hover:bg-[#252530] flex items-center justify-center transition-colors cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Filter Tabs: Tất cả / Chưa đọc */}
                    <div className="flex items-center gap-1 my-2.5 p-1 rounded-full bg-[#f4f3ec] dark:bg-[#212129] border border-[#e6e4dc] dark:border-[#2e2e38] shrink-0">
                      <button
                        type="button"
                        onClick={() => setNotifTab('ALL')}
                        className={`flex-1 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                          notifTab === 'ALL'
                            ? 'bg-white dark:bg-[#2c2c36] text-[#18181b] dark:text-white shadow-xs'
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                      >
                        Tất cả ({notifications.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotifTab('UNREAD')}
                        className={`flex-1 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                          notifTab === 'UNREAD'
                            ? 'bg-white dark:bg-[#2c2c36] text-[#18181b] dark:text-white shadow-xs'
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                      >
                        Chưa đọc ({unreadCount})
                      </button>
                    </div>

                    {/* Notifications List (Scrollable) */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-1 custom-scrollbar">
                      {filteredNotifs.length === 0 ? (
                        <div className="py-10 text-center text-zinc-400 dark:text-zinc-500 space-y-2">
                          <div className="w-10 h-10 rounded-full bg-[#f4f3ec] dark:bg-[#24242d] flex items-center justify-center mx-auto text-zinc-400">
                            <BellOff className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                            {notifTab === 'UNREAD' ? 'Không có thông báo chưa đọc nào' : 'Bạn chưa có thông báo nào'}
                          </p>
                          <p className="text-[11px] text-zinc-400 max-w-[220px] mx-auto">
                            Khi có chi tiêu mới, mời chuyến đi hoặc cập nhật thanh toán, thông báo sẽ hiển thị tại đây.
                          </p>
                        </div>
                      ) : (
                        filteredNotifs.map((n) => {
                          const config = getNotificationIcon(n.type);
                          const Icon = config.icon;
                          return (
                            <div
                              key={n.id}
                              onClick={() => {
                                markAsRead(n.id);
                                if (n.link) {
                                  navigate(n.link);
                                  setNotificationsOpen(false);
                                }
                              }}
                              className={`group relative p-2.5 rounded-2xl flex items-start gap-2.5 transition-all cursor-pointer border ${
                                !n.read
                                  ? 'bg-[#f8f7f2] dark:bg-[#23232c] border-amber-500/30 dark:border-amber-500/20 shadow-xs'
                                  : 'bg-[#fbfbfa] dark:bg-[#1d1d24] border-transparent hover:border-[#e6e4dc] dark:hover:border-[#32323e] hover:bg-[#f4f3ec] dark:hover:bg-[#24242e]'
                              }`}
                            >
                              {/* Avatar / Icon Badge */}
                              <div className="relative shrink-0 mt-0.5">
                                {n.actor?.photoURL ? (
                                  <img
                                    src={n.actor.photoURL}
                                    alt=""
                                    className="w-8 h-8 rounded-full object-cover ring-1 ring-black/5 dark:ring-white/10"
                                  />
                                ) : (
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bg}`}>
                                    <Icon className="w-4 h-4" />
                                  </div>
                                )}
                                <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${config.badge} flex items-center justify-center text-white ring-1 ring-white dark:ring-[#18181f]`}>
                                  <Icon className="w-2 h-2" />
                                </span>
                              </div>

                              {/* Body */}
                              <div className="flex-1 min-w-0 pr-6">
                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                  <h4 className={`text-xs truncate ${!n.read ? 'font-bold text-[#18181b] dark:text-white' : 'font-semibold text-zinc-700 dark:text-zinc-300'}`}>
                                    {n.title}
                                  </h4>
                                </div>
                                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug line-clamp-2">
                                  {n.message}
                                </p>
                                <span className="text-[10px] font-medium text-zinc-400 mt-1 block">
                                  {formatTimeAgo(n.createdAt)}
                                </span>
                              </div>

                              {/* Action controls (delete / unread dot) on hover */}
                              <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                                {!n.read && (
                                  <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-[#18181f]" />
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(n.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                                  title="Xóa thông báo này"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Footer Clear All */}
                    {notifications.length > 0 && (
                      <div className="pt-2 border-t border-[#e6e4dc] dark:border-[#2e2e38] flex items-center justify-between shrink-0 text-[11px]">
                        <button
                          type="button"
                          onClick={clearAll}
                          className="text-zinc-400 hover:text-rose-600 font-semibold transition-colors cursor-pointer py-1"
                        >
                          Xóa tất cả thông báo
                        </button>
                        <span className="text-zinc-400 font-medium">
                          {notifications.length} thông báo
                        </span>
                      </div>
                    )}

                  </div>
                )}
              </div>

              {/* User Profile Pill [Avatar Name v] (Compact on mobile, full on desktop) */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="h-9 sm:h-10 pl-1 sm:pl-1.5 pr-2 sm:pr-3 bg-white dark:bg-[#24242b] hover:bg-zinc-50 dark:hover:bg-[#2c2c36] border border-[#dedbd0]/70 dark:border-[#32323c] hover:border-zinc-400 dark:hover:border-zinc-600 rounded-full shadow-xs flex items-center gap-1 sm:gap-2.5 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shrink-0"
                  title="Thông tin người dùng"
                >
                  <img
                    src={currentUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.uid}`}
                    alt=""
                    className="w-7 h-7 sm:w-7 sm:h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 object-cover border border-black/5"
                  />
                  <span className="hidden sm:inline text-xs sm:text-sm font-semibold text-[#18181b] dark:text-white max-w-[120px] truncate">
                    {sanitizeDisplayName(currentUser?.displayName, currentUser?.uid, currentUser?.email)}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 stroke-[2.5] transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu for Demo Users & Logout */}
                {userDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-3 w-72 bg-white dark:bg-[#1f1f28] rounded-3xl p-3 border border-[#dedbd0] dark:border-[#2e2e38] shadow-2xl z-50 animate-fade-in"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-2">
                      <div className="font-bold text-xs text-[#18181b] dark:text-white">
                        {sanitizeDisplayName(currentUser?.displayName, currentUser?.uid, currentUser?.email)}
                      </div>
                      <div className="text-[11px] text-zinc-400 truncate">
                        {currentUser?.bankName ? `${currentUser.bankName} • ${currentUser.bankAccountNumber}` : currentUser?.email}
                      </div>
                    </div>


                    <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2 mt-2 px-1 space-y-1">
                      {/* Language Switcher in Dropdown */}
                      <div className="w-full flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300 font-semibold py-2 px-3 rounded-2xl hover:bg-[#edebe4]/60 dark:hover:bg-zinc-800 transition-colors">
                        <div className="flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{t('language', 'Ngôn ngữ')}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-[#edebe4] dark:bg-zinc-800 p-0.5 rounded-full">
                          <button
                            onClick={() => setLanguage('vi')}
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                              language === 'vi' ? 'bg-white dark:bg-[#24242b] text-black dark:text-white shadow-xs' : 'text-zinc-500'
                            }`}
                          >
                            VI
                          </button>
                          <button
                            onClick={() => setLanguage('en')}
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                              language === 'en' ? 'bg-white dark:bg-[#24242b] text-black dark:text-white shadow-xs' : 'text-zinc-500'
                            }`}
                          >
                            EN
                          </button>
                        </div>
                      </div>

                      {/* Dark Mode Toggle for Mobile / Menu */}
                      <button
                        onClick={() => setDarkMode(!isDark)}
                        className="w-full flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300 font-semibold py-2 px-3 rounded-2xl hover:bg-[#edebe4]/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          {isDark ? <Moon className="w-3.5 h-3.5 text-amber-400" /> : <Sun className="w-3.5 h-3.5 text-zinc-500" />}
                          <span>{isDark ? t('darkMode', 'Giao diện Tối') : t('lightMode', 'Giao diện Sáng')}</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#edebe4] dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                          {isDark ? t('darkMode', 'Tối') : t('lightMode', 'Sáng')}
                        </span>
                      </button>

                      <Link
                        to="/profile"
                        className="w-full flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white font-semibold py-2 px-3 rounded-2xl hover:bg-[#edebe4]/60 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5 text-zinc-500" />
                        {t('profileSettingsAndBank', 'Cài đặt tài khoản & STK')}
                      </Link>

                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 text-xs text-rose-600 hover:text-rose-700 font-semibold py-2 px-3 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        {t('logout', 'Đăng xuất')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>
        </div>

        {/* Main Outlet */}
        <main className="flex-1 w-full pb-24 md:pb-12">
          <Outlet />
        </main>
      </div>

      {/* Floating Bottom Nav for Mobile */}
      <BottomNav onOpenAddExpense={onOpenAddExpense} />
    </div>
  );
}
