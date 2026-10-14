import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../services/api';
import { formatVND, calculateLiveShares } from '../services/calculation';
import Modal from '../components/Modal';
import CameraModal from '../components/CameraModal';
import VietQRModal from '../components/VietQRModal';
import InviteTripModal from '../components/InviteTripModal';
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
  UserPlus,
  Loader2,
  History,
  Share2,
  AlertCircle,
  ArrowRight,
  QrCode,
  FileText,
  MessageSquare,
  Tag,
  User
} from 'lucide-react';

export default function TripDetailPage() {
  const { tripId } = useParams();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { t, language } = useLanguage();
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

  // Complete Trip Modal State
  const [completeTripModalOpen, setCompleteTripModalOpen] = useState(false);
  const [completingTrip, setCompletingTrip] = useState(false);

  // Invite Link & QR Modal State
  const [inviteLinkModalOpen, setInviteLinkModalOpen] = useState(false);

  // Invite from Friends Modal State
  const [inviteFriendsModalOpen, setInviteFriendsModalOpen] = useState(false);
  const [friendsList, setFriendsList] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [invitingFriendId, setInvitingFriendId] = useState(null);

  const openInviteFriendsModal = async () => {
    setInviteFriendsModalOpen(true);
    try {
      setLoadingFriends(true);
      const res = await api.get('/friends');
      setFriendsList(res.friends || []);
    } catch (err) {
      showToast(err.message || 'Lỗi khi tải danh sách bạn bè', 'error');
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleInviteFriendToTrip = async (friend) => {
    try {
      setInvitingFriendId(friend.uid);
      const res = await api.post('/friends/invite-trip', {
        friendId: friend.uid,
        tripId
      });
      showToast(res.message || `Đã thêm ${friend.displayName} vào chuyến đi!`, 'success');
      fetchTripDetails();
    } catch (err) {
      showToast(err.message || 'Lỗi khi thêm bạn bè vào chuyến đi', 'error');
    } finally {
      setInvitingFriendId(null);
    }
  };

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

  // Settlement progress & completion condition
  const unsettledDebts = settlements.filter(s => s.status !== 'CONFIRMED');
  const isAllSettled = settlements.length === 0 || unsettledDebts.length === 0;
  const totalSettlements = settlements.length;
  const confirmedSettlements = settlements.filter(s => s.status === 'CONFIRMED').length;
  const settlementProgress = totalSettlements > 0 ? Math.round((confirmedSettlements / totalSettlements) * 100) : 100;

  // Open Complete Trip Modal
  const handleOpenCompleteModal = () => {
    setCompleteTripModalOpen(true);
  };

  // Confirm Complete Trip
  const handleConfirmCompleteTrip = async () => {
    try {
      setCompletingTrip(true);
      const res = await api.post(`/trips/${tripId}/complete`);
      showToast(res.message || t('tripCompletedSuccess', 'Chuyến đi đã chốt sổ thành công!'), 'success');
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
      setCompleteTripModalOpen(false);
      loadTripData();
    } catch (err) {
      showToast(err.message || 'Lỗi khi hoàn thành chuyến đi', 'error');
    } finally {
      setCompletingTrip(false);
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
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors px-3 py-1.5 rounded-2xl hover:bg-white/50 dark:hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4" /> {t('back', 'Quay lại')}
        </Link>

        {isCreator && trip.status === 'ACTIVE' && (
          <button
            onClick={handleOpenCompleteModal}
            className={`text-xs font-bold px-4 py-2 rounded-2xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
              !isAllSettled
                ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                : 'bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] hover:scale-105'
            }`}
          >
            {!isAllSettled ? (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{t('completeTrip', 'Chốt chuyến đi')}</span>
                <span className="text-[10px] bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 px-1.5 py-0.2 rounded-full font-bold">
                  {unsettledDebts.length}
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                <span>{t('completeTrip', 'Chốt chuyến đi')}</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Main Trip Header Card */}
      <div className="tactile-card p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-transparent dark:border-emerald-800/40">
                {trip.status === 'COMPLETED' ? t('completedTrip', 'Đã hoàn thành') : t('activeTrip', 'Đang hoạt động')}
              </span>

              {/* Trip Code Pill */}
              <div
                onClick={handleCopyCode}
                className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f4f3ec] dark:bg-[#212129] hover:bg-[#eae8df] dark:hover:bg-[#2c2c36] text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold transition-all border border-[#e6e4dc] dark:border-[#32323e]"
                title={t('copyCodeTooltip', 'Bấm để sao chép mã mời')}
              >
                <span>{t('tripCodeLabel', 'Mã:')} #{trip.tripCode}</span>
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />}
              </div>

              {/* Invite via Link & QR Button */}
              <button
                type="button"
                onClick={() => setInviteLinkModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold transition-all border border-blue-200 dark:border-blue-800/50 cursor-pointer shadow-xs active:scale-95"
                title="Mời bạn bè & khách bằng link hoặc mã QR"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Mời bằng link</span>
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18181b] dark:text-white tracking-tight">
              {trip.name}
            </h1>

            {trip.description && (
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-xl">
                {trip.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-zinc-400 dark:text-zinc-400 pt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {trip.startDate} → {trip.endDate}
              </span>
            </div>
          </div>

          {/* Quick Metrics & Add Expense button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="p-4 rounded-2xl bg-[#f4f3ec] dark:bg-[#212129] border border-[#e6e4dc] dark:border-[#32323e] flex items-center justify-between sm:justify-start gap-6">
              <div>
                <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-wider">{t('totalTripCost', 'Tổng chi phí')}</span>
                <div className="text-xl sm:text-2xl font-extrabold text-[#18181b] dark:text-white">
                  {formatVND(balances?.totalExpense || 0)}
                </div>
              </div>
              <div className="h-8 w-px bg-[#e6e4dc] dark:bg-[#32323e]" />
              <div className="text-right sm:text-left">
                <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-wider">{t('scale', 'Quy mô')}</span>
                <div className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  {members.length} {t('membersUnit', 'Người')} • {expenses.length} {t('billsUnit', 'Bill')}
                </div>
              </div>
            </div>

            <button
              onClick={handleOpenAddExpense}
              className="tactile-btn-dark py-3.5 px-5 text-sm"
            >
              <Plus className="w-4 h-4" />
              {t('addExpense', 'Thêm khoản chi')}
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Tactile Bento Pill Tabs) */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-[#e6e4dc] dark:border-[#272732] overflow-x-auto no-scrollbar py-1 w-full max-w-full shrink-0 flex-nowrap">
          {[
            { id: 'overview', label: t('overview', 'Tổng quan'), count: null, icon: DollarSign },
            { id: 'expenses', label: t('expenses', 'Khoản chi'), count: expenses.length, icon: Receipt },
            { id: 'members', label: t('members', 'Thành viên'), count: members.length, icon: Users },
            { id: 'settlement', label: t('settlementVietQR', 'Quyết toán VietQR'), count: settlements.length, icon: Sparkles },
          ].map((tab) => {
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tactile-tab shrink-0 whitespace-nowrap ${isTabActive ? 'active-purple' : ''}`}
              >
                <span className="whitespace-nowrap shrink-0">{tab.label}</span>
                {tab.count !== null && (
                  <span className={`tactile-badge w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 leading-none ${isTabActive ? 'bg-purple-200/80 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200' : 'bg-[#f4f3ec] dark:bg-white/10 text-zinc-600 dark:text-zinc-300'}`}>
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
          {/* Top Payer Highlight */}
          {balances?.topPayer && (
            <div className="p-5 rounded-3xl liquid-glass-card flex items-center justify-between border border-teal-500/20" style={{ background: 'linear-gradient(135deg, rgba(20,184,166,0.08), rgba(16,185,129,0.05))' }}>
              <div className="flex items-center gap-3">
                <img
                  src={balances.topPayer.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${balances.topPayer.userId}`}
                  alt=""
                  className="w-12 h-12 rounded-2xl bg-white/50 dark:bg-white/10 shadow-lg ring-2 ring-white/40 dark:ring-white/10"
                />
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">Người chi trả nhiều nhất</span>
                  <div className="text-base font-bold text-slate-900 dark:text-white">{balances.topPayer.displayName}</div>
                  <div className="text-xs text-slate-500 dark:text-zinc-400">Đã ứng trước thanh toán: <strong className="text-emerald-700 dark:text-emerald-400">{formatVND(balances.topPayer.totalPaid)}</strong></div>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-xs text-slate-400 dark:text-zinc-400">Trạng thái công nợ</span>
                <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                  +{formatVND(balances.topPayer.balance)}
                </div>
              </div>
            </div>
          )}

          {/* Members Balance Table */}
          <div className="tactile-card overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e6e4dc] dark:border-[#272732] flex items-center justify-between bg-[#f4f3ec] dark:bg-[#1a1a22]">
              <h3 className="text-sm font-bold text-[#18181b] dark:text-white">Bảng cân đối công nợ từng thành viên</h3>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Balance = Đã trả - Phải chịu</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider bg-[#faf9f6] dark:bg-[#15151c] border-b border-[#e6e4dc] dark:border-[#272732]">
                    <th className="py-3 px-6">Thành viên</th>
                    <th className="py-3 px-4 text-right">Đã trả (Paid)</th>
                    <th className="py-3 px-4 text-right">Phải chịu (Owed)</th>
                    <th className="py-3 px-6 text-right">Số dư (Balance)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6e4dc] dark:divide-[#272732]">
                  {balances?.members?.map((m) => {
                    const isCreditor = m.balance > 0;
                    const isDebtor = m.balance < 0;
                    const isSettled = m.balance === 0;

                    return (
                      <tr key={m.userId} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <img
                              src={m.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.userId}`}
                              alt=""
                              className="w-8 h-8 rounded-xl bg-white/50 dark:bg-white/10 ring-1 ring-white/30 dark:ring-white/10"
                            />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">{m.displayName}</div>
                              {m.userId === currentUser?.uid && (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">(Bạn)</span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right font-medium text-slate-700 dark:text-zinc-200">
                          {formatVND(m.totalPaid)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-medium text-slate-700 dark:text-zinc-200">
                          {formatVND(m.totalOwed)}
                        </td>

                        <td className="py-3.5 px-6 text-right">
                          <span
                            className={`font-mono font-bold px-3 py-1 rounded-xl text-xs sm:text-sm inline-block backdrop-blur-sm ${
                              isCreditor
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300/30 dark:border-emerald-500/30'
                                : isDebtor
                                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-300/30 dark:border-rose-500/30'
                                : 'bg-[#f4f3ec] dark:bg-white/10 text-slate-600 dark:text-zinc-300 border border-[#e6e4dc] dark:border-white/10'
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
                className="w-full pl-9 pr-4 py-2 rounded-full bg-[#f4f3ec] dark:bg-[#1a1a22] border border-[#e6e4dc] dark:border-[#2e2e38] text-xs text-[#18181b] dark:text-white outline-none focus:border-zinc-900 dark:focus:border-purple-500 focus:bg-white dark:focus:bg-[#20202c] transition-colors"
              />
            </div>

            {/* Filter by Payer */}
            <div className="flex items-center gap-2">
              <select
                value={selectedPayerFilter}
                onChange={(e) => setSelectedPayerFilter(e.target.value)}
                className="px-3 py-2 rounded-full bg-[#f4f3ec] dark:bg-[#1a1a22] border border-[#e6e4dc] dark:border-[#2e2e38] text-xs outline-none text-zinc-700 dark:text-zinc-200"
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
                className="px-3 py-2 rounded-full bg-[#f4f3ec] dark:bg-[#1a1a22] border border-[#e6e4dc] dark:border-[#2e2e38] text-xs outline-none text-zinc-700 dark:text-zinc-200"
              >
                <option value="date">Mới nhất</option>
                <option value="amount">Số tiền lớn nhất</option>
              </select>
            </div>
          </div>

          {/* Expenses List */}
          {filteredExpenses.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#1a1a22] border border-[#e6e4dc] dark:border-[#2e2e38] shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#f4f3ec] dark:bg-[#22222a] text-zinc-500 dark:text-zinc-400 mx-auto flex items-center justify-center">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-[#18181b] dark:text-white text-base">Chưa có khoản chi nào</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
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
                    onClick={async () => {
                      setSelectedExpense(expense);
                      setViewExpenseModalOpen(true);
                      try {
                        const fresh = await api.get(`/trips/${tripId}/expenses/${expense.id}`);
                        if (fresh) setSelectedExpense(fresh);
                      } catch (e) {
                        // fallback to cached expense
                      }
                    }}
                    className="group tactile-card p-4 sm:p-5 cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Bill thumbnail or default icon */}
                      {expense.billImageUrl ? (
                        <img
                          src={expense.billImageUrl}
                          alt="Bill"
                          className="w-12 h-12 rounded-2xl object-cover border border-[#e6e4dc] dark:border-[#2e2e38] shrink-0 shadow-xs"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-[#f4f3ec] dark:bg-[#212129] text-zinc-700 dark:text-zinc-200 border border-[#e6e4dc] dark:border-[#32323e] flex items-center justify-center shrink-0">
                          <Receipt className="w-6 h-6" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-[#18181b] dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate text-sm sm:text-base">
                            {expense.title}
                          </h4>
                          {expense.splitType === 'custom' && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300">
                              Chia tùy chỉnh
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex-wrap">
                          <span>
                            Người trả:{' '}
                            <strong className="text-zinc-800 dark:text-zinc-200">
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
                      <div className="text-base sm:text-lg font-extrabold text-[#18181b] dark:text-white">
                        {formatVND(expense.amount)}
                      </div>
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-zinc-200 transition-colors font-medium">
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
          {/* Invite Code & Friends Box */}
          <div className="tactile-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#f4f3ec] dark:bg-[#1a1a22]">
            <div>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Thêm thành viên</span>
              <h3 className="text-lg font-bold text-[#18181b] dark:text-white mt-0.5">Mời bạn bè hoặc chia sẻ mã chuyến đi</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Mời trực tiếp bạn bè trong danh bạ hoặc gửi mã Trip Code để họ tự tham gia.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setInviteLinkModalOpen(true)}
                className="tactile-btn-dark py-2.5 px-4 text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Share2 className="w-4 h-4 text-amber-400" />
                <span>Mời bằng link & QR</span>
              </button>

              <button
                type="button"
                onClick={openInviteFriendsModal}
                className="tactile-btn-pill py-2.5 px-4 text-xs flex items-center gap-1.5 shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>Mời từ bạn bè</span>
              </button>

              <div className="flex items-center gap-3 p-1.5 bg-white dark:bg-[#212129] rounded-2xl border border-[#dedbd0] dark:border-[#32323e] shadow-xs">
                <span className="text-lg font-mono font-extrabold tracking-widest px-2.5 text-[#18181b] dark:text-white">
                  {trip.tripCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="tactile-btn-pill py-1.5 px-3 text-xs"
                  title="Sao chép mã"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Đã chép' : 'Sao chép'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Members List */}
          <div className="tactile-card overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e6e4dc] dark:border-[#272732] bg-[#f4f3ec] dark:bg-[#1a1a22] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#18181b] dark:text-white">Danh sách thành viên ({members.length})</h3>
            </div>

            <div className="divide-y divide-[#e6e4dc]/70 dark:divide-[#272732]">
              {members.map((m) => {
                const isMemberCreator = m.role === 'Creator' || m.userId === trip.createdBy;

                return (
                  <div key={m.userId} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-[#f4f3ec]/50 dark:hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={m.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.userId}`}
                        alt=""
                        className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 object-cover border border-[#e6e4dc] dark:border-[#2e2e38]"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-[#18181b] dark:text-white text-sm">
                            {m.displayName}
                          </h4>
                          <span
                            className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                              isMemberCreator
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                : 'bg-[#f4f3ec] dark:bg-white/10 text-zinc-600 dark:text-zinc-300'
                            }`}
                          >
                            {isMemberCreator ? 'Người tạo' : 'Thành viên'}
                          </span>
                        </div>

                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {m.bankName ? (
                            <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                              Ngân hàng: {m.bankName} • {m.bankAccountNumber} ({m.bankAccountHolder})
                            </span>
                          ) : (
                            <span className="text-zinc-400 dark:text-zinc-500">Chưa cập nhật tài khoản ngân hàng</span>
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

          {/* Settlement Progress & Completion Condition Banner */}
          {trip.status === 'COMPLETED' ? (
            <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                    {t('completedTrip', 'Chuyến đi đã chốt sổ hoàn tất')}
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                    {t('allDebtsSettledBadge', 'Toàn bộ công nợ giữa các thành viên đã được thanh toán và đối soát thành công 100%.')}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-200 dark:bg-emerald-800/60 text-emerald-900 dark:text-emerald-100 shrink-0">
                {t('completed', 'Đã chốt sổ')}
              </span>
            </div>
          ) : (
            <div className="tactile-card p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  <span className="text-xs sm:text-sm font-bold text-[#18181b] dark:text-white">
                    {t('settlementProgressTitle', 'Tiến độ thanh toán công nợ')}: {confirmedSettlements}/{totalSettlements} ({settlementProgress}%)
                  </span>
                </div>

                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full self-start sm:self-auto ${
                    !isAllSettled
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40'
                  }`}
                >
                  {!isAllSettled
                    ? `${unsettledDebts.length} ${t('outstandingDebtsCount', 'khoản nợ chưa hoàn tất')}`
                    : t('allDebtsSettledBadge', 'Tất cả công nợ đã được thanh toán hoàn tất ✓')}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[#f4f3ec] dark:bg-zinc-800 h-2 rounded-full overflow-hidden border border-[#e6e4dc] dark:border-zinc-700">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${settlementProgress}%` }}
                />
              </div>

              {/* Condition Note or Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
                {!isAllSettled ? (
                  <p className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>
                      {t('notReadyToCompleteDesc', 'Điều kiện chốt sổ: Mọi thành viên phải thanh toán và người nhận xác nhận đã nhận tiền trước khi chốt sổ.')}
                    </span>
                  </p>
                ) : (
                  <>
                    <p className="text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{t('readyToCompleteDesc', '100% công nợ đã được tất toán! Đủ điều kiện để chốt sổ.')}</span>
                    </p>

                    {isCreator && (
                      <button
                        onClick={handleOpenCompleteModal}
                        className="tactile-btn-dark text-xs flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>{t('confirmCloseTripBtn', 'Xác nhận chốt sổ ngay')}</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Optimized Transactions (Who Pays Whom) */}
          <div className="tactile-card overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e6e4dc] dark:border-[#272732] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Ai cần trả cho ai? (Who pays whom)
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Thuật toán tối ưu hóa đã rút gọn số lượng giao dịch tối thiểu để giải phóng toàn bộ công nợ.
                </p>
              </div>
            </div>

            {settlements.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 dark:text-zinc-500 text-xs">
                Không có khoản nợ nào cần giải quyết. Tất cả đã cân bằng!
              </div>
            ) : (
              <div className="divide-y divide-[#e6e4dc]/70 dark:divide-[#272732]">
                {settlements.map((s) => {
                  const currentUid = String(currentUser?.uid || currentUser?.id || '');
                  const fromUid = String(s.fromUserId || s.fromUser?.id || s.fromUser?.uid || '');
                  const toUid = String(s.toUserId || s.toUser?.id || s.toUser?.uid || '');

                  const isPayer = Boolean(currentUid && fromUid && currentUid === fromUid);
                  const isReceiver = Boolean(currentUid && toUid && currentUid === toUid);

                  return (
                    <div
                      key={s.id}
                      className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#f4f3ec]/50 dark:hover:bg-white/5 transition-colors"
                    >
                      {/* Transaction Path */}
                      <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                        {/* Payer */}
                        <div className="flex items-center gap-2">
                          <img
                            src={s.fromUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.fromUserId}`}
                            alt=""
                            className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 object-cover border border-[#e6e4dc] dark:border-[#2e2e38]"
                          />
                          <div>
                            <div className="text-sm font-bold text-[#18181b] dark:text-white">
                              {s.fromUser?.displayName}
                            </div>
                            <span className="text-[11px] text-rose-700 dark:text-rose-400 font-semibold">Người nợ tiền</span>
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="flex flex-col items-center px-2">
                          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-3.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                            chuyển {formatVND(s.amount)} →
                          </span>
                        </div>

                        {/* Receiver */}
                        <div className="flex items-center gap-2">
                          <img
                            src={s.toUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.toUserId}`}
                            alt=""
                            className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 object-cover border border-[#e6e4dc] dark:border-[#2e2e38]"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-[#18181b] dark:text-white">
                                {s.toUser?.displayName}
                              </span>
                              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                                Người nhận tiền
                              </span>
                            </div>
                            {s.toUser?.bankAccountNumber ? (
                              <div className="text-[11px] text-zinc-600 dark:text-zinc-300 font-medium flex items-center gap-1.5 mt-1 flex-wrap">
                                <span className="font-bold bg-[#f4f3ec] dark:bg-[#212129] px-1.5 py-0.5 rounded border border-[#e6e4dc] dark:border-[#32323e] text-zinc-800 dark:text-zinc-200">
                                  {s.toUser.bankName}
                                </span>
                                <span className="font-mono font-bold text-[#18181b] dark:text-white">
                                  {s.toUser.bankAccountNumber}
                                </span>
                                <span className="text-zinc-500 dark:text-zinc-400">
                                  ({s.toUser.bankAccountHolder || s.toUser.displayName})
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block mt-0.5">
                                Chưa cập nhật tài khoản ngân hàng
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status & Action */}
                      <div className="flex items-center gap-2.5 self-end md:self-center flex-wrap">
                        {/* Status Badge */}
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                            s.status === 'CONFIRMED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                              : s.status === 'PAID'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40'
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
                              <Clock className="w-3.5 h-3.5 text-rose-500" />
                              Chưa thanh toán
                            </>
                          )}
                        </span>

                        {/* Button 1: QR Modal (Mọi thành viên đều có thể mở xem) */}
                        <button
                          onClick={() => {
                            setSelectedSettlement(s);
                            setVietQrModalOpen(true);
                          }}
                          className="tactile-btn-pill text-xs border border-[#e6e4dc] dark:border-[#2e2e38] flex items-center gap-1.5"
                        >
                          <QrCode className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                          <span>{t('viewVietQR', 'Mở mã VietQR')}</span>
                        </button>

                        {/* Button 2: XÁC NHẬN ĐÃ CHUYỂN - Chỉ người nợ tiền (s.fromUserId) mới thấy */}
                        {isPayer && s.status !== 'CONFIRMED' && s.status !== 'PAID' && (
                          <button
                            onClick={() => handleMarkAsPaid(s)}
                            className="tactile-btn-dark text-xs flex items-center gap-1.5 shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{t('markAsPaid', 'Xác nhận đã chuyển')}</span>
                          </button>
                        )}

                        {/* Button 3: XÁC NHẬN ĐÃ NHẬN TIỀN - Chỉ người nhận tiền (s.toUserId) mới thấy khi người nợ đã bấm chuyển */}
                        {isReceiver && s.status === 'PAID' && (
                          <button
                            onClick={() => handleConfirmPayment(s)}
                            className="tactile-btn-dark text-xs flex items-center gap-1.5 shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{t('confirmReceipt', 'Xác nhận đã nhận')}</span>
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
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f4f3ec] dark:bg-[#1a1a22] border border-[#e6e4dc] dark:border-[#2e2e38]">
            <div className="flex items-center gap-3">
              {expBillImageUrl ? (
                <img
                  src={expBillImageUrl}
                  alt="Bill"
                  className="w-12 h-12 rounded-xl object-cover border border-[#e6e4dc] dark:border-[#2e2e38] shadow-xs"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#212129] border border-[#e6e4dc] dark:border-[#32323e] flex items-center justify-center text-zinc-400">
                  <Camera className="w-5 h-5" />
                </div>
              )}
              <div>
                <span className="text-xs font-bold text-[#18181b] dark:text-white">
                  {expBillImageUrl ? 'Đã đính kèm ảnh hóa đơn' : 'Ảnh hóa đơn / Bill'}
                </span>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Chụp hoặc tải ảnh hóa đơn thanh toán</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCameraModalOpen(true)}
              className="tactile-btn-pill text-xs border border-[#e6e4dc] dark:border-[#2e2e38]"
            >
              {expBillImageUrl ? 'Thay đổi ảnh' : 'Chụp / Tải bill'}
            </button>
          </div>

          {/* Expense Name */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Tên khoản chi (Expense Name) *
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Ăn tối nhà hàng, Tiền xe limousine, Vé tham quan..."
              value={expTitle}
              onChange={(e) => setExpTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#f4f3ec] dark:bg-[#1a1a22] border border-[#e6e4dc] dark:border-[#2e2e38] text-sm text-[#18181b] dark:text-white outline-none focus:border-zinc-900 dark:focus:border-purple-500 focus:bg-white dark:focus:bg-[#20202c] transition-colors"
            />
          </div>

          {/* Amount & Paid By */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
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
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#f4f3ec] dark:bg-[#1a1a22] border border-[#e6e4dc] dark:border-[#2e2e38] text-sm font-bold text-zinc-900 dark:text-white outline-none focus:border-zinc-900 dark:focus:border-purple-500 focus:bg-white dark:focus:bg-[#20202c] transition-colors"
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-bold text-zinc-400 dark:text-zinc-500">VNĐ</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Người trả tiền (Paid by) *
              </label>
              <select
                value={expPaidBy}
                onChange={(e) => setExpPaidBy(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#f4f3ec] dark:bg-[#1a1a22] border border-[#e6e4dc] dark:border-[#2e2e38] text-sm font-semibold text-zinc-800 dark:text-zinc-200 outline-none focus:border-zinc-900 dark:focus:border-purple-500 focus:bg-white dark:focus:bg-[#20202c] transition-colors"
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
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Người tham gia sử dụng ({expParticipants.length}/{members.length})
              </label>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">
                <button type="button" onClick={handleSelectAllParticipants} className="hover:underline font-bold">
                  Chọn tất cả
                </button>
                <span>•</span>
                <button type="button" onClick={handleClearAllParticipants} className="hover:underline text-zinc-400 dark:text-zinc-500">
                  Bỏ chọn
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-2xl bg-[#f4f3ec] dark:bg-[#1a1a22] border border-[#e6e4dc] dark:border-[#2e2e38]">
              {members.map((m) => {
                const isChecked = expParticipants.includes(m.userId);
                return (
                  <label
                    key={m.userId}
                    className={`flex items-center gap-2 p-2.5 rounded-xl cursor-pointer text-xs font-semibold transition-all select-none ${
                      isChecked
                        ? 'bg-white dark:bg-[#212129] text-zinc-900 dark:text-white shadow-xs border border-[#e6e4dc] dark:border-[#32323e]'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-white/5'
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
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Phương thức chia tiền (Split Method)
            </label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                type="button"
                onClick={() => setExpSplitType('equal')}
                className={`py-2 px-3 rounded-full text-xs font-bold border transition-all ${
                  expSplitType === 'equal'
                    ? 'bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] border-[#18181b] dark:border-white shadow-xs'
                    : 'bg-[#f4f3ec] dark:bg-[#22222a] border-[#e6e4dc] dark:border-[#32323e] text-zinc-600 dark:text-zinc-300 hover:bg-[#eae8df] dark:hover:bg-[#2c2c36]'
                }`}
              >
                Chia đều (Equal Split)
              </button>

              <button
                type="button"
                onClick={() => setExpSplitType('custom')}
                className={`py-2 px-3 rounded-full text-xs font-bold border transition-all ${
                  expSplitType === 'custom'
                    ? 'bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] border-[#18181b] dark:border-white shadow-xs'
                    : 'bg-[#f4f3ec] dark:bg-[#22222a] border-[#e6e4dc] dark:border-[#32323e] text-zinc-600 dark:text-zinc-300 hover:bg-[#eae8df] dark:hover:bg-[#2c2c36]'
                }`}
              >
                Chia tùy chỉnh (Custom Split)
              </button>
            </div>

            {/* Split Details Section */}
            {expSplitType === 'equal' ? (
              <div className="p-3.5 rounded-2xl text-xs text-zinc-900 dark:text-zinc-200 flex items-center justify-between bg-[#f4f3ec] dark:bg-[#1a1a22] border border-[#e6e4dc] dark:border-[#2e2e38]">
                <span>Mỗi người chịu dự kiến:</span>
                <span className="font-extrabold text-[#18181b] dark:text-white text-sm">
                  {formatVND(liveShares.perPerson || 0)}/người
                </span>
              </div>
            ) : (
              <div className="space-y-2 p-3 rounded-2xl bg-[#f4f3ec] dark:bg-[#1a1a22] border border-[#e6e4dc] dark:border-[#2e2e38]">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                  <span>Nhập số tiền riêng cho từng người:</span>
                  <span
                    className={
                      liveShares.remaining === 0
                        ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                        : 'text-rose-600 dark:text-rose-400 font-bold'
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
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300 truncate">{m?.displayName}</span>
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
                          className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#212129] border border-[#e6e4dc] dark:border-[#32323e] text-right font-mono font-bold text-xs outline-none focus:border-zinc-900 dark:focus:border-purple-500 text-zinc-900 dark:text-white"
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
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Ngày chi</label>
              <input
                type="date"
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-[#f4f3ec] dark:bg-[#1a1a22] border border-[#e6e4dc] dark:border-[#2e2e38] text-xs text-[#18181b] dark:text-white outline-none focus:border-zinc-900 dark:focus:border-purple-500 focus:bg-white dark:focus:bg-[#20202c] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Ghi chú (Note)</label>
              <input
                type="text"
                placeholder="Ví dụ: E bị mệt về phòng trước..."
                value={expNote}
                onChange={(e) => setExpNote(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-[#f4f3ec] dark:bg-[#1a1a22] border border-[#e6e4dc] dark:border-[#2e2e38] text-xs text-[#18181b] dark:text-white outline-none focus:border-zinc-900 dark:focus:border-purple-500 focus:bg-white dark:focus:bg-[#20202c] transition-colors"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e6e4dc] dark:border-[#2e2e38]">
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
          title="Chi tiết khoản chi & Lịch sử chỉnh sửa"
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            <div className="text-center p-4 rounded-2xl bg-[#edebe4]/70 dark:bg-[#1a1a22] border border-[#dedbd0] dark:border-[#2e2e38]">
              <h3 className="text-lg font-bold text-[#18181b] dark:text-white">{selectedExpense.title}</h3>
              <div className="text-2xl font-extrabold text-[#18181b] dark:text-white mt-1">
                {formatVND(selectedExpense.amount)}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Ngày: {selectedExpense.date}</p>
            </div>

            {selectedExpense.billImageUrl && (
              <div className="rounded-2xl overflow-hidden border border-[#dedbd0] dark:border-[#2e2e38] shadow-xs">
                <img
                  src={selectedExpense.billImageUrl}
                  alt="Bill"
                  className="w-full max-h-56 object-contain bg-white dark:bg-black/20"
                />
              </div>
            )}

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#edebe4]/50 dark:bg-[#212129] border border-[#dedbd0] dark:border-[#2e2e38]">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Người thanh toán:</span>
                <span className="font-bold text-[#18181b] dark:text-white">
                  {members.find((m) => m.userId === selectedExpense.paidBy)?.displayName || 'Thành viên'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#edebe4]/50 dark:bg-[#212129] border border-[#dedbd0] dark:border-[#2e2e38]">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Phương thức chia:</span>
                <span className="font-bold text-[#18181b] dark:text-white">
                  {selectedExpense.splitType === 'custom' ? 'Chia riêng theo từng người' : 'Chia đều'}
                </span>
              </div>

              {selectedExpense.note && (
                <div className="p-2.5 rounded-xl bg-[#edebe4]/50 dark:bg-[#212129] border border-[#dedbd0] dark:border-[#2e2e38] text-zinc-600 dark:text-zinc-300">
                  <span className="font-bold text-[#18181b] dark:text-white block mb-0.5">Ghi chú:</span>
                  {selectedExpense.note}
                </div>
              )}
            </div>

            {/* Participants share list */}
            <div>
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5">
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
                    <div key={pId} className="flex items-center justify-between text-xs py-1.5 border-b border-[#dedbd0]/70 dark:border-[#2e2e38]">
                      <span className="text-zinc-700 dark:text-zinc-300">{m?.displayName}</span>
                      <span className="font-mono font-bold text-[#18181b] dark:text-white">{formatVND(shareAmount)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detailed Audit History Timeline (Nhật ký kiểm toán chi tiết) */}
            <div className="pt-4 border-t border-[#dedbd0] dark:border-[#2e2e38] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                    <History className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <span>Lịch sử chỉnh sửa & Nhật ký kiểm toán</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold font-mono">
                        {Array.isArray(selectedExpense.history) ? selectedExpense.history.length : 1} bản ghi
                      </span>
                    </h4>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Minh bạch tài chính 100%
                </span>
              </div>

              {/* Timeline Container */}
              {/* Timeline Container with Connected Vertical Line */}
              <div className="relative pl-6 space-y-4 max-h-80 overflow-y-auto pr-1.5 before:absolute before:top-3 before:bottom-3 before:left-2.5 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
                {(Array.isArray(selectedExpense.history) && selectedExpense.history.length > 0
                  ? selectedExpense.history
                  : [
                      {
                        id: `hist_init_${selectedExpense.id}`,
                        action: 'CREATE',
                        authorName: members.find(m => m.userId === selectedExpense.createdBy)?.displayName || 'Thành viên',
                        timestamp: selectedExpense.createdAt || selectedExpense.date,
                        description: `Khởi tạo khoản chi ban đầu: ${formatVND(selectedExpense.amount)}`,
                        snapshot: {
                          title: selectedExpense.title,
                          amountFormatted: formatVND(selectedExpense.amount),
                          paidBy: members.find(m => m.userId === selectedExpense.paidBy)?.displayName || 'Thành viên',
                          splitType: selectedExpense.splitType === 'custom' ? 'Chia tùy chỉnh' : 'Chia đều',
                          participantCount: selectedExpense.participants?.length || 0,
                          date: selectedExpense.date,
                          note: selectedExpense.note || ''
                        }
                      }
                    ]
                ).map((item, idx, arr) => {
                  const isCreate = item.action === 'CREATE';
                  const revNum = arr.length - 1 - idx;
                  const author = members.find(m => m.userId === item.authorId);
                  const authorPhoto = item.authorPhotoURL || author?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.authorId || item.authorName || 'Spliqo'}`;

                  return (
                    <div key={item.id || idx} className="relative group">
                      {/* Connected Node Dot */}
                      <div className={`absolute -left-6 top-3.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-[#f4f2ec] dark:ring-[#191920] z-10 ${
                        isCreate 
                          ? 'bg-emerald-500 text-white shadow-xs' 
                          : 'bg-amber-500 text-white shadow-xs'
                      }`}>
                        {isCreate ? (
                          <Sparkles className="w-2.5 h-2.5" />
                        ) : (
                          <Edit3 className="w-2.5 h-2.5" />
                        )}
                      </div>

                      {/* History Card */}
                      <div className="p-3.5 rounded-2xl bg-[#edebe4]/70 dark:bg-[#1f1f28] border border-[#dedbd0] dark:border-[#2e2e38] text-xs space-y-2.5 transition-all shadow-xs hover:border-zinc-400/50 dark:hover:border-zinc-600/50">
                        {/* Entry Header: Revision Number + Author Info + Badge + Time */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={authorPhoto}
                              alt=""
                              className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 object-cover ring-1 ring-white/50 shrink-0"
                            />
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-bold text-zinc-900 dark:text-white truncate">
                                {item.authorName || 'Thành viên'}
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${
                                  isCreate
                                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40'
                                }`}
                              >
                                {isCreate ? '★ Khởi tạo ban đầu' : `Lần sửa #${revNum}`}
                              </span>
                            </div>
                          </div>

                          <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3 text-zinc-400" />
                            {item.timestamp ? new Date(item.timestamp).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                          </span>
                        </div>

                        {/* Brief description if available */}
                        {item.description && !isCreate && (
                          <p className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 italic pl-1 border-l-2 border-amber-400/60 dark:border-amber-500/40 py-0.5">
                            "{item.description}"
                          </p>
                        )}

                        {/* 1. Structured Diffs (Before & After visual cards) */}
                        {Array.isArray(item.diffs) && item.diffs.length > 0 ? (
                          <div className="space-y-1.5 pt-1">
                            {item.diffs.map((diff, dIdx) => (
                              <div
                                key={dIdx}
                                className="p-2.5 rounded-xl bg-white/80 dark:bg-[#18181f] border border-[#e6e4dc] dark:border-[#2e2e38] text-[11px] space-y-1"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                    {diff.field === 'amount' && <Receipt className="w-3.5 h-3.5 text-emerald-600" />}
                                    {diff.field === 'paidBy' && <User className="w-3.5 h-3.5 text-teal-600" />}
                                    {diff.field === 'title' && <FileText className="w-3.5 h-3.5 text-blue-600" />}
                                    {diff.field === 'participants' && <Users className="w-3.5 h-3.5 text-purple-600" />}
                                    {diff.field === 'splitType' && <Tag className="w-3.5 h-3.5 text-amber-600" />}
                                    {diff.field === 'customShares' && <DollarSign className="w-3.5 h-3.5 text-indigo-600" />}
                                    {diff.field === 'date' && <Calendar className="w-3.5 h-3.5 text-rose-600" />}
                                    {diff.field === 'note' && <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />}
                                    {diff.field === 'billImageUrl' && <Camera className="w-3.5 h-3.5 text-indigo-600" />}
                                    <span>{diff.label}:</span>
                                  </span>

                                  {/* Diff badge for Amount */}
                                  {diff.field === 'amount' && diff.diffFormatted && (
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        diff.isIncrease
                                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                      }`}
                                    >
                                      {diff.isIncrease ? `Tăng ${diff.diffFormatted}` : `Giảm ${diff.diffFormatted}`}
                                    </span>
                                  )}
                                </div>

                                {/* Diff Values Comparison: Old -> New */}
                                {diff.field === 'participants' ? (
                                  <div className="space-y-0.5 pl-5 pt-0.5">
                                    <div className="text-zinc-600 dark:text-zinc-400">
                                      Quy mô: <span className="line-through text-zinc-400">{diff.oldCount} người</span> → <strong className="text-zinc-900 dark:text-white">{diff.newCount} người</strong>
                                    </div>
                                    {diff.added && diff.added.length > 0 && (
                                      <div className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                        <span>+ Thêm:</span>
                                        <span>{diff.added.join(', ')}</span>
                                      </div>
                                    )}
                                    {diff.removed && diff.removed.length > 0 && (
                                      <div className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                                        <span>- Bỏ bớt:</span>
                                        <span>{diff.removed.join(', ')}</span>
                                      </div>
                                    )}
                                  </div>
                                ) : diff.field === 'customShares' ? (
                                  <div className="space-y-1.5 pl-5 pt-1">
                                    <div className="grid grid-cols-1 gap-1.5">
                                      {diff.shareChanges?.map((sc, scIdx) => (
                                        <div key={scIdx} className="p-2 rounded-lg bg-zinc-50 dark:bg-[#252530] border border-zinc-200/70 dark:border-zinc-700/60 flex items-center justify-between text-[11px]">
                                          <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">{sc.name}</span>
                                          <div className="flex items-center gap-1.5 font-mono">
                                            <span className="line-through text-zinc-400">{sc.oldShare}</span>
                                            <span className="text-zinc-400">→</span>
                                            <span className="font-bold text-zinc-900 dark:text-white">{sc.newShare}</span>
                                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${sc.isIncrease ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'}`}>
                                              {sc.diffFormatted}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : diff.field === 'billImageUrl' ? (
                                  <div className="pl-5 text-purple-700 dark:text-purple-300 font-semibold">
                                    {diff.action}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 pl-5 flex-wrap">
                                    <span className="line-through text-zinc-400 dark:text-zinc-500 font-mono">
                                      {diff.oldValue || '(Trống)'}
                                    </span>
                                    <span className="text-zinc-400">→</span>
                                    <span className="font-bold text-zinc-900 dark:text-white font-mono bg-zinc-100 dark:bg-[#252530] px-2 py-0.5 rounded-md">
                                      {diff.newValue || '(Trống)'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : isCreate && (item.snapshot || item.details) ? (
                          /* 2. Initial Setup Snapshot Grid */
                          <div className="space-y-1.5 pt-1">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                              <div className="p-2 rounded-xl bg-white/80 dark:bg-[#18181f] border border-[#e6e4dc] dark:border-[#2e2e38]">
                                <span className="text-zinc-400 text-[10px] block">Số tiền chi</span>
                                <strong className="text-emerald-700 dark:text-emerald-400 font-mono text-xs">
                                  {item.snapshot?.amountFormatted || (item.details?.find(d => d.field === 'amount')?.value) || formatVND(selectedExpense.amount)}
                                </strong>
                              </div>
                              <div className="p-2 rounded-xl bg-white/80 dark:bg-[#18181f] border border-[#e6e4dc] dark:border-[#2e2e38]">
                                <span className="text-zinc-400 text-[10px] block">Người trả tiền</span>
                                <strong className="text-zinc-900 dark:text-white truncate block">
                                  {item.snapshot?.paidBy || (item.details?.find(d => d.field === 'paidBy')?.value) || 'Thành viên'}
                                </strong>
                              </div>
                              <div className="p-2 rounded-xl bg-white/80 dark:bg-[#18181f] border border-[#e6e4dc] dark:border-[#2e2e38]">
                                <span className="text-zinc-400 text-[10px] block">Cách chia</span>
                                <strong className="text-zinc-900 dark:text-white truncate block">
                                  {item.snapshot?.splitType || (item.details?.find(d => d.field === 'splitType')?.value) || 'Chia đều'}
                                </strong>
                              </div>
                              <div className="p-2 rounded-xl bg-white/80 dark:bg-[#18181f] border border-[#e6e4dc] dark:border-[#2e2e38]">
                                <span className="text-zinc-400 text-[10px] block">Người tham gia</span>
                                <strong className="text-zinc-900 dark:text-white truncate block">
                                  {item.snapshot?.participantCount || selectedExpense.participants?.length || 0} người
                                </strong>
                              </div>
                              <div className="p-2 rounded-xl bg-white/80 dark:bg-[#18181f] border border-[#e6e4dc] dark:border-[#2e2e38]">
                                <span className="text-zinc-400 text-[10px] block">Ngày ghi nhận</span>
                                <strong className="text-zinc-900 dark:text-white font-mono block">
                                  {item.snapshot?.date || selectedExpense.date}
                                </strong>
                              </div>
                              <div className="p-2 rounded-xl bg-white/80 dark:bg-[#18181f] border border-[#e6e4dc] dark:border-[#2e2e38]">
                                <span className="text-zinc-400 text-[10px] block">Hóa đơn</span>
                                <strong className="text-zinc-900 dark:text-white truncate block">
                                  {item.snapshot?.hasBill || selectedExpense.billImageUrl ? 'Đã đính kèm bill' : 'Không có bill'}
                                </strong>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* 3. Text Changes Fallback */
                          <div className="space-y-1 pt-1">
                            {item.changes && item.changes.length > 0 ? (
                              <ul className="text-[11px] text-zinc-700 dark:text-zinc-300 space-y-1 pl-4 list-disc">
                                {item.changes.map((c, cIdx) => (
                                  <li key={cIdx}>{c}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 pl-2">{item.description}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action buttons: Edit, Delete */}
            <div className="flex items-center justify-between pt-3 border-t border-[#dedbd0] dark:border-[#2e2e38]">
              <button
                type="button"
                onClick={() => handleDeleteExpense(selectedExpense.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition-colors"
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
        onConfirmPayment={handleConfirmPayment}
      />

      {/* MODAL: MỜI BẰNG LINK & QR TRỰC TIẾP */}
      <InviteTripModal
        isOpen={inviteLinkModalOpen}
        onClose={() => setInviteLinkModalOpen(false)}
        trip={trip}
        onOpenFriendList={openInviteFriendsModal}
      />

      {/* MODAL: MỜI BẠN BÈ VÀO CHUYẾN ĐI NÀY */}
      <Modal
        isOpen={inviteFriendsModalOpen}
        onClose={() => setInviteFriendsModalOpen(false)}
        title="Mời bạn bè vào chuyến đi"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-zinc-500">
            Chọn bạn bè từ danh bạ để thêm trực tiếp vào chuyến đi "{trip.name}" mà họ không cần phải tự nhập mã mời.
          </p>

          {loadingFriends ? (
            <div className="py-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-500 mx-auto" />
              <p className="text-xs text-zinc-400 mt-2">Đang tải danh sách bạn bè...</p>
            </div>
          ) : friendsList.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-zinc-50 dark:bg-[#1a1a20] border border-zinc-200 dark:border-[#2e2e38] text-xs text-zinc-500 dark:text-zinc-400 space-y-2">
              <p>Bạn chưa có người bạn nào trong danh sách.</p>
              <Link
                to="/friends"
                className="inline-block text-xs font-bold text-zinc-900 dark:text-white underline"
              >
                Đi đến mục Bạn bè để kết bạn ngay →
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {friendsList.map((friend) => {
                const alreadyInTrip = members.some(m => m.userId === friend.uid);
                const isInvitingThis = invitingFriendId === friend.uid;

                return (
                  <div
                    key={friend.uid}
                    className="p-3 rounded-2xl bg-white dark:bg-[#212129] border border-[#dedbd0] dark:border-[#2e2e38] flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={friend.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.uid}`}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover bg-zinc-100 dark:bg-zinc-800 border border-black/5 dark:border-white/10 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[#18181b] dark:text-white truncate">{friend.displayName}</h4>
                        <p className="text-[11px] text-zinc-400 truncate">{friend.email}</p>
                      </div>
                    </div>

                    <div>
                      {alreadyInTrip ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 text-[11px] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          Đã tham gia
                        </span>
                      ) : (
                        <button
                          onClick={() => handleInviteFriendToTrip(friend)}
                          disabled={isInvitingThis}
                          className="tactile-btn-dark py-1.5 px-3 text-xs flex items-center gap-1.5"
                        >
                          {isInvitingThis ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Đang thêm...</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Thêm vào chuyến</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-2 border-t border-[#dedbd0] dark:border-[#2e2e38] flex items-center justify-between">
            <Link
              to="/friends"
              className="text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white underline"
            >
              Quản lý bạn bè →
            </Link>

            <button
              onClick={() => setInviteFriendsModalOpen(false)}
              className="px-4 py-2 bg-[#edebe4] dark:bg-[#252530] hover:bg-[#dedbd0] dark:hover:bg-[#2f2f3d] text-[#18181b] dark:text-white text-xs font-bold rounded-full transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: COMPLETE TRIP (CHỐT SỔ) */}
      <Modal
        isOpen={completeTripModalOpen}
        onClose={() => setCompleteTripModalOpen(false)}
        title={t('completeTripModalTitle', 'Chốt sổ chuyến đi')}
        maxWidth="max-w-xl"
      >
        <div className="space-y-5">
          {!isAllSettled ? (
            /* CASE 1: NOT ALL SETTLED - BLOCKED WITH EXPLANATION */
            <>
              <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 space-y-2">
                <div className="flex items-center gap-2.5 text-rose-800 dark:text-rose-300 font-bold text-sm">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{t('notReadyToComplete', 'Chưa đủ điều kiện chốt sổ')}</span>
                </div>
                <p className="text-xs text-rose-700 dark:text-rose-300/90 leading-relaxed">
                  {t('notReadyToCompleteDesc', 'Để đảm bảo quyền lợi tài chính sòng phẳng của tất cả thành viên, chuyến đi chỉ có thể được chốt sổ khi mọi người đã hoàn tất thanh toán và người nhận xác nhận đã nhận tiền.')}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  <span>{t('settlementProgressTitle', 'Tiến độ thanh toán công nợ')}</span>
                  <span>{confirmedSettlements}/{totalSettlements} ({settlementProgress}%)</span>
                </div>
                <div className="w-full bg-[#f4f3ec] dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden border border-[#e6e4dc] dark:border-zinc-700">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${settlementProgress}%` }}
                  />
                </div>
              </div>

              {/* List of Remaining Unsettled Debts */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    {unsettledDebts.length} {t('outstandingDebtsCount', 'khoản công nợ chưa hoàn tất')}:
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                  {unsettledDebts.map((debt) => (
                    <div
                      key={debt.id}
                      className="p-3 rounded-2xl bg-[#f4f3ec] dark:bg-[#1a1a20] border border-[#e6e4dc] dark:border-[#2e2e38] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={debt.fromUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${debt.fromUserId}`}
                          alt=""
                          className="w-7 h-7 rounded-full bg-white object-cover border border-[#e6e4dc] shrink-0"
                        />
                        <span className="font-bold text-[#18181b] dark:text-white truncate max-w-[90px] sm:max-w-[120px]">
                          {debt.fromUser?.displayName || 'Thành viên'}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-medium shrink-0">
                          {t('transferredTo', 'chuyển cho')}
                        </span>
                        <img
                          src={debt.toUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${debt.toUserId}`}
                          alt=""
                          className="w-7 h-7 rounded-full bg-white object-cover border border-[#e6e4dc] shrink-0"
                        />
                        <span className="font-bold text-[#18181b] dark:text-white truncate max-w-[90px] sm:max-w-[120px]">
                          {debt.toUser?.displayName || 'Thành viên'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-extrabold text-rose-600 dark:text-rose-400">
                          {formatVND(debt.amount)}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            debt.status === 'PAID'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {debt.status === 'PAID' ? t('paidPending', 'Đã chuyển (Chờ duyệt)') : t('unpaid', 'Chưa thanh toán')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#e6e4dc] dark:border-[#2e2e38] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => setCompleteTripModalOpen(false)}
                  className="tactile-btn-pill text-xs order-2 sm:order-1"
                >
                  {t('close', 'Đóng')}
                </button>

                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCompleteTripModalOpen(false);
                      setActiveTab('settlement');
                    }}
                    className="tactile-btn-dark text-xs flex items-center justify-center gap-1.5 flex-1 sm:flex-none"
                  >
                    <span>{t('viewSettlementTabBtn', 'Đến mục Quyết toán để xử lý')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* CASE 2: ALL SETTLED - READY TO COMPLETE */
            <>
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 space-y-2 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                  <Sparkles className="w-6 h-6 text-amber-300" />
                </div>
                <h4 className="text-base font-bold text-emerald-950 dark:text-emerald-100">
                  {t('readyToCompleteTitle', 'Sẵn sàng chốt sổ chuyến đi!')}
                </h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-200/90 max-w-md mx-auto leading-relaxed">
                  {t('readyToCompleteDesc', 'Tuyệt vời! Toàn bộ công nợ giữa các thành viên đã được thanh toán và đối soát hoàn tất 100%.')}
                </p>
              </div>

              {/* Snapshot Info */}
              <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-[#f4f3ec] dark:bg-[#1a1a20] border border-[#e6e4dc] dark:border-[#2e2e38] text-center">
                <div>
                  <span className="text-[10px] text-zinc-500 font-semibold block">{t('totalTripCost', 'Tổng chi')}</span>
                  <span className="text-xs font-extrabold text-[#18181b] dark:text-white truncate block">
                    {formatVND(balances?.totalExpense || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 font-semibold block">{t('members', 'Thành viên')}</span>
                  <span className="text-xs font-extrabold text-[#18181b] dark:text-white block">
                    {members.length} {t('memberShort', 'người')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 font-semibold block">{t('settlement', 'Công nợ')}</span>
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 block">
                    100% {t('confirmed', 'Đã tất toán')}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 text-center">
                * Sau khi chốt sổ, chuyến đi sẽ được lưu trữ với trạng thái "Đã chốt sổ", không phát sinh thêm chi phí mới.
              </p>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#e6e4dc] dark:border-[#2e2e38] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCompleteTripModalOpen(false)}
                  disabled={completingTrip}
                  className="tactile-btn-pill text-xs"
                >
                  {t('cancel', 'Hủy bỏ')}
                </button>

                <button
                  type="button"
                  onClick={handleConfirmCompleteTrip}
                  disabled={completingTrip}
                  className="tactile-btn-dark text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/15"
                >
                  {completingTrip ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      <span>{t('closingTripProgress', 'Đang chốt sổ...')}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t('confirmCloseTripBtn', 'Xác nhận chốt sổ ngay')}</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
