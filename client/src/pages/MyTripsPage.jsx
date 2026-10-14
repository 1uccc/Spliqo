import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';
import { formatVND } from '../services/calculation';
import { 
  Compass, 
  Search, 
  Users, 
  Receipt, 
  ChevronRight, 
  Plus, 
  CheckCircle2, 
  Archive, 
  Clock,
  ArrowRight,
  Info,
  Check,
  Flag
} from 'lucide-react';

export default function MyTripsPage() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | ACTIVE | COMPLETED | ARCHIVED
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const data = await api.get('/trips');
      setTrips(data);
    } catch (err) {
      showToast(err.message || 'Lỗi khi tải danh sách chuyến đi', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const filtered = trips.filter((t) => {
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchQuery =
      !searchQuery ||
      t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tripCode?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchQuery;
  });

  return (
    <div className="space-y-6 animate-fade-in text-[#18181b]">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#18181b]">
            Tất cả chuyến đi (All Trips)
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Lịch sử toàn bộ các chuyến đi, hoạt động nhóm và sự kiện chia sẻ chi tiêu của bạn
          </p>
        </div>

        <Link
          to="/dashboard"
          className="tactile-btn-dark self-start sm:self-center"
        >
          <Plus className="w-4 h-4" /> Tạo chuyến đi mới
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Pills matching design */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {[
            { id: 'ALL', label: 'Tất cả', count: trips.length },
            { id: 'ACTIVE', label: 'Đang diễn ra', count: trips.filter(t => t.status !== 'COMPLETED' && t.status !== 'ARCHIVED').length },
            { id: 'COMPLETED', label: 'Đã chốt sổ', count: trips.filter(t => t.status === 'COMPLETED').length },
            { id: 'ARCHIVED', label: 'Lưu trữ', count: trips.filter(t => t.status === 'ARCHIVED').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`tactile-tab ${statusFilter === tab.id ? 'active-purple' : ''}`}
            >
              <span>{tab.label}</span>
              <span className="w-5 h-5 rounded-full bg-white/80 text-[11px] font-bold flex items-center justify-center border border-black/5">
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
            placeholder="Tìm theo tên, mã trip..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-full bg-white border border-[#e6e4dc] text-xs text-[#18181b] outline-none focus:border-zinc-900 transition-colors"
          />
        </div>
      </div>

      {/* Trips Grid in Tactile Bento Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-64 bg-white rounded-3xl border border-[#e6e4dc] animate-pulse p-5" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-[#e6e4dc] shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#f4f3ec] text-zinc-500 mx-auto flex items-center justify-center">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-[#18181b] text-base">Không tìm thấy chuyến đi nào</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Không có kết quả phù hợp với bộ lọc trạng thái hoặc từ khóa tìm kiếm.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((trip) => {
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

                  {/* 2 Micro-boxes */}
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

                  <h3 className="font-bold text-sm text-[#18181b] line-clamp-1 mt-1">
                    {trip.name}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2 min-h-[32px]">
                    {trip.description || 'Chuyến đi cùng bạn bè, chia sẻ chi phí ăn uống và du lịch sòng phẳng.'}
                  </p>
                </div>

                {/* Footer Buttons */}
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
    </div>
  );
}
