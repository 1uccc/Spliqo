import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  Layers, 
  User, 
  LogOut, 
  Menu, 
  X, 
  ChevronDown, 
  Sparkles,
  Compass,
  Flame
} from 'lucide-react';

export default function Navbar() {
  const { currentUser, logout, isFirebaseLive } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: Layers },
    { name: 'Chuyến đi của tôi', path: '/trips', icon: Compass },
    { name: 'Hồ sơ & Tài khoản', path: '/profile', icon: User },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 liquid-glass border-b-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-[#18181b] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-all duration-300">
              <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Spli<span className="text-amber-500">qo</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-medium px-2.5 py-0.5 bg-amber-100/60 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-full border border-amber-200/50">
                Split expenses. Stay friends.
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                    isActive(link.path)
                      ? 'bg-emerald-500/15 text-emerald-700 shadow-sm shadow-emerald-500/10 border border-emerald-300/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action / Switch Demo User / Profile */}
          <div className="flex items-center gap-3">
            {/* Quick User Switcher */}
            <div className="relative">
              <button
                onClick={() => setSwitchOpen(!switchOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-2xl border border-white/40 hover:border-emerald-300/50 bg-white/40 backdrop-blur-md text-xs font-semibold text-slate-700 shadow-glass-btn transition-all hover:bg-white/60"
                title="Chuyển đổi người dùng để test"
              >
                <img
                  src={currentUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.uid}`}
                  alt=""
                  className="w-6 h-6 rounded-full bg-white/50 object-cover ring-2 ring-white/40"
                />
                <span className="max-w-[100px] truncate hidden sm:inline">{currentUser?.displayName || 'User'}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${switchOpen ? 'rotate-180' : ''}`} />
              </button>

              {switchOpen && (
                <div 
                  className="absolute right-0 mt-2 w-64 liquid-glass-card rounded-3xl py-2 z-50 animate-fade-in"
                  onClick={() => setSwitchOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-white/20 text-xs">
                    <div className="font-bold text-slate-800">{currentUser?.displayName}</div>
                    <div className="text-[10px] text-slate-400 truncate">{currentUser?.email}</div>
                  </div>
                  <div className="border-t border-white/20 mt-1 pt-1 px-3 py-1">
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 text-xs text-rose-600 hover:text-rose-700 font-medium py-1.5 px-2 rounded-xl hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-2xl text-slate-600 hover:text-slate-900 hover:bg-white/50 transition-all"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/20 liquid-glass px-4 pt-3 pb-5 space-y-2 animate-fade-in">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                  isActive(link.path)
                    ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-300/30'
                    : 'text-slate-600 hover:bg-white/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.name}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
