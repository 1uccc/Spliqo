import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Compass, Plus, Tag, Users, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import Modal from './Modal';
import api from '../services/api';

export default function BottomNav({ onOpenAddExpense }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, isEn } = useLanguage();
  const { showToast } = useToast();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tripName, setTripName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/' || location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const isTripsActive = location.pathname.startsWith('/trips');
  const isSettlementActive = location.pathname.startsWith('/settlements');
  const isTripDetail =
    /^\/trips\/[^/]+/.test(location.pathname) &&
    !location.pathname.startsWith('/trips/join/');

  const centerActionLabel = isTripDetail
    ? t('addExpense', 'Thêm khoản chi mới')
    : t('createTrip', 'Tạo chuyến nhanh');

  const handleCenterAction = () => {
    if (isTripDetail) {
      if (typeof onOpenAddExpense === 'function') {
        onOpenAddExpense();
      } else {
        window.dispatchEvent(new CustomEvent('spliqo:open-add-expense'));
      }
      return;
    }
    setCreateModalOpen(true);
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    if (!tripName.trim()) {
      showToast(isEn ? 'Please enter a trip name' : 'Vui lòng nhập tên chuyến đi', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const newTrip = await api.post('/trips', {
        name: tripName.trim(),
        description: description.trim(),
        startDate,
        endDate,
      });

      showToast(
        isEn ? `Created "${newTrip.name}" successfully!` : `Tạo chuyến "${newTrip.name}" thành công!`,
        'success'
      );
      setCreateModalOpen(false);
      setTripName('');
      setDescription('');
      navigate(`/trips/${newTrip.id}`);
    } catch (err) {
      showToast(err.message || (isEn ? 'Failed to create trip' : 'Lỗi khi tạo chuyến đi'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <nav
        aria-label={isEn ? 'Mobile navigation' : 'Điều hướng di động'}
        className="md:hidden fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 right-3 max-w-md mx-auto z-40 bg-white/95 dark:bg-[#1a1a20]/95 backdrop-blur-md px-1.5 py-1.5 rounded-full border border-[#dedbd0] dark:border-[#2e2e38] shadow-xl flex items-center justify-between gap-1 select-none"
      >
        {/* 1. Trang chủ */}
        <Link
          to="/dashboard"
          aria-current={isActive('/dashboard') ? 'page' : undefined}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-0.5 rounded-full text-[11px] font-bold transition-all ${
            isActive('/dashboard') 
              ? 'bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] shadow-sm' 
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Home className="w-4 h-4 shrink-0 mb-0.5" aria-hidden="true" />
          <span className="truncate max-w-full text-center leading-tight">{t('dashboardShort', 'Tổng quan')}</span>
        </Link>

        {/* 2. Chuyến đi */}
        <Link
          to="/trips"
          aria-current={isTripsActive ? 'page' : undefined}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-0.5 rounded-full text-[11px] font-bold transition-all ${
            isTripsActive 
              ? 'bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] shadow-sm' 
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Compass className="w-4 h-4 shrink-0 mb-0.5" aria-hidden="true" />
          <span className="truncate max-w-full text-center leading-tight">{t('tripsShort', 'Chuyến đi')}</span>
        </Link>

        {/* 3. Nút (+) Thêm khoản chi (trong chuyến đi) / Tạo chuyến nhanh */}
        <button
          type="button"
          onClick={handleCenterAction}
          aria-label={centerActionLabel}
          className="flex items-center justify-center bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] w-11 h-11 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all -my-2 mx-0.5 shrink-0 cursor-pointer"
          title={centerActionLabel}
        >
          <Plus className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
        </button>

        {/* 4. Quyết toán */}
        <Link
          to="/settlements"
          aria-current={isSettlementActive ? 'page' : undefined}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-0.5 rounded-full text-[11px] font-bold transition-all ${
            isSettlementActive 
              ? 'bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] shadow-sm' 
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Tag className="w-4 h-4 shrink-0 mb-0.5" aria-hidden="true" />
          <span className="truncate max-w-full text-center leading-tight">{t('settlementShort', 'Quyết toán')}</span>
        </Link>

        {/* 5. Bạn bè */}
        <Link
          to="/friends"
          aria-current={isActive('/friends') ? 'page' : undefined}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-0.5 rounded-full text-[11px] font-bold transition-all ${
            isActive('/friends') 
              ? 'bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] shadow-sm' 
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 shrink-0 mb-0.5" aria-hidden="true" />
          <span className="truncate max-w-full text-center leading-tight">{t('friendsShort', 'Bạn bè')}</span>
        </Link>
      </nav>

      {/* Quick Create Trip Modal */}
      <Modal 
        isOpen={createModalOpen} 
        onClose={() => setCreateModalOpen(false)} 
        title={t('createTrip', 'Tạo chuyến đi nhanh')}
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="tactile-btn-pill text-xs font-semibold px-4 py-2 cursor-pointer"
            >
              {t('cancel', 'Hủy')}
            </button>
            <button
              type="submit"
              form="bottom-nav-create-trip-form"
              disabled={submitting}
              className="tactile-btn-dark text-xs font-bold px-4 py-2 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>{t('createTripBtn', 'Tạo chuyến')}</span>
            </button>
          </div>
        }
      >
        <form id="bottom-nav-create-trip-form" onSubmit={handleCreateTrip} className="space-y-4 text-[#18181b] dark:text-[#f4f4f5]">
          <div>
            <label htmlFor="bottom-nav-trip-name" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              {t('tripNameGroupRequired', 'Tên chuyến đi / Nhóm *')}
            </label>
            <input
              id="bottom-nav-trip-name"
              type="text"
              required
              autoFocus
              placeholder={t('tripNamePlaceholder', 'Ví dụ: Đà Lạt 3N2Đ, Ăn lẩu Haidilao...')}
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#f4f3ec] dark:bg-[#212129] border border-[#e6e4dc] dark:border-[#32323e] text-sm text-[#18181b] dark:text-white focus:border-zinc-900 dark:focus:border-emerald-400 transition-colors placeholder:text-zinc-600 dark:placeholder:text-zinc-400"
            />
          </div>

          <div>
            <label htmlFor="bottom-nav-trip-desc" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              {t('shortDescription', 'Mô tả ngắn')}
            </label>
            <textarea
              id="bottom-nav-trip-desc"
              rows={2}
              placeholder={t('tripDescPlaceholder', 'Chuyến đi khám phá, nghỉ dưỡng cùng hội bạn...')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-2xl bg-[#f4f3ec] dark:bg-[#212129] border border-[#e6e4dc] dark:border-[#32323e] text-sm text-[#18181b] dark:text-white focus:border-zinc-900 dark:focus:border-emerald-400 transition-colors resize-none placeholder:text-zinc-600 dark:placeholder:text-zinc-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="bottom-nav-start-date" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                {t('startDate', 'Ngày bắt đầu')}
              </label>
              <input
                id="bottom-nav-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-[#f4f3ec] dark:bg-[#212129] border border-[#e6e4dc] dark:border-[#32323e] text-xs text-[#18181b] dark:text-white focus:border-zinc-900 dark:focus:border-emerald-400 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="bottom-nav-end-date" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                {t('endDate', 'Ngày kết thúc')}
              </label>
              <input
                id="bottom-nav-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-[#f4f3ec] dark:bg-[#212129] border border-[#e6e4dc] dark:border-[#32323e] text-xs text-[#18181b] dark:text-white focus:border-zinc-900 dark:focus:border-emerald-400 transition-colors"
              />
            </div>
          </div>

          <p className="text-xs text-zinc-600 dark:text-zinc-400 italic">
            {t('autoTripCodeHint', '* Sau khi tạo, hệ thống sẽ tự động cấp một mã chuyến đi để bạn mời bạn bè tham gia.')}
          </p>
        </form>
      </Modal>
    </>
  );
}
