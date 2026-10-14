import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Plus, Receipt, User } from 'lucide-react';

export default function BottomNav({ onOpenAddExpense }) {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/dashboard' && (location.pathname === '/' || location.pathname === '/dashboard')) return true;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="md:hidden fixed bottom-3 left-3 right-3 z-40 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full border-2 border-[#18181b] shadow-xl flex items-center justify-around">
      <Link
        to="/dashboard"
        className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all px-2.5 py-1 rounded-full ${
          isActive('/dashboard') ? 'bg-[#18181b] text-white shadow-sm' : 'text-zinc-500'
        }`}
      >
        <Home className="w-4 h-4" />
        <span>Home</span>
      </Link>

      <Link
        to="/trips"
        className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all px-2.5 py-1 rounded-full ${
          isActive('/trips') && !location.pathname.includes('settlement') ? 'bg-[#18181b] text-white shadow-sm' : 'text-zinc-500'
        }`}
      >
        <Compass className="w-4 h-4" />
        <span>Trips</span>
      </Link>

      {/* Prominent + Add Expense Button */}
      <button
        onClick={onOpenAddExpense}
        className="flex items-center justify-center bg-[#18181b] text-white w-11 h-11 rounded-full shadow-md hover:bg-black active:scale-95 transition-all -my-2"
        title="Thêm khoản chi mới"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
      </button>

      <Link
        to="/trips?tab=settlement"
        className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all px-2.5 py-1 rounded-full ${
          location.search.includes('settlement') ? 'bg-[#18181b] text-white shadow-sm' : 'text-zinc-500'
        }`}
      >
        <Receipt className="w-4 h-4" />
        <span>Quyết toán</span>
      </Link>

      <Link
        to="/profile"
        className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all px-2.5 py-1 rounded-full ${
          isActive('/profile') ? 'bg-[#18181b] text-white shadow-sm' : 'text-zinc-500'
        }`}
      >
        <User className="w-4 h-4" />
        <span>Profile</span>
      </Link>
    </div>
  );
}
