import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import TripCard from '../components/trip/TripCard';
import InviteTripModal from '../components/InviteTripModal';
import { formatVND } from '../services/calculation';
import { 
  Plus, 
  LogIn, 
  Compass, 
  TrendingDown, 
  TrendingUp, 
  Loader2, 
  Sparkles,
  Flag,
  ArrowRight
} from 'lucide-react';

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const { t, isEn } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalTrips: 0, youOwe: 0, youWillReceive: 0 });
  const [activeTab, setActiveTab] = useState('ALL'); // ALL | SETTLEMENT

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [selectedTripForInvite, setSelectedTripForInvite] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Create Trip form
  const [tripName, setTripName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Join Trip form
  const [joinCode, setJoinCode] = useState('');

  const fetchTripsAndStats = useCallback(async () => {
    try {
      setLoading(true);
      // Optimized 2-request aggregation
      const [tripsData, overview] = await Promise.all([
        api.get('/trips'),
        api.get('/settlements/overview').catch(() => null)
      ]);

      const tripsList = Array.isArray(tripsData) ? tripsData : [];
      setTrips(tripsList);

      setStats({
        totalTrips: tripsList.length,
        youOwe: overview?.totalDebt || 0,
        youWillReceive: overview?.totalReceivable || 0,
      });
    } catch (err) {
      console.error('Failed to load trips:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchTripsAndStats();
    }
  }, [currentUser, fetchTripsAndStats]);

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    if (!tripName.trim()) {
      showToast('Vui lòng nhập tên chuyến đi', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const newTrip = await api.post('/trips', {
        name: tripName,
        description,
        startDate,
        endDate,
      });

      showToast(`Tạo chuyến đi "${newTrip.name}" thành công! Mã: ${newTrip.tripCode}`, 'success');
      setCreateModalOpen(false);
      setTripName('');
      setDescription('');
      fetchTripsAndStats();
      navigate(`/trips/${newTrip.id}`);
    } catch (err) {
      showToast(err.message || 'Lỗi khi tạo chuyến đi', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinTrip = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      showToast('Vui lòng nhập mã chuyến đi', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/trips/join', {
        tripCode: joinCode.trim().toUpperCase(),
      });

      showToast(res.message || 'Tham gia chuyến đi thành công!', 'success');
      setJoinModalOpen(false);
      setJoinCode('');
      fetchTripsAndStats();
      if (res.trip?.id) {
        navigate(`/trips/${res.trip.id}`);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Requirement: Completed trips are HIDDEN from Dashboard, only ongoing trips are shown
  const ongoingTrips = trips.filter(t => t.status !== 'COMPLETED' && t.status !== 'ARCHIVED');
  const completedTripsCount = trips.filter(t => t.status === 'COMPLETED').length;

  // Requirement: Prioritize ongoing trips by newest first
  const sortedOngoingTrips = [...ongoingTrips].sort((a, b) => {
    const dateA = new Date(a.startDate || a.createdAt || 0).getTime();
    const dateB = new Date(b.startDate || b.createdAt || 0).getTime();
    if (dateB !== dateA) return dateB - dateA;
    return (b.id || '').localeCompare(a.id || '');
  });

  const filteredTrips = sortedOngoingTrips.filter(t => {
    if (activeTab === 'SETTLEMENT') {
      return (t.totalExpense || 0) > 0 || (t.expenseCount || 0) > 0;
    }
    return true; // 'ALL'
  });

  return (
    <div className="space-y-6 animate-fade-in text-[#18181b]">
      
      {/* 1. Segmented Tactile Tab Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full md:w-auto max-w-full shrink-0 flex-nowrap">
          {/* Tab 1: Ongoing trips */}
          <button
            onClick={() => setActiveTab('ALL')}
            className={`tactile-tab shrink-0 whitespace-nowrap ${activeTab === 'ALL' ? 'active-purple' : ''}`}
          >
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="whitespace-nowrap shrink-0">{t('activeTrips', 'Đang diễn ra')}</span>
            <span className="tactile-badge w-5 h-5 rounded-full bg-white/80 dark:bg-white/15 text-[11px] font-bold flex items-center justify-center border border-black/5 dark:border-white/10 shrink-0 leading-none dark:text-white">
              {sortedOngoingTrips.length}
            </span>
          </button>

          {/* Tab 2: Need settlement */}
          <button
            onClick={() => setActiveTab('SETTLEMENT')}
            className={`tactile-tab shrink-0 whitespace-nowrap ${activeTab === 'SETTLEMENT' ? 'active-purple' : ''}`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0"></span>
            <span className="whitespace-nowrap shrink-0">{t('needSettlement', 'Chờ quyết toán')}</span>
            <span className="tactile-badge w-5 h-5 rounded-full bg-purple-200/80 dark:bg-purple-800/80 text-purple-900 dark:text-purple-100 text-[11px] font-bold flex items-center justify-center shrink-0 leading-none">
              {sortedOngoingTrips.filter(t => (t.totalExpense || 0) > 0 || (t.expenseCount || 0) > 0).length}
            </span>
          </button>

          {/* Link to Completed Trips in MyTrips */}
          {completedTripsCount > 0 && (
            <Link
              to="/trips"
              className="tactile-tab shrink-0 whitespace-nowrap hover:text-emerald-700 dark:hover:text-emerald-300 group border border-dashed border-emerald-300/80 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20"
              title={isEn ? "View completed trips in My Trips" : "Xem các chuyến đi đã chốt sổ trong mục Chuyến đi"}
            >
              <Flag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="whitespace-nowrap shrink-0 text-emerald-800 dark:text-emerald-300 font-semibold">{t('completedTrips', 'Đã chốt sổ')}</span>
              <span className="tactile-badge w-5 h-5 rounded-full bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 text-[11px] font-bold flex items-center justify-center shrink-0 leading-none">
                {completedTripsCount}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      </div>

      {/* 2. Top Stats Overview (Tactile Bento Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title={t('activeTripsTitle', 'Chuyến đi hoạt động')}
          value={sortedOngoingTrips.length}
          icon={Compass}
          color="slate"
          subtitle={completedTripsCount > 0 ? (isEn ? `${completedTripsCount} completed trip(s) (view in My Trips)` : `${completedTripsCount} chuyến đã chốt sổ (xem trong mục Chuyến đi)`) : t('yourGroupsAndActivities', 'Các nhóm & hoạt động của bạn')}
        />

        <StatCard
          title={t('youOweTitle', 'Bạn cần trả')}
          value={formatVND(stats.youOwe)}
          icon={TrendingDown}
          color="rose"
          subtitle={stats.youOwe > 0 ? t('oweOthersDesc', 'Số tiền bạn đang nợ thành viên khác') : t('noDebtDesc', 'Tuyệt vời, bạn không nợ ai!')}
        />

        <StatCard
          title={t('youWillReceiveTitle', 'Bạn sẽ nhận')}
          value={formatVND(stats.youWillReceive)}
          icon={TrendingUp}
          color="emerald"
          subtitle={stats.youWillReceive > 0 ? t('receiveBackDesc', 'Khoản bạn cần nhận lại từ nhóm') : t('noReceiveDesc', 'Không có khoản tiền chờ nhận')}
        />
      </div>

      {/* 3. Section Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#18181b] dark:text-white">
            {t('activeTripsSectionTitle', 'Chuyến đi đang diễn ra')}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {t('activeTripsSubtitle', 'Chạm vào bất kỳ chuyến đi nào để xem chi tiết chi phí và danh sách thành viên')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="tactile-btn-dark cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('createTrip', 'Tạo chuyến đi')}</span>
          </button>

          <button
            onClick={() => setJoinModalOpen(true)}
            className="tactile-btn-pill border border-[#e6e4dc] dark:border-[#32323e] dark:bg-[#24242d] dark:text-white dark:hover:bg-[#2e2e38] cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>{t('joinTrip', 'Nhập mã')}</span>
          </button>
        </div>
      </div>

      {/* 4. Bento Cards Grid with distinct pastel themes */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-64 bg-white dark:bg-[#1a1a20] rounded-3xl border border-[#e6e4dc] dark:border-[#2e2e38] animate-pulse p-5" />
          ))}
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#1a1a20] border border-[#e6e4dc] dark:border-[#2e2e38] shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#f4f3ec] dark:bg-[#252530] text-zinc-600 dark:text-zinc-400 mx-auto flex items-center justify-center">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-[#18181b] dark:text-white text-base">
            {t('noActiveTripsTitle', 'Không có chuyến đi đang diễn ra')}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            {completedTripsCount > 0 
              ? (isEn ? `You have ${completedTripsCount} completed trip(s) in My Trips. Create a new trip to start your next journey!` : `Bạn có ${completedTripsCount} chuyến đi đã chốt sổ trong mục Chuyến đi. Bấm tạo mới để bắt đầu chuyến đi tiếp theo!`)
              : t('noTripsInCategoryDesc', 'Bấm tạo chuyến đi mới để bắt đầu thêm hóa đơn và chia tiền tự động với bạn bè!')}
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="tactile-btn-dark cursor-pointer"
            >
              <Plus className="w-4 h-4" /> {t('createTripNow', 'Tạo chuyến đi ngay')}
            </button>
            {completedTripsCount > 0 && (
              <Link
                to="/trips"
                className="tactile-btn-pill cursor-pointer"
              >
                <Flag className="w-4 h-4 text-emerald-500" />
                <span>{isEn ? 'View completed' : 'Xem chuyến đã chốt'}</span>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTrips.slice(0, 6).map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onShare={setSelectedTripForInvite}
              t={t}
            />
          ))}
        </div>
      )}

      {/* 5. Helpful Banner for Completed Trips */}
      {completedTripsCount > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-3xl bg-white/70 dark:bg-[#1a1a20]/70 border border-[#e6e4dc] dark:border-[#2e2e38] shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100/80 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
              <Flag className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-900 dark:text-white">
                {completedTripsCount} {isEn ? 'trip(s) successfully completed' : 'chuyến đi đã chốt sổ thành công'}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {t('completedTripsHint', 'Chuyến đi đã chốt sổ được lưu trữ gọn gàng trong mục "Chuyến đi" để giữ Trang tổng quan luôn tập trung vào các chuyến đang diễn ra.')}
              </p>
            </div>
          </div>
          <Link
            to="/trips"
            className="tactile-btn-pill text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 self-end sm:self-center shrink-0"
          >
            <span>{isEn ? 'View all trips' : 'Xem tất cả chuyến đi'}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
      )}

      {/* Modal: Create Trip */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={t('createTrip', 'Tạo chuyến đi mới')}
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="tactile-btn-pill px-4 py-2 text-xs font-semibold cursor-pointer"
            >
              {t('cancel', 'Hủy')}
            </button>
            <button
              type="submit"
              form="dashboard-create-trip-form"
              disabled={submitting}
              className="tactile-btn-dark px-4 py-2 text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {t('createTrip', 'Tạo chuyến đi')}
            </button>
          </div>
        }
      >
        <form id="dashboard-create-trip-form" onSubmit={handleCreateTrip} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">{t('tripNameGroupRequired', 'Tên chuyến đi / Nhóm *')}</label>
            <input
              type="text"
              required
              placeholder={t('tripNamePlaceholder', 'Ví dụ: Đà Lạt 3N2Đ, Ăn lẩu Haidilao...')}
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#f4f3ec] dark:bg-[#212129] border border-[#e6e4dc] dark:border-[#32323e] text-sm text-[#18181b] dark:text-white outline-none focus:border-zinc-900 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">{t('shortDescription', 'Mô tả ngắn')}</label>
            <textarea
              rows={2}
              placeholder={t('tripDescPlaceholder', 'Chuyến đi khám phá, nghỉ dưỡng cùng hội bạn thân...')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-2xl bg-[#f4f3ec] dark:bg-[#212129] border border-[#e6e4dc] dark:border-[#32323e] text-sm text-[#18181b] dark:text-white outline-none focus:border-zinc-900 focus:bg-white transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">{t('startDate', 'Ngày bắt đầu')}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-[#f4f3ec] dark:bg-[#212129] border border-[#e6e4dc] dark:border-[#32323e] text-xs text-[#18181b] dark:text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">{t('endDate', 'Ngày kết thúc')}</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-[#f4f3ec] dark:bg-[#212129] border border-[#e6e4dc] dark:border-[#32323e] text-xs text-[#18181b] dark:text-white outline-none"
              />
            </div>
          </div>

          <p className="text-[11px] text-zinc-400 italic">
            {t('autoTripCodeHint', '* Sau khi tạo, hệ thống sẽ tự động cấp một mã chuyến đi để bạn gửi cho bạn bè cùng tham gia.')}
          </p>
        </form>
      </Modal>

      {/* Modal: Join Trip */}
      <Modal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        title={t('joinTripWithCode', 'Tham gia chuyến đi bằng mã')}
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setJoinModalOpen(false)}
              className="tactile-btn-pill px-4 py-2 text-xs font-semibold cursor-pointer"
            >
              {t('cancel', 'Hủy')}
            </button>
            <button
              type="submit"
              form="dashboard-join-trip-form"
              disabled={submitting}
              className="tactile-btn-dark px-4 py-2 text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              {t('joinNow', 'Tham gia ngay')}
            </button>
          </div>
        }
      >
        <form id="dashboard-join-trip-form" onSubmit={handleJoinTrip} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">{t('enterTripCodeRequired', 'Nhập mã Trip Code *')}</label>
            <input
              type="text"
              required
              maxLength={8}
              placeholder={t('enterTripCodePlaceholder', 'Ví dụ: DL26A8')}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 rounded-2xl bg-[#f4f3ec] dark:bg-[#212129] border border-[#e6e4dc] dark:border-[#32323e] text-center text-lg font-mono font-bold tracking-widest uppercase outline-none focus:border-zinc-900 focus:bg-white transition-colors"
            />
          </div>

          <p className="text-[11px] text-zinc-400 text-center">
            {t('tripCodeHint', 'Mã chuyến đi gồm các ký tự được trưởng nhóm chia sẻ.')}
          </p>
        </form>
      </Modal>

      {/* Modal: Invite / Share Trip QR & Link */}
      <InviteTripModal
        isOpen={!!selectedTripForInvite}
        onClose={() => setSelectedTripForInvite(null)}
        trip={selectedTripForInvite}
      />
    </div>
  );
}
