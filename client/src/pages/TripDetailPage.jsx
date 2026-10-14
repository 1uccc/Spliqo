import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';
import { formatVND, calculateLiveShares } from '../services/calculation';
import Modal from '../components/Modal';
import CameraModal from '../components/CameraModal';
import VietQRModal from '../components/VietQRModal';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Plus, 
  Receipt, 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Search, 
  Filter, 
  Sparkles, 
  ShieldCheck, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Camera, 
  CheckCircle2, 
  Clock, 
  Building, 
  UserCheck, 
  Share2,
  AlertCircle
} from 'lucide-react';

export default function TripDetailPage() {
  const { tripId } = useParams();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Tab: overview | expenses | members | settlement
  const [activeTab, setActiveTab] = useState('overview');

  // Copy code feedback
  const [copiedCode, setCopiedCode] = useState(false);

  // Expense filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayerFilter, setSelectedPayerFilter] = useState('');
  const [sortBy, setSortBy] = useState('date'); // date | amount

  // Modals state
  const [addExpenseModalOpen, setAddExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [viewExpenseModalOpen, setViewExpenseModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [vietQrModalOpen, setVietQrModalOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Expense Form State
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expPaidBy, setExpPaidBy] = useState('');
  const [expParticipants, setExpParticipants] = useState([]);
  const [expSplitType, setExpSplitType] = useState('equal'); // equal | custom
  const [expIndividualAmounts, setExpIndividualAmounts] = useState({});
  const [expBillImageUrl, setExpBillImageUrl] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expNote, setExpNote] = useState('');

  // Fetch all trip data
  const loadTripData = async () => {
    try {
      setLoading(true);
      const tripData = await api.get(`/trips/${tripId}`);
      setTrip(tripData);
      setMembers(tripData.members || []);
      setExpenses(tripData.expenses || []);

      // Load balances and settlements
      const balData = await api.get(`/trips/${tripId}/balances`);
      setBalances(balData);

      const settleData = await api.get(`/trips/${tripId}/settlements`);
      setSettlements(settleData.settlements || []);

      // If all settlements confirmed, trigger confetti once
      if (settleData.allSettled && settleData.settlements?.length > 0) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      showToast(err.message || 'Lỗi khi tải thông tin chuyến đi', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tripId) {
      loadTripData();
    }
  }, [tripId, currentUser]);

  // Copy Trip Code
  const handleCopyCode = () => {
    if (!trip?.tripCode) return;
    navigator.clipboard.writeText(trip.tripCode);
    setCopiedCode(true);
    showToast(`Đã sao chép mã ${trip.tripCode} vào bộ nhớ tạm!`, 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Open Add Expense modal
  const handleOpenAddExpense = () => {
    setEditingExpense(null);
    setExpTitle('');
    setExpAmount('');
    setExpPaidBy(currentUser?.uid || members[0]?.userId || '');
    const allMemberIds = members.map((m) => m.userId);
    setExpParticipants(allMemberIds);
    setExpSplitType('equal');
    setExpIndividualAmounts({});
    setExpBillImageUrl('');
    setExpDate(new Date().toISOString().split('T')[0]);
    setExpNote('');
    setAddExpenseModalOpen(true);
  };

  // Open Edit Expense modal
  const handleOpenEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpTitle(expense.title);
    setExpAmount(expense.amount);
    setExpPaidBy(expense.paidBy);
    setExpParticipants(expense.participants || []);
    setExpSplitType(expense.splitType || 'equal');
    setExpIndividualAmounts(expense.individualAmounts || {});
    setExpBillImageUrl(expense.billImageUrl || '');
    setExpDate(expense.date || new Date().toISOString().split('T')[0]);
    setExpNote(expense.note || '');
    setViewExpenseModalOpen(false);
    setAddExpenseModalOpen(true);
  };

  // Toggle participant
  const toggleParticipant = (userId) => {
    setExpParticipants((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAllParticipants = () => {
    setExpParticipants(members.map((m) => m.userId));
  };

  const handleClearAllParticipants = () => {
    setExpParticipants([]);
  };

  // Calculate live preview for custom split
  const liveShares = calculateLiveShares({
    amount: expAmount,
    participants: expParticipants,
    splitType: expSplitType,
    individualAmounts: expIndividualAmounts,
  });

  // Save Expense (Create or Update)
  const handleSaveExpense = async (e) => {
    e.preventDefault();

    const numAmount = Math.round(Number(expAmount) || 0);
    if (!expTitle.trim()) {
      showToast('Vui lòng nhập tên khoản chi', 'error');
      return;
    }
    if (numAmount <= 0) {
      showToast('Số tiền chi tiêu phải lớn hơn 0', 'error');
      return;
    }
    if (!expPaidBy) {
      showToast('Vui lòng chọn người thanh toán', 'error');
      return;
    }
    if (expParticipants.length === 0) {
      showToast('Vui lòng chọn ít nhất một người tham gia', 'error');
      return;
    }

    if (expSplitType === 'custom') {
      if (!liveShares.isValid) {
        showToast(
          liveShares.remaining > 0
            ? `Tổng tiền chia còn thiếu ${formatVND(liveShares.remaining)}`
            : `Tổng tiền chia đã vượt quá ${formatVND(Math.abs(liveShares.remaining))}`,
          'error'
        );
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        title: expTitle.trim(),
        amount: numAmount,
        paidBy: expPaidBy,
        participants: expParticipants,
        splitType: expSplitType,
        individualAmounts: expSplitType === 'custom' ? expIndividualAmounts : {},
        billImageUrl: expBillImageUrl,
        note: expNote.trim(),
        date: expDate,
      };

      if (editingExpense) {
        await api.put(`/trips/${tripId}/expenses/${editingExpense.id}`, payload);
        showToast('Cập nhật khoản chi thành công!', 'success');
      } else {
        await api.post(`/trips/${tripId}/expenses`, payload);
        showToast('Thêm khoản chi mới thành công!', 'success');
      }

      setAddExpenseModalOpen(false);
      loadTripData();
    } catch (err) {
      showToast(err.message || 'Lỗi lưu khoản chi', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khoản chi này?')) return;
    try {
      await api.delete(`/trips/${tripId}/expenses/${expenseId}`);
      showToast('Đã xóa khoản chi thành công', 'success');
      setViewExpenseModalOpen(false);
      loadTripData();
    } catch (err) {
      showToast(err.message || 'Lỗi khi xóa khoản chi', 'error');
    }
  };

  // Mark Settlement as Paid (by Debtor)
  const handleMarkAsPaid = async (settlement) => {
    try {
      await api.post(`/trips/${tripId}/settlements/${settlement.id}/pay`, {
        fromUserId: settlement.fromUserId,
        toUserId: settlement.toUserId,
        amount: settlement.amount,
      });
      loadTripData();
    } catch (err) {
      throw err;
    }
  };

  // Confirm Settlement Payment (by Creditor/Receiver)
  const handleConfirmPayment = async (settlement) => {
    try {
      await api.post(`/trips/${tripId}/settlements/${settlement.id}/confirm`, {
        toUserId: settlement.toUserId,
      });
      showToast('Xác nhận nhận tiền thành công! Giao dịch đã được chốt.', 'success');
      confetti({ particleCount: 50, spread: 60 });
      loadTripData();
    } catch (err) {
      showToast(err.message || 'Lỗi khi xác nhận thanh toán', 'error');
    }
  };

  // Complete Trip
  const handleCompleteTrip = async () => {
    if (!window.confirm('Bạn có muốn đánh dấu hoàn thành chuyến đi? Hệ thống sẽ chuyển sang màn hình tổng kết quyết toán.')) return;
    try {
      await api.post(`/trips/${tripId}/complete`);
      showToast('Chuyến đi đã được hoàn thành!', 'success');
      setActiveTab('settlement');
      loadTripData();
    } catch (err) {
      showToast(err.message || 'Lỗi khi hoàn thành chuyến đi', 'error');
    }
  };

  // Filtered & sorted expenses
  const filteredExpenses = expenses
    .filter((e) => {
      const matchQuery =
        !searchQuery ||
        e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.note?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchPayer = !selectedPayerFilter || e.paidBy === selectedPayerFilter;
      return matchQuery && matchPayer;
    })
    .sort((a, b) => {
      if (sortBy === 'amount') return b.amount - a.amount;
      return new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime();
    });

  if (loading && !trip) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500 font-medium">Đang tải dữ liệu chuyến đi...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="py-20 text-center">
        <p className="text-base text-slate-600 font-semibold mb-4">Không tìm thấy thông tin chuyến đi.</p>
        <Link to="/dashboard" className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-500/25">
          Về trang chủ
        </Link>
      </div>
    );
  }

  const isCreator = trip.createdBy === currentUser?.uid;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors px-3 py-1.5 rounded-2xl hover:bg-white/50"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại (Back)
        </Link>

        {isCreator && trip.status === 'ACTIVE' && (
          <button
            onClick={handleCompleteTrip}
            className="text-xs font-bold px-4 py-2 rounded-2xl border border-emerald-400/50 text-emerald-700 hover:bg-emerald-500/10 transition-all backdrop-blur-sm"
          >
            Chốt chuyến đi (Complete Trip)
          </button>
        )}
      </div>

      {/* Main Trip Header Card */}
      <div className="tactile-card p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                {trip.status === 'COMPLETED' ? 'Đã hoàn thành' : 'Đang hoạt động'}
              </span>

              {/* Trip Code Pill */}
              <div
                onClick={handleCopyCode}
                className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f4f3ec] hover:bg-[#eae8df] text-zinc-800 text-xs font-mono font-bold transition-all border border-[#e6e4dc]"
                title="Bấm để sao chép mã mời"
              >
                <span>Mã: #{trip.tripCode}</span>
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18181b] tracking-tight">
              {trip.name}
            </h1>

            {trip.description && (
              <p className="text-xs sm:text-sm text-zinc-500 max-w-xl">
                {trip.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-zinc-400 pt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {trip.startDate} → {trip.endDate}
              </span>
            </div>
          </div>

          {/* Quick Metrics & Add Expense button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="p-4 rounded-2xl bg-[#f4f3ec] border border-[#e6e4dc] flex items-center justify-between sm:justify-start gap-6">
              <div>
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Tổng chi phí</span>
                <div className="text-xl sm:text-2xl font-extrabold text-[#18181b]">
                  {formatVND(balances?.totalExpense || 0)}
                </div>
              </div>
              <div className="h-8 w-px bg-[#e6e4dc]" />
              <div className="text-right sm:text-left">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Quy mô</span>
                <div className="text-xs sm:text-sm font-bold text-zinc-800">
                  {members.length} Người • {expenses.length} Bill
                </div>
              </div>
            </div>

            <button
              onClick={handleOpenAddExpense}
              className="tactile-btn-dark py-3.5 px-5 text-sm"
            >
              <Plus className="w-4 h-4" />
              Thêm khoản chi
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Tactile Bento Pill Tabs) */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-[#e6e4dc] overflow-x-auto no-scrollbar py-1">
          {[
            { id: 'overview', label: 'Tổng quan', count: null, icon: DollarSign },
            { id: 'expenses', label: 'Khoản chi', count: expenses.length, icon: Receipt },
            { id: 'members', label: 'Thành viên', count: members.length, icon: Users },
            { id: 'settlement', label: 'Quyết toán VietQR', count: settlements.length, icon: Sparkles },
          ].map((tab) => {
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tactile-tab ${isTabActive ? 'active-purple' : ''}`}
              >
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${isTabActive ? 'bg-purple-200/80 text-purple-900' : 'bg-[#f4f3ec] text-zinc-600'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Invariant Verification Banner */}
          <div className="p-5 rounded-3xl liquid-glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ background: 'rgba(16, 185, 129, 0.08)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/25">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-emerald-900">
                  Chuẩn xác tài chính: Định luật cân bằng sổ sách
                </h4>
                <p className="text-[11px] sm:text-xs text-emerald-800">
                  Σ Đã trả ({formatVND(balances?.sumPaid || 0)}) = Σ Phải chịu ({formatVND(balances?.sumOwed || 0)}) = Tổng chi tiêu ({formatVND(balances?.totalExpense || 0)})
                </p>
              </div>
            </div>
            <span className="self-start sm:self-center text-[11px] font-bold px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full shadow-sm shadow-emerald-500/25">
              Tổng chênh lệch = {formatVND(balances?.sumBalance || 0)} (Cân bằng tuyệt đối ✓)
            </span>
          </div>

          {/* Top Payer Highlight */}
          {balances?.topPayer && (
            <div className="p-5 rounded-3xl liquid-glass-card flex items-center justify-between" style={{ background: 'linear-gradient(135deg, rgba(20,184,166,0.08), rgba(16,185,129,0.05))' }}>
              <div className="flex items-center gap-3">
                <img
                  src={balances.topPayer.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${balances.topPayer.userId}`}
                  alt=""
                  className="w-12 h-12 rounded-2xl bg-white/50 shadow-lg ring-2 ring-white/40"
                />
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">Người chi trả nhiều nhất</span>
                  <div className="text-base font-bold text-slate-900">{balances.topPayer.displayName}</div>
                  <div className="text-xs text-slate-500">Đã ứng trước thanh toán: <strong className="text-emerald-700">{formatVND(balances.topPayer.totalPaid)}</strong></div>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-xs text-slate-400">Trạng thái công nợ</span>
                <div className="text-sm font-extrabold text-emerald-600">
                  +{formatVND(balances.topPayer.balance)}
                </div>
              </div>
            </div>
          )}

          {/* Members Balance Table */}
          <div className="tactile-card overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e6e4dc] flex items-center justify-between bg-[#f4f3ec]">
              <h3 className="text-sm font-bold text-[#18181b]">Bảng cân đối công nợ từng thành viên</h3>
              <span className="text-xs text-zinc-500">Balance = Đã trả - Phải chịu</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider bg-[#faf9f6] border-b border-[#e6e4dc]">
                    <th className="py-3 px-6">Thành viên</th>
                    <th className="py-3 px-4 text-right">Đã trả (Paid)</th>
                    <th className="py-3 px-4 text-right">Phải chịu (Owed)</th>
                    <th className="py-3 px-6 text-right">Số dư (Balance)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/15">
                  {balances?.members?.map((m) => {
                    const isCreditor = m.balance > 0;
                    const isDebtor = m.balance < 0;
                    const isSettled = m.balance === 0;

                    return (
                      <tr key={m.userId} className="hover:bg-white/20 transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <img
                              src={m.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.userId}`}
                              alt=""
                              className="w-8 h-8 rounded-xl bg-white/50 ring-1 ring-white/30"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{m.displayName}</div>
                              {m.userId === currentUser?.uid && (
                                <span className="text-[10px] text-emerald-600 font-semibold">(Bạn)</span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                          {formatVND(m.totalPaid)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                          {formatVND(m.totalOwed)}
                        </td>

                        <td className="py-3.5 px-6 text-right">
                          <span
                            className={`font-mono font-bold px-3 py-1 rounded-xl text-xs sm:text-sm inline-block backdrop-blur-sm ${
                              isCreditor
                                ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-300/30'
                                : isDebtor
                                ? 'bg-rose-500/15 text-rose-700 border border-rose-300/30'
                                : 'bg-white/40 text-slate-600 border border-white/30'
                            }`}
                          >
                            {isCreditor ? `+${formatVND(m.balance)}` : isDebtor ? `-${formatVND(Math.abs(m.balance))}` : '0đ (Cân bằng)'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {/* Controls Bar: Search, Filter Payer, Sort */}
          <div className="tactile-card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Tìm khoản chi, ghi chú..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-full bg-[#f4f3ec] border border-[#e6e4dc] text-xs text-[#18181b] outline-none focus:border-zinc-900 focus:bg-white transition-colors"
              />
            </div>

            {/* Filter by Payer */}
            <div className="flex items-center gap-2">
              <select
                value={selectedPayerFilter}
                onChange={(e) => setSelectedPayerFilter(e.target.value)}
                className="px-3 py-2 rounded-full bg-[#f4f3ec] border border-[#e6e4dc] text-xs outline-none text-zinc-700"
              >
                <option value="">Tất cả người trả</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.displayName}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-full bg-[#f4f3ec] border border-[#e6e4dc] text-xs outline-none text-zinc-700"
              >
                <option value="date">Mới nhất</option>
                <option value="amount">Số tiền lớn nhất</option>
              </select>
            </div>
          </div>

          {/* Expenses List */}
          {filteredExpenses.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-[#e6e4dc] shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#f4f3ec] text-zinc-500 mx-auto flex items-center justify-center">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-[#18181b] text-base">Chưa có khoản chi nào</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                {expenses.length === 0
                  ? 'Hãy thêm khoản chi đầu tiên để bắt đầu theo dõi chi phí chuyến đi!'
                  : 'Không tìm thấy khoản chi phù hợp với điều kiện lọc.'}
              </p>
              <button
                onClick={handleOpenAddExpense}
                className="tactile-btn-dark mt-2"
              >
                <Plus className="w-4 h-4" /> Thêm khoản chi mới
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExpenses.map((expense) => {
                const payer = members.find((m) => m.userId === expense.paidBy);
                const participantCount = expense.participants?.length || 0;

                return (
                  <div
                    key={expense.id}
                    onClick={() => {
                      setSelectedExpense(expense);
                      setViewExpenseModalOpen(true);
                    }}
                    className="group tactile-card p-4 sm:p-5 cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Bill thumbnail or default icon */}
                      {expense.billImageUrl ? (
                        <img
                          src={expense.billImageUrl}
                          alt="Bill"
                          className="w-12 h-12 rounded-2xl object-cover border border-[#e6e4dc] shrink-0 shadow-xs"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-[#f4f3ec] text-zinc-700 border border-[#e6e4dc] flex items-center justify-center shrink-0">
                          <Receipt className="w-6 h-6" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-[#18181b] group-hover:text-emerald-700 transition-colors truncate text-sm sm:text-base">
                            {expense.title}
                          </h4>
                          {expense.splitType === 'custom' && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                              Chia tùy chỉnh
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1 flex-wrap">
                          <span>
                            Người trả:{' '}
                            <strong className="text-zinc-800">
                              {payer?.displayName || 'Thành viên'}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>{participantCount} người tham gia</span>
                          <span>•</span>
                          <span>{expense.date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base sm:text-lg font-extrabold text-[#18181b]">
                        {formatVND(expense.amount)}
                      </div>
                      <span className="text-[11px] text-zinc-400 group-hover:text-zinc-800 transition-colors font-medium">
                        Xem chi tiết →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: MEMBERS */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          {/* Invite Code Box */}
          <div className="tactile-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#f4f3ec]">
            <div>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Mời bạn bè tham gia</span>
              <h3 className="text-lg font-bold text-[#18181b] mt-0.5">Chia sẻ mã chuyến đi (Trip Code)</h3>
              <p className="text-xs text-zinc-500 mt-1">Gửi mã này cho các thành viên trong nhóm để họ tự nhập trên SplitMate.</p>
            </div>

            <div className="flex items-center gap-3 p-2 bg-white rounded-2xl border border-[#e6e4dc] shadow-xs">
              <span className="text-xl font-mono font-extrabold tracking-widest px-3 text-[#18181b]">
                {trip.tripCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="tactile-btn-dark py-2 px-3 text-xs"
                title="Sao chép mã"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>
          </div>

          {/* Members List */}
          <div className="tactile-card overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e6e4dc] bg-[#f4f3ec] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#18181b]">Danh sách thành viên ({members.length})</h3>
            </div>

            <div className="divide-y divide-[#e6e4dc]/70">
              {members.map((m) => {
                const isMemberCreator = m.role === 'Creator' || m.userId === trip.createdBy;

                return (
                  <div key={m.userId} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-[#f4f3ec]/50 transition-colors">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={m.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.userId}`}
                        alt=""
                        className="w-10 h-10 rounded-full bg-zinc-100 object-cover border border-[#e6e4dc]"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-[#18181b] text-sm">
                            {m.displayName}
                          </h4>
                          <span
                            className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                              isMemberCreator
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-[#f4f3ec] text-zinc-600'
                            }`}
                          >
                            {isMemberCreator ? 'Người tạo' : 'Thành viên'}
                          </span>
                        </div>

                        <div className="text-xs text-zinc-500 mt-0.5">
                          {m.bankName ? (
                            <span className="text-zinc-700 font-medium">
                              Ngân hàng: {m.bankName} • {m.bankAccountNumber} ({m.bankAccountHolder})
                            </span>
                          ) : (
                            <span className="text-zinc-400">Chưa cập nhật tài khoản ngân hàng</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions: remove member if creator */}
                    {isCreator && !isMemberCreator && (
                      <button
                        onClick={async () => {
                          if (!window.confirm(`Bạn có chắc muốn xóa thành viên ${m.displayName}?`)) return;
                          try {
                            await api.delete(`/trips/${tripId}/members/${m.userId}`);
                            showToast('Đã xóa thành viên khỏi chuyến đi', 'success');
                            loadTripData();
                          } catch (err) {
                            showToast(err.message, 'error');
                          }
                        }}
                        className="text-xs text-rose-600 hover:text-rose-700 font-semibold p-2 rounded-full hover:bg-rose-50 transition-all"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: SETTLEMENT */}
      {activeTab === 'settlement' && (
        <div className="space-y-6">
          {/* Settlement Summary Header */}
          <div className="tactile-card p-6 sm:p-8 space-y-4 bg-[#18181b] text-white">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> Báo cáo tất toán chi phí (Trip Settlement)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                <span className="text-xs text-zinc-400 font-medium">Tổng tiền chuyến đi</span>
                <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                  {formatVND(balances?.totalExpense || 0)}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                <span className="text-xs text-zinc-400 font-medium">Số thành viên</span>
                <div className="text-2xl font-extrabold text-white mt-1">
                  {members.length} người
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                <span className="text-xs text-zinc-400 font-medium">Giao dịch cần thực hiện</span>
                <div className="text-2xl font-extrabold text-teal-300 mt-1">
                  {settlements.length} chuyển khoản
                </div>
              </div>
            </div>
          </div>

          {/* Optimized Transactions (Who Pays Whom) */}
          <div className="tactile-card overflow-hidden">
            <div className="px-6 py-4 border-b border-white/20 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Ai cần trả cho ai? (Who pays whom)
                </h3>
                <p className="text-xs text-slate-500">
                  Thuật toán tối ưu hóa đã rút gọn số lượng giao dịch tối thiểu để giải phóng toàn bộ công nợ.
                </p>
              </div>
            </div>

            {settlements.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 text-xs">
                Không có khoản nợ nào cần giải quyết. Tất cả đã cân bằng!
              </div>
            ) : (
              <div className="divide-y divide-[#e6e4dc]/70">
                {settlements.map((s) => {
                  const isPayer = s.fromUserId === currentUser?.uid;
                  const isReceiver = s.toUserId === currentUser?.uid;

                  return (
                    <div
                      key={s.id}
                      className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#f4f3ec]/50 transition-colors"
                    >
                      {/* Transaction Path */}
                      <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                        {/* Payer */}
                        <div className="flex items-center gap-2">
                          <img
                            src={s.fromUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.fromUserId}`}
                            alt=""
                            className="w-10 h-10 rounded-full bg-zinc-100 object-cover border border-[#e6e4dc]"
                          />
                          <div>
                            <div className="text-sm font-bold text-[#18181b]">
                              {s.fromUser?.displayName}
                            </div>
                            <span className="text-[11px] text-rose-700 font-semibold">Người nợ tiền</span>
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="flex flex-col items-center px-2">
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3.5 py-1 rounded-full border border-emerald-200">
                            chuyển {formatVND(s.amount)} →
                          </span>
                        </div>

                        {/* Receiver */}
                        <div className="flex items-center gap-2">
                          <img
                            src={s.toUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.toUserId}`}
                            alt=""
                            className="w-10 h-10 rounded-full bg-zinc-100 object-cover border border-[#e6e4dc]"
                          />
                          <div>
                            <div className="text-sm font-bold text-[#18181b]">
                              {s.toUser?.displayName}
                            </div>
                            <span className="text-[11px] text-emerald-700 font-semibold">Người nhận tiền</span>
                          </div>
                        </div>
                      </div>

                      {/* Status & Action */}
                      <div className="flex items-center gap-3 self-end md:self-center">
                        {/* Status Badge */}
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                            s.status === 'CONFIRMED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.status === 'PAID'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-[#f4f3ec] text-zinc-600'
                          }`}
                        >
                          {s.status === 'CONFIRMED' ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Đã tất toán
                            </>
                          ) : s.status === 'PAID' ? (
                            <>
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              Đã chuyển (Chờ duyệt)
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-zinc-400" />
                              Chưa thanh toán
                            </>
                          )}
                        </span>

                        {/* Button 1: QR & Pay Modal (for anyone or Payer) */}
                        <button
                          onClick={() => {
                            setSelectedSettlement(s);
                            setVietQrModalOpen(true);
                          }}
                          className="tactile-btn-pill text-xs border border-[#e6e4dc]"
                        >
                          Xem VietQR
                        </button>

                        {/* Button 2: Receiver Confirm */}
                        {isReceiver && s.status === 'PAID' && (
                          <button
                            onClick={() => handleConfirmPayment(s)}
                            className="tactile-btn-dark text-xs flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            Xác nhận đã nhận
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT EXPENSE */}
      <Modal
        isOpen={addExpenseModalOpen}
        onClose={() => setAddExpenseModalOpen(false)}
        title={editingExpense ? 'Chỉnh sửa khoản chi' : 'Thêm khoản chi mới (Add Expense)'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveExpense} className="space-y-4">
          {/* Bill Attachment Action */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f4f3ec] border border-[#e6e4dc]">
            <div className="flex items-center gap-3">
              {expBillImageUrl ? (
                <img
                  src={expBillImageUrl}
                  alt="Bill"
                  className="w-12 h-12 rounded-xl object-cover border border-[#e6e4dc] shadow-xs"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-white border border-[#e6e4dc] flex items-center justify-center text-zinc-400">
                  <Camera className="w-5 h-5" />
                </div>
              )}
              <div>
                <span className="text-xs font-bold text-[#18181b]">
                  {expBillImageUrl ? 'Đã đính kèm ảnh hóa đơn' : 'Ảnh hóa đơn / Bill'}
                </span>
                <p className="text-[11px] text-zinc-500">Chụp hoặc tải ảnh hóa đơn thanh toán</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCameraModalOpen(true)}
              className="tactile-btn-pill text-xs border border-[#e6e4dc]"
            >
              {expBillImageUrl ? 'Thay đổi ảnh' : 'Chụp / Tải bill'}
            </button>
          </div>

          {/* Expense Name */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              Tên khoản chi (Expense Name) *
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Ăn tối nhà hàng, Tiền xe limousine, Vé tham quan..."
              value={expTitle}
              onChange={(e) => setExpTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#f4f3ec] border border-[#e6e4dc] text-sm text-[#18181b] outline-none focus:border-zinc-900 focus:bg-white transition-colors"
            />
          </div>

          {/* Amount & Paid By */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Số tiền (Amount) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="1000"
                  step="1000"
                  placeholder="600000"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#f4f3ec] border border-[#e6e4dc] text-sm font-bold text-zinc-900 outline-none focus:border-zinc-900 focus:bg-white transition-colors"
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-bold text-zinc-400">VNĐ</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Người trả tiền (Paid by) *
              </label>
              <select
                value={expPaidBy}
                onChange={(e) => setExpPaidBy(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#f4f3ec] border border-[#e6e4dc] text-sm font-semibold text-zinc-800 outline-none focus:border-zinc-900 focus:bg-white transition-colors"
              >
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.displayName} {m.userId === currentUser?.uid ? '(Tôi)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Participants Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-zinc-700">
                Người tham gia sử dụng ({expParticipants.length}/{members.length})
              </label>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-zinc-800">
                <button type="button" onClick={handleSelectAllParticipants} className="hover:underline font-bold">
                  Chọn tất cả
                </button>
                <span>•</span>
                <button type="button" onClick={handleClearAllParticipants} className="hover:underline text-zinc-400">
                  Bỏ chọn
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-2xl bg-[#f4f3ec] border border-[#e6e4dc]">
              {members.map((m) => {
                const isChecked = expParticipants.includes(m.userId);
                return (
                  <label
                    key={m.userId}
                    className={`flex items-center gap-2 p-2.5 rounded-xl cursor-pointer text-xs font-semibold transition-all select-none ${
                      isChecked
                        ? 'bg-white text-zinc-900 shadow-xs border border-[#e6e4dc]'
                        : 'text-zinc-600 hover:bg-white/60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleParticipant(m.userId)}
                      className="rounded text-zinc-900 focus:ring-zinc-900"
                    />
                    <span className="truncate">{m.displayName}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Split Mode: Equal vs Custom */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1.5">
              Phương thức chia tiền (Split Method)
            </label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                type="button"
                onClick={() => setExpSplitType('equal')}
                className={`py-2 px-3 rounded-full text-xs font-bold border transition-all ${
                  expSplitType === 'equal'
                    ? 'bg-[#18181b] text-white border-[#18181b] shadow-xs'
                    : 'bg-[#f4f3ec] border-[#e6e4dc] text-zinc-600 hover:bg-[#eae8df]'
                }`}
              >
                Chia đều (Equal Split)
              </button>

              <button
                type="button"
                onClick={() => setExpSplitType('custom')}
                className={`py-2 px-3 rounded-full text-xs font-bold border transition-all ${
                  expSplitType === 'custom'
                    ? 'bg-[#18181b] text-white border-[#18181b] shadow-xs'
                    : 'bg-[#f4f3ec] border-[#e6e4dc] text-zinc-600 hover:bg-[#eae8df]'
                }`}
              >
                Chia tùy chỉnh (Custom Split)
              </button>
            </div>

            {/* Split Details Section */}
            {expSplitType === 'equal' ? (
              <div className="p-3.5 rounded-2xl text-xs text-zinc-900 flex items-center justify-between bg-[#f4f3ec] border border-[#e6e4dc]">
                <span>Mỗi người chịu dự kiến:</span>
                <span className="font-extrabold text-[#18181b] text-sm">
                  {formatVND(liveShares.perPerson || 0)}/người
                </span>
              </div>
            ) : (
              <div className="space-y-2 p-3 rounded-2xl bg-[#f4f3ec] border border-[#e6e4dc]">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-700 mb-2">
                  <span>Nhập số tiền riêng cho từng người:</span>
                  <span
                    className={
                      liveShares.remaining === 0
                        ? 'text-emerald-700 font-bold'
                        : 'text-rose-600 font-bold'
                    }
                  >
                    {liveShares.remaining === 0
                      ? 'Đã khớp 100% ✓'
                      : liveShares.remaining > 0
                      ? `Còn thiếu: ${formatVND(liveShares.remaining)}`
                      : `Vượt quá: ${formatVND(Math.abs(liveShares.remaining))}`}
                  </span>
                </div>

                {expParticipants.map((userId) => {
                  const m = members.find((u) => u.userId === userId);
                  return (
                    <div key={userId} className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-semibold text-zinc-700 truncate">{m?.displayName}</span>
                      <div className="w-36 relative">
                        <input
                          type="number"
                          placeholder="0"
                          value={expIndividualAmounts[userId] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setExpIndividualAmounts((prev) => ({
                              ...prev,
                              [userId]: val ? Number(val) : 0,
                            }));
                          }}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#e6e4dc] text-right font-mono font-bold text-xs outline-none focus:border-zinc-900"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Date & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Ngày chi</label>
              <input
                type="date"
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-[#f4f3ec] border border-[#e6e4dc] text-xs outline-none focus:border-zinc-900 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Ghi chú (Note)</label>
              <input
                type="text"
                placeholder="Ví dụ: E bị mệt về phòng trước..."
                value={expNote}
                onChange={(e) => setExpNote(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-[#f4f3ec] border border-[#e6e4dc] text-xs outline-none focus:border-zinc-900 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e6e4dc]">
            <button
              type="button"
              onClick={() => setAddExpenseModalOpen(false)}
              className="tactile-btn-pill"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="tactile-btn-dark disabled:opacity-50"
            >
              {submitting ? 'Đang lưu...' : editingExpense ? 'Cập nhật khoản chi' : 'Lưu khoản chi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: VIEW EXPENSE DETAIL */}
      {selectedExpense && (
        <Modal
          isOpen={viewExpenseModalOpen}
          onClose={() => setViewExpenseModalOpen(false)}
          title="Chi tiết khoản chi"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="text-center p-4 rounded-2xl bg-[#f4f3ec] border border-[#e6e4dc]">
              <h3 className="text-lg font-bold text-[#18181b]">{selectedExpense.title}</h3>
              <div className="text-2xl font-extrabold text-[#18181b] mt-1">
                {formatVND(selectedExpense.amount)}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Ngày: {selectedExpense.date}</p>
            </div>

            {selectedExpense.billImageUrl && (
              <div className="rounded-2xl overflow-hidden border border-[#e6e4dc] shadow-xs">
                <img
                  src={selectedExpense.billImageUrl}
                  alt="Bill"
                  className="w-full max-h-56 object-contain bg-white"
                />
              </div>
            )}

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#f4f3ec] border border-[#e6e4dc]">
                <span className="text-zinc-500 font-medium">Người thanh toán:</span>
                <span className="font-bold text-[#18181b]">
                  {members.find((m) => m.userId === selectedExpense.paidBy)?.displayName || 'Thành viên'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#f4f3ec] border border-[#e6e4dc]">
                <span className="text-zinc-500 font-medium">Phương thức chia:</span>
                <span className="font-bold text-[#18181b]">
                  {selectedExpense.splitType === 'custom' ? 'Chia riêng theo từng người' : 'Chia đều'}
                </span>
              </div>

              {selectedExpense.note && (
                <div className="p-2.5 rounded-xl bg-[#f4f3ec] border border-[#e6e4dc] text-zinc-600">
                  <span className="font-bold text-[#18181b] block mb-0.5">Ghi chú:</span>
                  {selectedExpense.note}
                </div>
              )}
            </div>

            {/* Participants share list */}
            <div>
              <span className="text-xs font-bold text-zinc-700 block mb-1.5">
                Danh sách người chịu chi phí ({selectedExpense.participants?.length || 0})
              </span>
              <div className="space-y-1.5">
                {selectedExpense.participants?.map((pId) => {
                  const m = members.find((u) => u.userId === pId);
                  const shareAmount =
                    selectedExpense.splitType === 'custom'
                      ? selectedExpense.individualAmounts?.[pId] || 0
                      : Math.floor(selectedExpense.amount / selectedExpense.participants.length);

                  return (
                    <div key={pId} className="flex items-center justify-between text-xs py-1.5 border-b border-[#e6e4dc]/70">
                      <span className="text-zinc-700">{m?.displayName}</span>
                      <span className="font-mono font-bold text-[#18181b]">{formatVND(shareAmount)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action buttons: Edit, Delete */}
            <div className="flex items-center justify-between pt-3 border-t border-[#e6e4dc]">
              <button
                type="button"
                onClick={() => handleDeleteExpense(selectedExpense.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Xóa khoản chi
              </button>

              <button
                type="button"
                onClick={() => handleOpenEditExpense(selectedExpense)}
                className="tactile-btn-dark text-xs flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" /> Chỉnh sửa
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CAMERA & BILL UPLOAD MODAL */}
      <CameraModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        currentImageUrl={expBillImageUrl}
        onImageSelected={(url) => setExpBillImageUrl(url)}
      />

      {/* VIETQR & PAYMENT MODAL */}
      <VietQRModal
        isOpen={vietQrModalOpen}
        onClose={() => setVietQrModalOpen(false)}
        settlement={selectedSettlement}
        tripName={trip.name}
        onMarkAsPaid={handleMarkAsPaid}
        isPayer={selectedSettlement?.fromUserId === currentUser?.uid}
      />
    </div>
  );
}
