import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../services/api';
import {
  Compass,
  Search,
  Plus
} from 'lucide-react';
import TripCard from '../components/trip/TripCard';
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

  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get('/trips');
      setTrips(data || []);
    } catch (err) {
      showToast(err.message || 'Lỗi khi tải dữ liệu', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips, currentUser?.uid]);

  // Filter based on status filter tabs and search query
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

  // Requirement: Prioritize ongoing trips at the top of the list!
  const sortedTrips = [...filteredTrips].sort((a, b) => {
    const aActive = a.status !== 'COMPLETED' && a.status !== 'ARCHIVED';
    const bActive = b.status !== 'COMPLETED' && b.status !== 'ARCHIVED';

    // 1. Ongoing trips first
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;

    // 2. Newest first within same status
    const timeA = new Date(a.startDate || a.createdAt || 0).getTime();
    const timeB = new Date(b.startDate || b.createdAt || 0).getTime();
    if (timeB !== timeA) return timeB - timeA;

    return (b.id || '').localeCompare(a.id || '');
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
            {t('myTripsSubtitle', 'Chuyến đi đang diễn ra luôn được xếp ưu tiên đầu danh sách. Nhấn vào bất kỳ chuyến đi nào để xem chi tiết.')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <Link
            to="/dashboard"
            className="tactile-btn-dark cursor-pointer"
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
            className="w-full pl-9 pr-3 py-1.5 rounded-full bg-white dark:bg-[#1f1f26] border border-[#e6e4dc] dark:border-[#2e2e38] text-xs text-[#18181b] dark:text-zinc-100 outline-none focus:border-zinc-900 transition-colors shadow-2xs"
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
        ) : sortedTrips.length === 0 ? (
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
            {sortedTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onShare={setSelectedTripForInvite}
                t={t}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal: Mời bạn bè bằng link & QR */}
      <InviteTripModal
        isOpen={!!selectedTripForInvite}
        onClose={() => setSelectedTripForInvite(null)}
        trip={selectedTripForInvite}
      />
    </div>
  );
}
