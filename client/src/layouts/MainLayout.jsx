import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
  ChevronDown, 
  Sparkles, 
  LogOut, 
  Flame,
  CheckCircle2,
  Info
} from 'lucide-react';

export default function MainLayout({ onOpenAddExpense }) {
  const { currentUser, logout, switchDemoUser, demoUsers } = useAuth();
  const location = useLocation();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const getPageTitle = () => {
    if (location.pathname.startsWith('/trips/')) return 'Chi tiết chuyến đi';
    if (location.pathname.startsWith('/trips')) return 'Chuyến đi của tôi';
    if (location.pathname.startsWith('/profile')) return 'Hồ sơ & Tài khoản';
    return 'Dashboard';
  };

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/' || location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#f4f3ec] text-[#18181b]">
      
      {/* Left Vertical Dock (Detached Floating Capsule/Pill - Exact match to image!) */}
      <aside className="hidden md:flex flex-col items-center justify-between w-[68px] shrink-0 my-3 ml-3 sm:my-4 sm:ml-4 h-[calc(100vh-1.5rem)] sm:h-[calc(100vh-2rem)] sticky top-3 sm:top-4 z-30 bg-[#edebe4] rounded-full border border-[#dedbd0] py-4 px-2 shadow-xs select-none">
        {/* Top Brand Logo - Dark Circle */}
        <Link 
          to="/dashboard"
          className="w-11 h-11 bg-[#18181b] text-white rounded-full flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all group"
          title="SplitMate Dashboard"
        >
          <Flame className="w-5 h-5 text-amber-400 fill-amber-400 group-hover:scale-110 transition-transform" />
        </Link>

        {/* Middle Nav Icons Stack (White circle pills + Black active circle) */}
        <nav className="flex flex-col items-center gap-2.5 my-auto">
          {/* Dashboard / Home */}
          <Link
            to="/dashboard"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isActive('/dashboard')
                ? 'bg-[#18181b] text-white shadow-sm'
                : 'bg-white text-zinc-600 hover:text-zinc-900 hover:scale-105 shadow-xs'
            }`}
            title="Dashboard"
          >
            <Home className="w-4 h-4 stroke-[2.2]" />
          </Link>

          {/* Trips (Shopping Bag icon as in reference) */}
          <Link
            to="/trips"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isActive('/trips') && !location.search.includes('settlement')
                ? 'bg-[#18181b] text-white shadow-sm'
                : 'bg-white text-zinc-600 hover:text-zinc-900 hover:scale-105 shadow-xs'
            }`}
            title="Chuyến đi của tôi"
          >
            <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
          </Link>

          {/* Expenses History / Clock */}
          <Link
            to="/trips?tab=expenses"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              location.search.includes('expenses')
                ? 'bg-[#18181b] text-white shadow-sm'
                : 'bg-white text-zinc-600 hover:text-zinc-900 hover:scale-105 shadow-xs'
            }`}
            title="Lịch sử chi tiêu"
          >
            <Clock className="w-4 h-4 stroke-[2.2]" />
          </Link>

          {/* Settlements / Tag */}
          <Link
            to="/trips?tab=settlement"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              location.search.includes('settlement')
                ? 'bg-[#18181b] text-white shadow-sm'
                : 'bg-white text-zinc-600 hover:text-zinc-900 hover:scale-105 shadow-xs'
            }`}
            title="Quyết toán công nợ VietQR"
          >
            <Tag className="w-4 h-4 stroke-[2.2]" />
          </Link>

          {/* Members / Profile */}
          <Link
            to="/profile"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isActive('/profile')
                ? 'bg-[#18181b] text-white shadow-sm'
                : 'bg-white text-zinc-600 hover:text-zinc-900 hover:scale-105 shadow-xs'
            }`}
            title="Hồ sơ cá nhân & STK"
          >
            <Users className="w-4 h-4 stroke-[2.2]" />
          </Link>
        </nav>

        {/* Bottom Dock Tools: Day/Night Capsule & Settings White Pill */}
        <div className="flex flex-col items-center gap-2.5">
          {/* Day/Night Capsule (White pill container) */}
          <div className="bg-white rounded-full p-1 flex flex-col items-center gap-1 shadow-xs border border-[#e6e4dc]">
            <button
              onClick={() => setIsDarkMode(true)}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                isDarkMode ? 'bg-[#edebe4] text-zinc-900 font-bold shadow-xs' : 'text-zinc-400 hover:text-zinc-700'
              }`}
              title="Giao diện Tối"
            >
              <Moon className="w-3.5 h-3.5 stroke-[2.2]" />
            </button>
            <button
              onClick={() => setIsDarkMode(false)}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                !isDarkMode ? 'bg-[#edebe4] text-zinc-900 font-bold shadow-xs' : 'text-zinc-400 hover:text-zinc-700'
              }`}
              title="Giao diện Sáng"
            >
              <Sun className="w-3.5 h-3.5 stroke-[2.2]" />
            </button>
          </div>

          {/* Settings Circle Button */}
          <Link
            to="/profile"
            className="w-9 h-9 rounded-full bg-white text-zinc-600 hover:text-zinc-900 flex items-center justify-center shadow-xs border border-[#e6e4dc] transition-all hover:scale-105"
            title="Cài đặt tài khoản"
          >
            <Settings className="w-4 h-4 stroke-[2.2]" />
          </Link>
        </div>
      </aside>

      {/* Right Column: Floating Top Header Pill + Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col my-3 mr-3 ml-3 md:ml-3 sm:my-4 sm:mr-4 sm:ml-4">
        
        {/* Floating Top Header Bar (Detached Capsule/Pill - Exact match to reference image!) */}
        <div className="sticky top-0 z-20 pt-1 pb-3 sm:pb-4 bg-[#f4f3ec]/95 backdrop-blur-xs">
          <header className="w-full h-14 sm:h-16 bg-[#edebe4] rounded-full border border-[#dedbd0] px-5 sm:px-8 flex items-center justify-between shadow-xs">
            {/* Left: Mobile Flame Icon + Page Title */}
            <div className="flex items-center gap-3">
              <Link 
                to="/dashboard"
                className="md:hidden w-9 h-9 bg-[#18181b] text-white rounded-full flex items-center justify-center shadow-xs shrink-0 hover:scale-105 active:scale-95 transition-all"
                title="SplitMate"
              >
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18181b]">
                {getPageTitle()}
              </h1>
            </div>

            {/* Right Tools: Test User Switcher + (?) + (🔔) + User Profile Pill (Matches reference image) */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              
              {/* Quick Demo Switcher Pills on Desktop */}
              <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#dedbd0]/70 text-xs text-zinc-600 shadow-xs">
                <span className="text-[11px] font-bold text-zinc-400">Đổi test:</span>
                {demoUsers.map((u) => (
                  <button
                    key={u.uid}
                    onClick={() => switchDemoUser(u.uid)}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all ${
                      currentUser?.uid === u.uid
                        ? 'bg-[#18181b] text-white shadow-xs'
                        : 'hover:bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    {u.displayName.split(' ').pop()}
                  </button>
                ))}
              </div>

              {/* Help (?) Circle Button */}
              <div className="relative">
                <button
                  onClick={() => setHelpOpen(!helpOpen)}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-zinc-50 text-zinc-700 hover:text-zinc-950 border border-[#dedbd0]/70 flex items-center justify-center shadow-xs transition-all hover:scale-105 active:scale-95"
                  title="Trợ giúp"
                >
                  <HelpCircle className="w-4 h-4 stroke-[2.2]" />
                </button>

                {helpOpen && (
                  <div className="absolute right-0 mt-3 w-72 bg-white rounded-3xl p-4 border border-[#dedbd0] shadow-xl z-50 text-xs animate-fade-in">
                    <div className="font-bold text-[#18181b] mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Hướng dẫn nhanh SplitMate
                    </div>
                    <p className="text-zinc-500 leading-relaxed mb-2">
                      Tạo chuyến đi, thêm khoản chi, hệ thống tự động tối ưu giao dịch chuyển khoản VietQR và tạo mã QR kèm STK sẵn sàng thanh toán!
                    </p>
                    <button 
                      onClick={() => setHelpOpen(false)}
                      className="w-full text-center py-1.5 bg-[#edebe4] hover:bg-[#dedbd0] text-[#18181b] font-bold rounded-full transition-colors"
                    >
                      Đã hiểu
                    </button>
                  </div>
                )}
              </div>

              {/* Notification Bell (🔔) Circle Button */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-zinc-50 text-zinc-700 hover:text-zinc-950 border border-[#dedbd0]/70 flex items-center justify-center shadow-xs transition-all hover:scale-105 active:scale-95 relative"
                  title="Thông báo"
                >
                  <Bell className="w-4 h-4 stroke-[2.2]" />
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl p-4 border border-[#dedbd0] shadow-xl z-50 text-xs animate-fade-in">
                    <div className="font-bold text-[#18181b] mb-2 flex items-center justify-between">
                      <span>Thông báo mới</span>
                      <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">Trực tiếp</span>
                    </div>
                    <div className="space-y-2.5">
                      <div className="p-2.5 bg-[#edebe4]/60 rounded-2xl flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-zinc-900">Công nợ đã được tối ưu</p>
                          <p className="text-[11px] text-zinc-500">Giảm thiểu tối đa số lần chuyển khoản giữa các thành viên.</p>
                        </div>
                      </div>
                      <div className="p-2.5 bg-[#edebe4]/60 rounded-2xl flex items-start gap-2">
                        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-zinc-900">VietQR sẵn sàng</p>
                          <p className="text-[11px] text-zinc-500">Quét mã VietQR chuyển tiền tự động điền STK & số tiền chính xác.</p>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setNotificationsOpen(false)}
                      className="w-full mt-3 text-center py-1.5 bg-[#edebe4] hover:bg-[#dedbd0] text-[#18181b] font-bold rounded-full transition-colors"
                    >
                      Đóng
                    </button>
                  </div>
                )}
              </div>

              {/* User Profile Pill [Avatar Name v] (Matches screenshot exactly!) */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="h-9 sm:h-10 pl-1.5 pr-3 bg-white hover:bg-zinc-50 border border-[#dedbd0]/70 hover:border-zinc-400 rounded-full shadow-xs flex items-center gap-2 sm:gap-2.5 transition-all hover:scale-[1.02] active:scale-95"
                  title="Thông tin người dùng"
                >
                  <img
                    src={currentUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.uid}`}
                    alt=""
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-zinc-100 object-cover border border-black/5"
                  />
                  <span className="text-xs sm:text-sm font-semibold text-[#18181b] max-w-[120px] truncate">
                    {currentUser?.displayName || 'User'}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 stroke-[2.5] transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu for Demo Users & Logout */}
                {userDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-3 w-72 bg-white rounded-3xl p-3 border border-[#dedbd0] shadow-2xl z-50 animate-fade-in"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-zinc-100 mb-2">
                      <div className="font-bold text-xs text-[#18181b]">{currentUser?.displayName}</div>
                      <div className="text-[11px] text-zinc-400 truncate">
                        {currentUser?.bankName ? `${currentUser.bankName} • ${currentUser.bankAccountNumber}` : currentUser?.email}
                      </div>
                    </div>

                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Chuyển đổi người dùng (Test)
                    </div>

                    <div className="space-y-1 my-1">
                      {demoUsers.map((u) => (
                        <button
                          key={u.uid}
                          onClick={() => switchDemoUser(u.uid)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-left text-xs transition-all ${
                            currentUser?.uid === u.uid
                              ? 'bg-[#18181b] text-white font-bold shadow-xs'
                              : 'hover:bg-[#edebe4]/60 text-zinc-700'
                          }`}
                        >
                          <img
                            src={u.photoURL}
                            alt=""
                            className="w-6 h-6 rounded-full bg-zinc-200 object-cover"
                          />
                          <div className="flex-1 truncate">
                            <div className="truncate">{u.displayName}</div>
                            <div className={`text-[10px] ${currentUser?.uid === u.uid ? 'text-zinc-300' : 'text-zinc-400'}`}>
                              {u.bankName || 'Chưa có ngân hàng'}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-zinc-100 pt-2 mt-2 px-1 space-y-1">
                      <Link
                        to="/profile"
                        className="w-full flex items-center gap-2 text-xs text-zinc-700 hover:text-zinc-900 font-semibold py-2 px-3 rounded-2xl hover:bg-[#edebe4]/60 transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5 text-zinc-500" />
                        Cài đặt tài khoản & STK
                      </Link>

                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 text-xs text-rose-600 hover:text-rose-700 font-semibold py-2 px-3 rounded-2xl hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Đăng xuất
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
