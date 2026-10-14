import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../services/api';
import { formatVND } from '../services/calculation';
import {
  Compass,
  Search,
  Users,
  Receipt,
  Plus,
  Flag,
  Info,
  Check,
  Share2
} from 'lucide-react';
import InviteTripModal from '../components/InviteTripModal';

export default function MyTripsPage() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | ACTIVE | COMPLETED | ARCHIVED
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTripForInvite, setSelectedTripForInvite] = useState(null);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const data = await api.get('/trips');
      setTrips(data || []);
    } catch (err) {
      showToast(err.message || 'Lỗi khi tải dữ liệu', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [currentUser?.uid]);

  const filteredTrips = trips.filter((trip) => {
    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && trip.status !== 'COMPLETED' && trip.status !== 'ARCHIVED') ||
      trip.status === statusFilter;

    const matchQuery =
      !searchQuery ||
      trip.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.tripCode?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchStatus && matchQuery;
  });

  const filterTabs = [
    { id: 'ALL', label: t('all', 'Tất cả'), count: trips.length },
    {
      id: 'ACTIVE',
      label: t('active', 'Đang diễn ra'),
      count: trips.filter((tr) => tr.status !== 'COMPLETED' && tr.status !== 'ARCHIVED').length
    },
    {
      id: 'COMPLETED',
      label: t('completed', 'Đã chốt sổ'),
      count: trips.filter((tr) => tr.status === 'COMPLETED').length
    },
    {
      id: 'ARCHIVED',
      label: t('archived', 'Lưu trữ'),
      count: trips.filter((tr) => tr.status === 'ARCHIVED').length
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in text-[#18181b] dark:text-zinc-100">
      {/* Top Header & New Trip Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18181b] dark:text-white flex items-center gap-2.5">
            <Compass className="w-6 h-6 text-[#18181b] dark:text-white shrink-0" />
            <span>{t('myTrips', 'Chuyến đi của tôi')}</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {t('myTripsSubtitle', 'Lịch sử toàn bộ các chuyến đi, hoạt động nhóm và sự kiện chia sẻ chi tiêu của bạn')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <Link
            to="/dashboard"
            className="tactile-btn-dark"
          >
            <Plus className="w-4 h-4" /> {t('createTrip', 'Tạo chuyến đi mới')}
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 w-full sm:w-auto max-w-full shrink-0 flex-nowrap">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`tactile-tab shrink-0 whitespace-nowrap ${statusFilter === tab.id ? 'active-purple' : ''}`}
            >
              <span className="whitespace-nowrap shrink-0">{tab.label}</span>
              <span className="tactile-badge w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 leading-none border border-black/5 dark:border-white/10 bg-white/80 dark:bg-white/15 dark:text-white">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder={t('searchPlaceholder', 'Tìm theo tên, mã trip...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-full bg-white dark:bg-[#1f1f26] border border-[#e6e4dc] dark:border-[#2e2e38] text-xs text-[#18181b] dark:text-zinc-100 outline-none focus:border-zinc-900 transition-colors"
          />
        </div>
      </div>

      {/* TRIPS GRID */}
      <div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-64 bg-white dark:bg-[#1f1f26] rounded-3xl border border-[#e6e4dc] dark:border-[#2e2e38] animate-pulse p-5" />
            ))}
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#1a1a20] border border-[#e6e4dc] dark:border-[#2e2e38] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#f4f3ec] dark:bg-[#252530] text-zinc-500 mx-auto flex items-center justify-center">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-[#18181b] dark:text-zinc-100 text-base">
              {t('noTripsFound', 'Không tìm thấy chuyến đi nào')}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              {t('noTripsDesc', 'Không có kết quả phù hợp với bộ lọc trạng thái hoặc từ khóa tìm kiếm.')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTrips.map((trip) => {
              const isCompleted = trip.status === 'COMPLETED';
              return (
                <div
                  key={trip.id}
                  className="tactile-card p-5 flex flex-col justify-between"
                >
                  <div>
                    {/* Card Header: Avatar + Status Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] flex items-center justify-center font-bold text-xs shadow-xs">
                          {trip.name?.charAt(0)?.toUpperCase() || 'T'}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-[#18181b] dark:text-zinc-100 line-clamp-1">
                            {trip.name}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400">
                            #{trip.tripCode}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                          }`}
                        >
                          <Flag className="w-3 h-3" />
                          {isCompleted ? t('completed', 'Đã chốt sổ') : t('active', 'Đang diễn ra')}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedTripForInvite(trip);
                          }}
                          className="w-7 h-7 rounded-full flex items-center justify-center bg-[#f4f3ec] dark:bg-[#252530] hover:bg-amber-100 dark:hover:bg-amber-950/60 text-zinc-600 hover:text-amber-700 dark:text-zinc-300 dark:hover:text-amber-300 transition-all border border-[#dedbd0] dark:border-[#32323e] shadow-xs cursor-pointer"
                          title="Mời bạn bè & khách bằng link hoặc mã QR"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 2 Micro-boxes */}
                    <div className="grid grid-cols-2 gap-2 my-3">
                      <div className="tactile-chip p-2.5">
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                          <Receipt className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{t('totalExpense', 'Tổng chi')}</span>
                        </div>
                        <div className="text-xs font-extrabold text-[#18181b] dark:text-zinc-100 truncate">
                          {formatVND(trip.totalExpense || 0)}
                        </div>
                      </div>

                      <div className="tactile-chip p-2.5">
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                          <Users className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{t('members', 'Thành viên')}</span>
                        </div>
                        <div className="text-xs font-extrabold text-[#18181b] dark:text-zinc-100 truncate">
                          {trip.memberCount || 1} {t('memberShort', 'người')} • {trip.expenseCount || 0} {t('expenseShort', 'chi')}
                        </div>
                      </div>
                    </div>

                    <h3 className="font-bold text-sm text-[#18181b] dark:text-zinc-100 line-clamp-1 mt-1">
                      {trip.name}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 min-h-[32px]">
                      {trip.description || t('defaultTripDesc', 'Chuyến đi cùng bạn bè, chia sẻ chi phí ăn uống và du lịch sòng phẳng.')}
                    </p>
                  </div>

                  {/* Footer Buttons */}
                  <div className="mt-4 pt-3 border-t border-[#e6e4dc] dark:border-[#2e2e38] flex items-center justify-between gap-2">
                    <Link
                      to={`/trips/${trip.id}`}
                      className="tactile-btn-pill flex-1 justify-center text-xs"
                    >
                      <Info className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{t('viewDetails', 'Xem chi tiết')}</span>
                    </Link>

                    <Link
                      to={`/trips/${trip.id}?tab=settlement`}
                      className="tactile-btn-dark flex-1 justify-center text-xs"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t('settlement', 'Quyết toán')}</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Mời bằng link & QR */}
      <InviteTripModal
        isOpen={!!selectedTripForInvite}
        onClose={() => setSelectedTripForInvite(null)}
        trip={selectedTripForInvite}
      />
    </div>
  );
}
