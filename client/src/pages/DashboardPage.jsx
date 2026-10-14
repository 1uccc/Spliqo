import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {/* Tab 1: All trips */}
          <button
            onClick={() => setActiveTab('ALL')}
            className={`tactile-tab ${activeTab === 'ALL' ? 'active-purple' : ''}`}
          >
            <Compass className="w-4 h-4 text-zinc-500" />
            <span>Tất cả chuyến đi</span>
            <span className="w-5 h-5 rounded-full bg-white/80 text-[11px] font-bold flex items-center justify-center border border-black/5">
              {trips.length}
            </span>
          </button>

          {/* Tab 2: Active */}
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`tactile-tab ${activeTab === 'ACTIVE' ? 'active-purple' : ''}`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Đang diễn ra</span>
            <span className="w-5 h-5 rounded-full bg-white/80 text-[11px] font-bold flex items-center justify-center border border-black/5">
              {trips.filter(t => t.status !== 'COMPLETED' && t.status !== 'ARCHIVED').length}
            </span>
          </button>

          {/* Tab 3: Need settlement */}
          <button
            onClick={() => setActiveTab('SETTLEMENT')}
            className={`tactile-tab ${activeTab === 'SETTLEMENT' ? 'active-purple' : ''}`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <span>Chờ quyết toán</span>
            <span className="w-5 h-5 rounded-full bg-purple-200/80 text-purple-900 text-[11px] font-bold flex items-center justify-center">
              {trips.filter(t => t.status !== 'COMPLETED').length}
            </span>
          </button>
        </div>

        {/* Right Status Pill (Matching reference: "Offer resolved - Moved to Under review") */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200 shadow-xs self-start md:self-auto text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Công nợ đã cân bằng • Sẵn sàng VietQR</span>
        </div>
      </div>

      {/* 2. Top Stats Overview (Tactile Bento Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Tổng chuyến đi"
          value={stats.totalTrips}
          icon={Compass}
          color="slate"
          subtitle="Các nhóm & hoạt động của bạn"
        />

        <StatCard
          title="Bạn cần trả (You Owe)"
          value={formatVND(stats.youOwe)}
          icon={TrendingDown}
          color="rose"
          subtitle={stats.youOwe > 0 ? "Số tiền bạn đang nợ thành viên khác" : "Tuyệt vời, bạn không nợ ai!"}
        />

        <StatCard
          title="Bạn sẽ nhận (You Will Receive)"
          value={formatVND(stats.youWillReceive)}
          icon={TrendingUp}
          color="emerald"
          subtitle={stats.youWillReceive > 0 ? "Khoản bạn cần nhận lại từ nhóm" : "Không có khoản tiền chờ nhận"}
        />
      </div>

      {/* 3. Section Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#18181b]">
            Cần bạn chú ý (Active Trips)
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Danh sách các chuyến đi và khoản chi tiêu nhóm đang được theo dõi trực tiếp
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="tactile-btn-dark"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo chuyến đi</span>
          </button>

          <button
            onClick={() => setJoinModalOpen(true)}
            className="tactile-btn-pill border border-[#e6e4dc]"
          >
            <LogIn className="w-4 h-4" />
            <span>Nhập mã</span>
          </button>
        </div>
      </div>

      {/* 4. Bento Cards Grid (3 Columns matching reference design) */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-64 bg-white rounded-3xl border border-[#e6e4dc] animate-pulse p-5" />
          ))}
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-[#e6e4dc] shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#f4f3ec] text-zinc-600 mx-auto flex items-center justify-center">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-[#18181b] text-base">Chưa có chuyến đi nào trong mục này</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Bấm tạo chuyến đi mới để bắt đầu thêm hóa đơn và chia tiền tự động với bạn bè!
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="tactile-btn-dark mt-2"
          >
            <Plus className="w-4 h-4" /> Tạo chuyến đi ngay
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
                      <div className="w-9 h-9 rounded-full bg-[#18181b] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        {trip.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#18181b] line-clamp-1">
                          {trip.name}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          #{trip.tripCode}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      <Flag className="w-3 h-3" />
                      {isCompleted ? 'Đã chốt sổ' : 'Cần quyết toán'}
                    </span>
                  </div>

                  {/* 2 Side-by-side Micro-Cards (Exact match to reference!) */}
                  <div className="grid grid-cols-2 gap-2 my-3">
                    <div className="tactile-chip p-2.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mb-1">
                        <Receipt className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Tổng chi</span>
                      </div>
                      <div className="text-xs font-extrabold text-[#18181b] truncate">
                        {formatVND(trip.totalExpense || 0)}
                      </div>
                    </div>

                    <div className="tactile-chip p-2.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mb-1">
                        <Users className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Thành viên</span>
                      </div>
                      <div className="text-xs font-extrabold text-[#18181b] truncate">
                        {trip.memberCount || 1} người • {trip.expenseCount || 0} chi
                      </div>
                    </div>
                  </div>

                  {/* Trip Title & Description */}
                  <h3 className="font-bold text-sm text-[#18181b] line-clamp-1 mt-1">
                    {trip.name}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2 min-h-[32px]">
                    {trip.description || 'Chuyến đi cùng bạn bè, chia sẻ chi phí ăn uống và du lịch sòng phẳng.'}
                  </p>
                </div>

                {/* Card Footer: Dual Pill Action Buttons (View details & Mark resolved) */}
                <div className="mt-4 pt-3 border-t border-[#e6e4dc] flex items-center justify-between gap-2">
                  <Link
                    to={`/trips/${trip.id}`}
                    className="tactile-btn-pill flex-1 justify-center text-xs"
                  >
                    <Info className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Xem chi tiết</span>
                  </Link>

                  <Link
                    to={`/trips/${trip.id}?tab=settlement`}
                    className="tactile-btn-dark flex-1 justify-center text-xs"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Quyết toán</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Trip */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Tạo chuyến đi mới">
        <form onSubmit={handleCreateTrip} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Tên chuyến đi / Nhóm *</label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Đà Lạt 3N2Đ, Ăn lẩu Haidilao..."
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#f4f3ec] border border-[#e6e4dc] text-sm text-[#18181b] outline-none focus:border-zinc-900 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Mô tả (Description)</label>
            <textarea
              rows={2}
              placeholder="Chuyến đi khám phá, nghỉ dưỡng cùng hội bạn thân..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-2xl bg-[#f4f3ec] border border-[#e6e4dc] text-sm text-[#18181b] outline-none focus:border-zinc-900 focus:bg-white transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Ngày bắt đầu</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-[#f4f3ec] border border-[#e6e4dc] text-xs text-[#18181b] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Ngày kết thúc</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-[#f4f3ec] border border-[#e6e4dc] text-xs text-[#18181b] outline-none"
              />
            </div>
          </div>

          <p className="text-[11px] text-zinc-400 italic">
            * Sau khi tạo, hệ thống sẽ tự động cấp một mã chuyến đi (Trip Code) để bạn gửi cho bạn bè cùng tham gia.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="tactile-btn-pill"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="tactile-btn-dark disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Tạo chuyến đi
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Join Trip */}
      <Modal isOpen={joinModalOpen} onClose={() => setJoinModalOpen(false)} title="Tham gia chuyến đi bằng mã">
        <form onSubmit={handleJoinTrip} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Nhập mã Trip Code *</label>
            <input
              type="text"
              required
              maxLength={8}
              placeholder="Ví dụ: DL26A8"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 rounded-2xl bg-[#f4f3ec] border border-[#e6e4dc] text-center text-lg font-mono font-bold tracking-widest uppercase outline-none focus:border-zinc-900 focus:bg-white transition-colors"
            />
          </div>

          <p className="text-[11px] text-zinc-400 text-center">
            Mã chuyến đi gồm các ký tự được trưởng nhóm chia sẻ.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setJoinModalOpen(false)}
              className="tactile-btn-pill"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="tactile-btn-dark disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              Tham gia ngay
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
