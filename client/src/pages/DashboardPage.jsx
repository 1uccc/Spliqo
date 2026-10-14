import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import { formatVND } from '../services/calculation';
import { 
  Plus, 
  LogIn, 
  Compass, 
  TrendingDown, 
  TrendingUp, 
  Users, 
  Receipt, 
  Calendar, 
  ChevronRight, 
  Check, 
  Loader2, 
  Sparkles,
  ArrowRight,
  Info,
  CheckCircle2,
  Flag,
  Share2
} from 'lucide-react';

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalTrips: 0, youOwe: 0, youWillReceive: 0 });
  const [activeTab, setActiveTab] = useState('ALL'); // ALL | ACTIVE | SETTLEMENT

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Create Trip form
  const [tripName, setTripName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Join Trip form
  const [joinCode, setJoinCode] = useState('');

  const fetchTripsAndStats = async () => {
    try {
      setLoading(true);
      const tripsData = await api.get('/trips');
      setTrips(tripsData);

      // Aggregate global You Owe & You Will Receive across all trips
      let totalOwe = 0;
      let totalReceive = 0;

      await Promise.all(
        tripsData.map(async (t) => {
          try {
            const summary = await api.get(`/trips/${t.id}/balances`);
            const myBal = summary.members?.find((m) => m.userId === currentUser?.uid);
            if (myBal) {
              if (myBal.balance > 0) totalReceive += myBal.balance;
              if (myBal.balance < 0) totalOwe += Math.abs(myBal.balance);
            }
          } catch (e) {
            // ignore non-calculable trips
          }
        })
      );

      setStats({
        totalTrips: tripsData.length,
        youOwe: totalOwe,
        youWillReceive: totalReceive,
      });
    } catch (err) {
      console.error('Failed to load trips:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchTripsAndStats();
    }
  }, [currentUser]);

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

  // Filter trips based on active tactile tab
  const filteredTrips = trips.filter(t => {
    if (activeTab === 'ACTIVE') return t.status !== 'COMPLETED' && t.status !== 'ARCHIVED';
    if (activeTab === 'SETTLEMENT') return t.status !== 'ARCHIVED';
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in text-[#18181b]">
      
      {/* 1. Segmented Tactile Tab Bar (Exact match to reference design!) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full md:w-auto max-w-full shrink-0 flex-nowrap">
          {/* Tab 1: All trips */}
          <button
            onClick={() => setActiveTab('ALL')}
            className={`tactile-tab shrink-0 whitespace-nowrap ${activeTab === 'ALL' ? 'active-purple' : ''}`}
          >
            <Compass className="w-4 h-4 text-zinc-500 shrink-0" />
            <span className="whitespace-nowrap shrink-0">{t('allTrips', 'Tất cả chuyến đi')}</span>
            <span className="tactile-badge w-5 h-5 rounded-full bg-white/80 dark:bg-white/15 text-[11px] font-bold flex items-center justify-center border border-black/5 dark:border-white/10 shrink-0 leading-none dark:text-white">
              {trips.length}
            </span>
          </button>

          {/* Tab 2: Active */}
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`tactile-tab shrink-0 whitespace-nowrap ${activeTab === 'ACTIVE' ? 'active-purple' : ''}`}
          >
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="whitespace-nowrap shrink-0">{t('active', 'Đang diễn ra')}</span>
            <span className="tactile-badge w-5 h-5 rounded-full bg-white/80 dark:bg-white/15 text-[11px] font-bold flex items-center justify-center border border-black/5 dark:border-white/10 shrink-0 leading-none dark:text-white">
              {trips.filter(t => t.status !== 'COMPLETED' && t.status !== 'ARCHIVED').length}
            </span>
          </button>

          {/* Tab 3: Need settlement */}
          <button
            onClick={() => setActiveTab('SETTLEMENT')}
            className={`tactile-tab shrink-0 whitespace-nowrap ${activeTab === 'SETTLEMENT' ? 'active-purple' : ''}`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0"></span>
            <span className="whitespace-nowrap shrink-0">{t('needSettlement', 'Chờ quyết toán')}</span>
            <span className="tactile-badge w-5 h-5 rounded-full bg-purple-200/80 dark:bg-purple-800/80 text-purple-900 dark:text-purple-100 text-[11px] font-bold flex items-center justify-center shrink-0 leading-none">
              {trips.filter(t => t.status !== 'COMPLETED').length}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Top Stats Overview (Tactile Bento Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title={t('totalTrips', 'Tổng chuyến đi')}
          value={stats.totalTrips}
          icon={Compass}
          color="slate"
          subtitle={t('yourGroupsAndActivities', 'Các nhóm & hoạt động của bạn')}
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
            {t('activeTripsTitle', 'Cần bạn chú ý')}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {t('activeTripsSubtitle', 'Danh sách các chuyến đi và khoản chi tiêu nhóm đang được theo dõi trực tiếp')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="tactile-btn-dark"
          >
            <Plus className="w-4 h-4" />
            <span>{t('createTrip', 'Tạo chuyến đi')}</span>
          </button>

          <button
            onClick={() => setJoinModalOpen(true)}
            className="tactile-btn-pill border border-[#e6e4dc] dark:border-[#32323e] dark:bg-[#24242d] dark:text-white dark:hover:bg-[#2e2e38]"
          >
            <LogIn className="w-4 h-4" />
            <span>{t('joinTrip', 'Nhập mã')}</span>
          </button>
        </div>
      </div>

      {/* 4. Bento Cards Grid (3 Columns matching reference design) */}
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
          <h3 className="font-bold text-[#18181b] dark:text-white text-base">{t('noTripsInCategory', 'Chưa có chuyến đi nào trong mục này')}</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            {t('noTripsInCategoryDesc', 'Bấm tạo chuyến đi mới để bắt đầu thêm hóa đơn và chia tiền tự động với bạn bè!')}
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="tactile-btn-dark mt-2"
          >
            <Plus className="w-4 h-4" /> {t('createTripNow', 'Tạo chuyến đi ngay')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTrips.slice(0, 6).map((trip) => {
            const isCompleted = trip.status === 'COMPLETED';
            return (
              <div
                key={trip.id}
                className="tactile-card p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Brand / Avatar + Priority/Status Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] flex items-center justify-center font-black text-xs shadow-xs">
                        {trip.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#18181b] dark:text-white line-clamp-1">
                          {trip.name}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-400">
                          #{trip.tripCode}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border dark:border-emerald-800/40'
                          : 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 dark:border dark:border-purple-800/40'
                      }`}
                    >
                      <Flag className="w-3 h-3" />
                      {isCompleted ? t('completed', 'Đã chốt sổ') : t('needSettlement', 'Cần quyết toán')}
                    </span>
                  </div>

                  {/* 2 Side-by-side Micro-Cards (Exact match to reference!) */}
                  <div className="grid grid-cols-2 gap-2 my-3">
                    <div className="tactile-chip p-2.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                        <Receipt className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{t('totalExpense', 'Tổng chi')}</span>
                      </div>
                      <div className="text-xs font-extrabold text-[#18181b] dark:text-white truncate">
                        {formatVND(trip.totalExpense || 0)}
                      </div>
                    </div>

                    <div className="tactile-chip p-2.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                        <Users className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{t('membersCount', 'Thành viên')}</span>
                      </div>
                      <div className="text-xs font-extrabold text-[#18181b] dark:text-white truncate">
                        {trip.memberCount || 1} {t('membersUnit', 'người')} • {trip.expenseCount || 0} {t('expensesUnit', 'chi')}
                      </div>
                    </div>
                  </div>

                  {/* Trip Title & Description */}
                  <h3 className="font-bold text-sm text-[#18181b] dark:text-white line-clamp-1 mt-1">
                    {trip.name}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 min-h-[32px]">
                    {trip.description || 'Chuyến đi cùng bạn bè, chia sẻ chi phí ăn uống và du lịch sòng phẳng.'}
                  </p>
                </div>

                {/* Card Footer: Dual Pill Action Buttons (View details & Mark resolved) */}
                <div className="mt-4 pt-3 border-t border-[#e6e4dc] dark:border-[#2e2e38] flex items-center justify-between gap-2">
                  <Link
                    to={`/trips/${trip.id}`}
                    className="tactile-btn-pill flex-1 justify-center text-xs"
                  >
                    <Info className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                    <span>{t('viewDetails', 'Xem chi tiết')}</span>
                  </Link>

                  <Link
                    to={`/trips/${trip.id}?tab=settlement`}
                    className="tactile-btn-dark flex-1 justify-center text-xs"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                    <span>{t('settleNow', 'Quyết toán')}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Trip */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title={t('createTrip', 'Tạo chuyến đi mới')}>
        <form onSubmit={handleCreateTrip} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">{t('tripNameGroupRequired', 'Tên chuyến đi / Nhóm *')}</label>
            <input
              type="text"
              required
              placeholder={t('tripNamePlaceholder', 'Ví dụ: Đà Lạt 3N2Đ, Ăn lẩu Haidilao...')}
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#f4f3ec] border border-[#e6e4dc] text-sm text-[#18181b] outline-none focus:border-zinc-900 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">{t('shortDescription', 'Mô tả ngắn')}</label>
            <textarea
              rows={2}
              placeholder={t('tripDescPlaceholder', 'Chuyến đi khám phá, nghỉ dưỡng cùng hội bạn thân...')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-2xl bg-[#f4f3ec] border border-[#e6e4dc] text-sm text-[#18181b] outline-none focus:border-zinc-900 focus:bg-white transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">{t('startDate', 'Ngày bắt đầu')}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-[#f4f3ec] border border-[#e6e4dc] text-xs text-[#18181b] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">{t('endDate', 'Ngày kết thúc')}</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-[#f4f3ec] border border-[#e6e4dc] text-xs text-[#18181b] outline-none"
              />
            </div>
          </div>

          <p className="text-[11px] text-zinc-400 italic">
            {t('autoTripCodeHint', '* Sau khi tạo, hệ thống sẽ tự động cấp một mã chuyến đi để bạn gửi cho bạn bè cùng tham gia.')}
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="tactile-btn-pill"
            >
              {t('cancel', 'Hủy')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="tactile-btn-dark disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {t('createTrip', 'Tạo chuyến đi')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Join Trip */}
      <Modal isOpen={joinModalOpen} onClose={() => setJoinModalOpen(false)} title={t('joinTripWithCode', 'Tham gia chuyến đi bằng mã')}>
        <form onSubmit={handleJoinTrip} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">{t('enterTripCodeRequired', 'Nhập mã Trip Code *')}</label>
            <input
              type="text"
              required
              maxLength={8}
              placeholder={t('enterTripCodePlaceholder', 'Ví dụ: DL26A8')}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 rounded-2xl bg-[#f4f3ec] border border-[#e6e4dc] text-center text-lg font-mono font-bold tracking-widest uppercase outline-none focus:border-zinc-900 focus:bg-white transition-colors"
            />
          </div>

          <p className="text-[11px] text-zinc-400 text-center">
            {t('tripCodeHint', 'Mã chuyến đi gồm các ký tự được trưởng nhóm chia sẻ.')}
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setJoinModalOpen(false)}
              className="tactile-btn-pill"
            >
              {t('cancel', 'Hủy')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="tactile-btn-dark disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              {t('joinNow', 'Tham gia ngay')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
