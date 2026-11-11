import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../services/api';
import { calculateLiveShares } from '../services/calculation';
import { createRealtimeStream } from '../services/realtime';
import { offlineSyncService } from '../services/offlineSyncService';
import { refreshExchangeRates } from '../services/currencyService';
import TripOverviewTab from '../components/trip/TripOverviewTab';
import TripExpensesTab from '../components/trip/TripExpensesTab';
import TripMembersTab from '../components/trip/TripMembersTab';
import TripSettlementsTab from '../components/trip/TripSettlementsTab';
import confetti from 'canvas-confetti';
import { getTripVisual } from '../utils/tripVisuals';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Plus, 
  Receipt, 
  Users, 
  DollarSign, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  Share2,
  AlertCircle,
  WifiOff,
  History
} from 'lucide-react';

const CameraModal = lazy(() => import('../components/CameraModal'));
const VietQRModal = lazy(() => import('../components/VietQRModal'));
const InviteTripModal = lazy(() => import('../components/InviteTripModal'));
const ExpenseFormModal = lazy(() => import('../components/trip/ExpenseFormModal'));
const ExpenseDetailModal = lazy(() => import('../components/trip/ExpenseDetailModal'));
const CompleteTripModal = lazy(() => import('../components/trip/CompleteTripModal'));
const InviteFriendsModal = lazy(() => import('../components/trip/InviteFriendsModal'));
const SmartNudgeModal = lazy(() => import('../components/SmartNudgeModal'));
const LuckyWheelModal = lazy(() => import('../components/trip/LuckyWheelModal'));
const TripWrappedModal = lazy(() => import('../components/trip/TripWrappedModal'));
const TripHistoryModal = lazy(() => import('../components/trip/TripHistoryModal'));

const VALID_TABS = ['overview', 'expenses', 'members', 'settlement', 'history'];

export default function TripDetailPage() {
  const { tripId } = useParams();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const { t, isEn, formatMoney } = useLanguage();

  const [trip, setTrip] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(!navigator.onLine);

  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');

  // Active Tab: overview | expenses | members | settlement (sync with URL ?tab=...)
  const [activeTab, setActiveTab] = useState(() => {
    return tabFromUrl && VALID_TABS.includes(tabFromUrl) && tabFromUrl !== 'history' ? tabFromUrl : 'overview';
  });

  // Trip History Modal State
  const [tripHistoryModalOpen, setTripHistoryModalOpen] = useState(() => tabFromUrl === 'history');
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Sync activeTab whenever ?tab= query parameter in URL changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'history') {
      setTripHistoryModalOpen(true);
    } else if (tabParam && VALID_TABS.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (newTab) => {
    if (newTab === 'history') {
      setTripHistoryModalOpen(true);
      return;
    }
    setActiveTab(newTab);
    setSearchParams((prev) => {
      const nextParams = new URLSearchParams(prev);
      if (newTab === 'overview') {
        nextParams.delete('tab');
      } else {
        nextParams.set('tab', newTab);
      }
      return nextParams;
    }, { replace: true });
  };

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

  // Lucky Wheel & Trip Wrapped Modals State
  const [luckyWheelModalOpen, setLuckyWheelModalOpen] = useState(false);
  const [tripWrappedModalOpen, setTripWrappedModalOpen] = useState(false);

  // Invite Link & QR Modal State
  const [inviteLinkModalOpen, setInviteLinkModalOpen] = useState(false);

  // Invite from Friends Modal State
  const [inviteFriendsModalOpen, setInviteFriendsModalOpen] = useState(false);
  const [friendsList, setFriendsList] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [invitingFriendId, setInvitingFriendId] = useState(null);

  // Smart Nudge Modal State
  const [smartNudgeModalOpen, setSmartNudgeModalOpen] = useState(false);
  const [smartNudgeSettlement, setSmartNudgeSettlement] = useState(null);

  // Expense Form State
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCurrency, setExpCurrency] = useState('VND');
  const [expOriginalAmount, setExpOriginalAmount] = useState('');
  const [expExchangeRate, setExpExchangeRate] = useState(1);
  const [expPaidBy, setExpPaidBy] = useState('');
  const [expParticipants, setExpParticipants] = useState([]);
  const [expSplitType, setExpSplitType] = useState('equal'); // equal | custom
  const [expIndividualAmounts, setExpIndividualAmounts] = useState({});
  const [expBillImageUrl, setExpBillImageUrl] = useState('');
  const [expDate, setExpDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expNote, setExpNote] = useState('');

  // Fetch exchange rates on mount
  useEffect(() => {
    refreshExchangeRates();
  }, []);

  // Fetch all trip data
  const loadTripData = useCallback(async () => {
    if (!tripId) return;
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

      // Load edit and audit activities
      try {
        const actData = await api.get(`/trips/${tripId}/activities`);
        setActivities(actData?.activities || []);
      } catch (actErr) {
        console.warn('[loadTripData] Activities notice:', actErr.message);
      }

      // If all settlements confirmed, trigger confetti once
      if (settleData.allSettled && settleData.settlements?.length > 0) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          disableForReducedMotion: true
        });
      }

      // Cache snapshot locally for offline access
      offlineSyncService.cacheTrip(tripId, {
        trip: tripData,
        members: tripData.members || [],
        expenses: tripData.expenses || [],
        balances: balData,
        settlements: settleData.settlements || []
      });
      setIsOfflineMode(false);
    } catch (err) {
      // Fallback to offline cached trip snapshot
      const cached = offlineSyncService.getCachedTrip(tripId);
      if (cached) {
        setTrip(cached.trip || cached);
        setMembers(cached.members || cached.trip?.members || []);
        setExpenses(cached.expenses || cached.trip?.expenses || []);
        setBalances(cached.balances || null);
        setSettlements(cached.settlements || []);
        setIsOfflineMode(true);
        showToast(t('offlineCachedNotice', 'Đang hiển thị dữ liệu chuyến đi từ bộ nhớ ngoại tuyến.'), 'info');
      } else {
        showToast(err.message || t('loadTripError', 'Lỗi khi tải thông tin chuyến đi'), 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [tripId, showToast, t]);

  const fetchTripActivities = useCallback(async () => {
    if (!tripId) return;
    try {
      setLoadingActivities(true);
      const res = await api.get(`/trips/${tripId}/activities`);
      if (res?.activities) {
        setActivities(res.activities);
      }
    } catch (err) {
      console.warn('[fetchTripActivities] Error:', err);
    } finally {
      setLoadingActivities(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadTripData();
  }, [loadTripData, currentUser]);

  // Real-time SSE synchronization for Trip events (Expenses, Settlements, Members)
  useEffect(() => {
    if (!tripId) return;

    const eventSource = createRealtimeStream({ tripId });
    if (!eventSource) return;

    // 1. Friend added a new expense
    eventSource.addEventListener('EXPENSE_ADDED', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.actor?.uid !== currentUser?.uid) {
          const friendName = data.actor?.displayName || t('friendFallback', 'Bạn bè');
          const title = data.expense?.title || t('newExpenseFallback', 'Khoản chi mới');
          showToast(
            t('sseExpenseAdded', '✨ {name} vừa thêm khoản chi "{title}"!')
              .replace('{name}', friendName)
              .replace('{title}', title),
            'info'
          );
        }
        loadTripData();
      } catch (err) {
        console.warn('[Trip SSE] EXPENSE_ADDED parse error:', err);
      }
    });

    // 2. Friend edited an expense
    eventSource.addEventListener('EXPENSE_UPDATED', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.actor?.uid !== currentUser?.uid) {
          const friendName = data.actor?.displayName || t('friendFallback', 'Bạn bè');
          const title = data.expense?.title || t('expenseFallback', 'Khoản chi');
          showToast(
            t('sseExpenseUpdated', '📝 {name} vừa cập nhật khoản chi "{title}".')
              .replace('{name}', friendName)
              .replace('{title}', title),
            'info'
          );
        }
        loadTripData();
      } catch (err) {
        console.warn('[Trip SSE] EXPENSE_UPDATED parse error:', err);
      }
    });

    // 3. An expense was deleted
    eventSource.addEventListener('EXPENSE_DELETED', () => {
      showToast(t('sseExpenseDeleted', '🗑️ Một khoản chi trong nhóm vừa được xóa.'), 'info');
      loadTripData();
    });

    // 4. Friend paid debt or confirmed payment receipt
    eventSource.addEventListener('SETTLEMENT_UPDATED', (event) => {
      try {
        const data = JSON.parse(event.data);
        const actorName = data.actor?.displayName || t('memberRole', 'Thành viên');
        if (data.status === 'CONFIRMED') {
          showToast(
            t('sseSettlementConfirmed', '🎉 {name} đã xác nhận nhận tiền thành công!').replace('{name}', actorName),
            'success'
          );
        } else if (data.status === 'PAID') {
          showToast(
            t('sseSettlementPaid', '💳 {name} đã đánh dấu chuyển khoản thanh toán nợ.').replace('{name}', actorName),
            'info'
          );
        }
        loadTripData();
      } catch (err) {
        console.warn('[Trip SSE] SETTLEMENT_UPDATED parse error:', err);
      }
    });

    // 5. New member joined or left
    eventSource.addEventListener('MEMBER_UPDATED', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.action === 'JOINED') {
          showToast(
            t('sseMemberJoined', '👋 {name} đã tham gia nhóm!').replace('{name}', data.user?.displayName || t('newMemberFallback', 'Thành viên mới')),
            'info'
          );
        }
        loadTripData();
      } catch (err) {
        console.warn('[Trip SSE] MEMBER_UPDATED parse error:', err);
      }
    });

    // 6. Trip status change (Completed/Updated)
    eventSource.addEventListener('TRIP_UPDATED', () => {
      loadTripData();
    });

    return () => {
      eventSource.close();
    };
  }, [tripId, currentUser?.uid, loadTripData, showToast, t]);

  // Offline sync event listeners
  useEffect(() => {
    const handleSyncCompleted = (e) => {
      const count = e.detail?.syncedCount;
      if (count > 0) {
        showToast(
          t('offlineSyncedToast', '⚡ Đã tự động đồng bộ {count} khoản chi ngoại tuyến lên hệ thống!').replace('{count}', count),
          'success'
        );
        loadTripData();
      }
    };

    const handleOnline = () => {
      setIsOfflineMode(false);
      offlineSyncService.syncOfflineQueue();
    };

    const handleOffline = () => {
      setIsOfflineMode(true);
    };

    window.addEventListener('spliqo:offline-sync-completed', handleSyncCompleted);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('spliqo:offline-sync-completed', handleSyncCompleted);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadTripData, showToast, t]);

  const openInviteFriendsModal = async () => {
    setInviteFriendsModalOpen(true);
    try {
      setLoadingFriends(true);
      const res = await api.get('/friends');
      setFriendsList(res.friends || []);
    } catch (err) {
      showToast(err.message || t('loadFriendsError', 'Lỗi khi tải danh sách bạn bè'), 'error');
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
      showToast(
        res.message || t('addedFriendToTripToast', 'Đã thêm {name} vào chuyến đi!').replace('{name}', friend.displayName),
        'success'
      );
      loadTripData();
    } catch (err) {
      showToast(err.message || t('addFriendToTripError', 'Lỗi khi thêm bạn bè vào chuyến đi'), 'error');
    } finally {
      setInvitingFriendId(null);
    }
  };

  // Copy Trip Code
  const handleCopyCode = () => {
    if (!trip?.tripCode) return;
    navigator.clipboard.writeText(trip.tripCode);
    setCopiedCode(true);
    showToast(t('copiedCodeToastWithCode', 'Đã sao chép mã {code} vào bộ nhớ tạm!').replace('{code}', trip.tripCode), 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Open Add Expense modal
  const handleOpenAddExpense = () => {
    setEditingExpense(null);
    setExpTitle('');
    setExpAmount('');
    setExpCurrency('VND');
    setExpOriginalAmount('');
    setExpExchangeRate(1);
    setExpPaidBy(currentUser?.uid || members[0]?.userId || members[0]?.uid || members[0]?.id || '');
    const allMemberIds = members.map((m) => m.userId || m.uid || m.id);
    setExpParticipants(allMemberIds);
    setExpSplitType('equal');
    setExpIndividualAmounts({});
    setExpBillImageUrl('');
    setExpDate(new Date().toISOString().split('T')[0]);
    setExpNote('');
    setAddExpenseModalOpen(true);
  };

  // Allow mobile BottomNav quick (+) action to open Add Expense inside trip detail
  const openAddExpenseRef = useRef(null);
  useEffect(() => {
    openAddExpenseRef.current = () => {
      if (trip) handleOpenAddExpense();
    };
  });

  useEffect(() => {
    const onOpenAdd = () => openAddExpenseRef.current?.();
    window.addEventListener('spliqo:open-add-expense', onOpenAdd);
    return () => window.removeEventListener('spliqo:open-add-expense', onOpenAdd);
  }, []);

  // Open Edit Expense modal
  const handleOpenEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpTitle(expense.title);
    setExpAmount(expense.amount);
    setExpCurrency(expense.currency || 'VND');
    setExpOriginalAmount(expense.originalAmount !== undefined ? expense.originalAmount : expense.amount);
    setExpExchangeRate(expense.exchangeRate || 1);
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
    setExpParticipants(members.map((m) => m.userId || m.uid || m.id));
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
      showToast(t('enterExpenseTitleError', 'Vui lòng nhập tên khoản chi'), 'error');
      return;
    }
    if (numAmount <= 0) {
      showToast(t('invalidExpenseAmountError', 'Số tiền chi tiêu phải lớn hơn 0'), 'error');
      return;
    }
    if (!expPaidBy) {
      showToast(t('selectPayerError', 'Vui lòng chọn người thanh toán'), 'error');
      return;
    }
    if (expParticipants.length === 0) {
      showToast(t('selectParticipantsError', 'Vui lòng chọn ít nhất một người tham gia'), 'error');
      return;
    }

    if (expSplitType === 'custom') {
      if (!liveShares.isValid) {
        showToast(
          liveShares.remaining > 0
            ? (isEn
                ? `Split total is short by ${formatMoney(liveShares.remaining)}`
                : `Tổng tiền chia còn thiếu ${formatMoney(liveShares.remaining)}`)
            : (isEn
                ? `Split total exceeded by ${formatMoney(Math.abs(liveShares.remaining))}`
                : `Tổng tiền chia đã vượt quá ${formatMoney(Math.abs(liveShares.remaining))}`),
          'error'
        );
        return;
      }
    }

    const payload = {
      title: expTitle.trim(),
      amount: numAmount,
      currency: expCurrency,
      originalAmount: expCurrency !== 'VND' ? (Number(expOriginalAmount) || numAmount) : numAmount,
      exchangeRate: expCurrency !== 'VND' ? (Number(expExchangeRate) || 1) : 1,
      paidBy: expPaidBy,
      participants: expParticipants,
      splitType: expSplitType,
      individualAmounts: expSplitType === 'custom' ? expIndividualAmounts : {},
      billImageUrl: expBillImageUrl,
      note: expNote.trim(),
      date: expDate,
    };

    // If completely offline (lost 4G/Wifi in mountains/islands), queue locally
    if (!navigator.onLine) {
      offlineSyncService.enqueueExpense(tripId, payload);
      const tempExpense = {
        id: `offline_${Date.now()}`,
        ...payload,
        isOfflinePending: true,
        createdAt: new Date().toISOString()
      };
      setExpenses((prev) => [tempExpense, ...prev]);
      showToast(t('offlineExpenseSavedToast', '📶 Đang ngoại tuyến. Khoản chi đã được lưu tạm và sẽ tự động đồng bộ khi có mạng!'), 'success');
      setAddExpenseModalOpen(false);
      return;
    }

    try {
      setSubmitting(true);
      if (editingExpense) {
        await api.put(`/trips/${tripId}/expenses/${editingExpense.id}`, payload);
        showToast(t('expenseUpdatedSuccess', 'Cập nhật khoản chi thành công!'), 'success');
      } else {
        try {
          await api.post(`/trips/${tripId}/expenses`, payload);
          showToast(t('expenseAddedSuccess', 'Thêm khoản chi mới thành công!'), 'success');
        } catch (apiErr) {
          // If network dropped mid-submission
          const isNetErr = !navigator.onLine || apiErr.message?.includes('Network Error') || apiErr.message?.includes('không phản hồi');
          if (isNetErr) {
            offlineSyncService.enqueueExpense(tripId, payload);
            const tempExpense = {
              id: `offline_${Date.now()}`,
              ...payload,
              isOfflinePending: true,
              createdAt: new Date().toISOString()
            };
            setExpenses((prev) => [tempExpense, ...prev]);
            showToast(t('offlineNetworkLostSavedToast', '📶 Mất sóng mạng. Khoản chi đã được lưu tạm và sẽ tự động đồng bộ khi có kết nối lại!'), 'info');
            setAddExpenseModalOpen(false);
            return;
          }
          throw apiErr;
        }
      }

      setAddExpenseModalOpen(false);
      loadTripData();
    } catch (err) {
      showToast(err.message || t('saveExpenseError', 'Lỗi lưu khoản chi'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (expenseId) => {
    const isConfirmed = await confirm({
      title: t('deleteExpenseConfirmTitle', 'Xóa khoản chi này?'),
      message: t('deleteExpenseConfirmMsg', 'Bạn có chắc chắn muốn xóa khoản chi này? Khoản tiền này sẽ được trừ ra và tính toán lại công nợ của cả nhóm.'),
      confirmText: t('confirmDeleteBtn', 'Xác nhận xóa'),
      cancelText: t('keepBtn', 'Giữ lại'),
      type: 'danger'
    });
    if (!isConfirmed) return;

    try {
      await api.delete(`/trips/${tripId}/expenses/${expenseId}`);
      showToast(t('expenseDeletedSuccess', 'Đã xóa khoản chi thành công'), 'success');
      setViewExpenseModalOpen(false);
      loadTripData();
    } catch (err) {
      showToast(err.message || t('deleteExpenseError', 'Lỗi khi xóa khoản chi'), 'error');
    }
  };

  // Remove member
  const handleRemoveMember = async (member) => {
    const isConfirmed = await confirm({
      title: t('removeMemberConfirmTitle', 'Xóa thành viên?'),
      message: t('removeMemberConfirmMsg', 'Bạn có chắc muốn xóa thành viên "{name}" khỏi chuyến đi?').replace('{name}', member.displayName || ''),
      confirmText: t('removeMemberConfirmBtn', 'Xóa thành viên'),
      cancelText: t('cancel', 'Hủy bỏ'),
      type: 'danger'
    });
    if (!isConfirmed) return;

    try {
      const targetId = member.userId || member.uid || member.id;
      await api.delete(`/trips/${tripId}/members/${targetId}`);
      showToast(t('memberRemovedSuccess', 'Đã xóa thành viên khỏi chuyến đi'), 'success');
      loadTripData();
    } catch (err) {
      showToast(err.message || t('removeMemberError', 'Lỗi khi xóa thành viên'), 'error');
    }
  };

  // Mark Settlement as Paid (by Debtor)
  const handleMarkAsPaid = async (settlement) => {
    await api.post(`/trips/${tripId}/settlements/${settlement.id}/pay`, {
      fromUserId: settlement.fromUserId,
      toUserId: settlement.toUserId,
      amount: settlement.amount,
    });
    loadTripData();
  };

  // Confirm Settlement Payment (by Creditor/Receiver)
  const handleConfirmPayment = async (settlement) => {
    try {
      await api.post(`/trips/${tripId}/settlements/${settlement.id}/confirm`, {
        toUserId: settlement.toUserId,
      });
      showToast(t('confirmReceiptSuccessToast', 'Xác nhận nhận tiền thành công! Giao dịch đã được chốt.'), 'success');
      confetti({ particleCount: 50, spread: 60, disableForReducedMotion: true });
      loadTripData();
    } catch (err) {
      showToast(err.message || t('confirmPaymentError', 'Lỗi khi xác nhận thanh toán'), 'error');
    }
  };

  // Settlement progress & completion condition
  const unsettledDebts = settlements.filter((s) => s.status !== 'CONFIRMED');
  const isAllSettled = settlements.length === 0 || unsettledDebts.length === 0;
  const totalSettlements = settlements.length;
  const confirmedSettlements = settlements.filter((s) => s.status === 'CONFIRMED').length;
  const settlementProgress = totalSettlements > 0 ? Math.round((confirmedSettlements / totalSettlements) * 100) : 100;

  // Confirm Complete Trip
  const handleConfirmCompleteTrip = async () => {
    try {
      setCompletingTrip(true);
      const res = await api.post(`/trips/${tripId}/complete`);
      showToast(res.message || t('tripCompletedSuccess', 'Chuyến đi đã chốt sổ thành công!'), 'success');
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 }, disableForReducedMotion: true });
      setCompleteTripModalOpen(false);
      loadTripData();

      // Automatically open Spliqo Wrapped celebration recap
      setTimeout(() => {
        setTripWrappedModalOpen(true);
      }, 600);
    } catch (err) {
      showToast(err.message || t('completeTripError', 'Lỗi khi hoàn thành chuyến đi'), 'error');
    } finally {
      setCompletingTrip(false);
    }
  };

  // Update Trip Budget Handler
  const handleSaveBudget = async (budgetObj) => {
    try {
      await api.put(`/trips/${tripId}`, {
        budget: budgetObj
      });
      setTrip((prev) => ({ ...prev, budget: budgetObj }));
      showToast(
        budgetObj
          ? t('budgetSavedToast', 'Đã lưu hạn mức chi tiêu của chuyến đi!')
          : t('budgetRemovedToast', 'Đã xóa hạn mức chi tiêu.'),
        'success'
      );
      loadTripData();
    } catch (err) {
      showToast(err.message || t('updateBudgetError', 'Lỗi khi cập nhật hạn mức'), 'error');
      throw err;
    }
  };

  // Gamification: Select Lucky Wheel winner to create expense
  const handlePickWinnerForExpense = (winnerMember, mode) => {
    const winnerId = winnerMember.userId || winnerMember.uid || winnerMember.id;
    setSelectedExpense(null);
    setEditingExpense(null);
    setExpTitle(
      mode === 'payer'
        ? (isEn ? 'Treat meal / Drinks (Full bill)' : 'Chầu ăn uống / Cafe (Bao trọn)')
        : mode === 'lucky_free'
        ? (isEn ? 'Group treat (Lucky free pass)' : 'Chầu ăn uống (Được khao)')
        : (isEn ? 'Drinks / Coffee round' : 'Chầu cafe / trà sữa')
    );
    setExpAmount('');
    setExpCurrency('VND');
    setExpOriginalAmount('');
    setExpExchangeRate(1);

    if (mode === 'lucky_free') {
      // Winner is treated for free (0đ): participants are other members
      const otherMembers = members.filter(m => (m.userId || m.uid || m.id) !== winnerId);
      const otherIds = otherMembers.map(m => m.userId || m.uid || m.id);
      setExpParticipants(otherIds.length > 0 ? otherIds : [winnerId]);
      const myId = currentUser?.uid || currentUser?.userId || currentUser?.id;
      const payerId = myId && myId !== winnerId ? myId : (otherIds[0] || winnerId);
      setExpPaidBy(payerId);
    } else if (mode === 'payer') {
      // Winner pays 100% (bao trọn)
      setExpPaidBy(winnerId);
      setExpParticipants([winnerId]);
    } else {
      // Advance (Ứng trước): Winner pays, all members split equally
      setExpPaidBy(winnerId);
      setExpParticipants(members.map(m => m.userId || m.uid || m.id));
    }

    setExpSplitType('equal');
    setExpIndividualAmounts({});
    setExpBillImageUrl('');
    setExpDate(new Date().toISOString().split('T')[0]);
    setExpNote(
      isEn
        ? `Lucky Wheel pick: ${winnerMember.displayName} (${mode === 'lucky_free' ? 'Free pass' : mode === 'payer' ? 'Covers full bill' : 'Advanced payment'})!`
        : `Quay từ Vòng xoay may mắn: ${winnerMember.displayName} được chọn (${mode === 'lucky_free' ? 'Được khao 0đ' : mode === 'payer' ? 'Bao trọn chầu' : 'Ứng tiền trước'})!`
    );
    setLuckyWheelModalOpen(false);
    setAddExpenseModalOpen(true);
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
        <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">{t('loadingTripData', 'Đang tải dữ liệu chuyến đi...')}</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="py-20 text-center">
        <p className="text-base text-slate-700 dark:text-zinc-300 font-semibold mb-4">{t('tripNotFoundNotice', 'Không tìm thấy thông tin chuyến đi.')}</p>
        <Link to="/dashboard" className="tactile-btn-dark inline-flex items-center gap-2 px-5 py-3 text-sm font-bold">
          {t('backToHome', 'Về trang chủ')}
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
            onClick={() => setCompleteTripModalOpen(true)}
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

      {/* Offline Status Banner */}
      {isOfflineMode && (
        <div className="mb-4 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="font-bold">{t('offlineModeBannerTitle', 'Đang hoạt động ngoại tuyến (Offline Mode)')}</p>
              <p className="text-[11px] opacity-85">
                {t('offlineModeBannerDesc', 'Bạn vẫn có thể xem chuyến đi và ghi chép chi tiêu bình thường. Dữ liệu sẽ tự động đồng bộ ngay khi có sóng 4G/Wifi.')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => offlineSyncService.syncOfflineQueue()}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shrink-0 transition-colors cursor-pointer"
          >
            {t('retrySyncBtn', 'Thử đồng bộ')}
          </button>
        </div>
      )}

      {/* Main Trip Header Card */}
      <div className="tactile-card p-6 sm:p-8 relative overflow-hidden">
        {trip && (() => {
          const visual = getTripVisual(trip);
          const VisualIcon = visual.Icon;
          return (
            <div className="absolute -right-6 -bottom-6 opacity-[0.04] dark:opacity-[0.06] pointer-events-none transform -rotate-12 text-[#18181b] dark:text-white">
              <VisualIcon className="w-48 h-48 stroke-[1.1]" />
            </div>
          );
        })()}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-transparent dark:border-emerald-800/40">
                {trip.status === 'COMPLETED' ? t('completedTrip', 'Đã hoàn thành') : t('activeTrip', 'Đang hoạt động')}
              </span>

              {/* Trip Code Pill */}
              <button
                type="button"
                onClick={handleCopyCode}
                aria-label={`${t('copyCodeTooltip', 'Sao chép mã mời')}: #${trip.tripCode}`}
                className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f4f3ec] dark:bg-[#212129] hover:bg-[#eae8df] dark:hover:bg-[#2c2c36] text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold transition-all border border-[#e6e4dc] dark:border-[#32323e]"
                title={t('copyCodeTooltip', 'Bấm để sao chép mã mời')}
              >
                <span>{t('tripCodeLabel', 'Mã:')} #{trip.tripCode}</span>
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />}
              </button>

              {/* Invite via Link & QR Button */}
              <button
                type="button"
                onClick={() => setInviteLinkModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold transition-all border border-blue-200 dark:border-blue-800/50 cursor-pointer shadow-xs active:scale-95"
                title={t('inviteViaLinkTitle', 'Mời bạn bè & khách bằng link hoặc mã QR')}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{t('inviteViaLinkBtn', 'Mời bằng link')}</span>
              </button>
            </div>

            <div className="flex items-center gap-3 pt-1">
              {trip && (() => {
                const visual = getTripVisual(trip);
                const VisualIcon = visual.Icon;
                return (
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs bg-gradient-to-br ${visual.gradient} text-white`}
                    title={visual.label}
                  >
                    <VisualIcon className="w-5 h-5 stroke-[2.3] drop-shadow-xs" />
                  </div>
                );
              })()}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18181b] dark:text-white tracking-tight">
                {trip.name}
              </h1>
            </div>

            {trip.description && (
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-xl">
                {trip.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400 pt-1">
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
                <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">{t('totalTripCost', 'Tổng chi phí')}</span>
                <div className="text-xl sm:text-2xl font-extrabold text-[#18181b] dark:text-white">
                  {formatMoney(balances?.totalExpense || 0)}
                </div>
              </div>
              <div className="h-8 w-px bg-[#e6e4dc] dark:bg-[#32323e]" />
              <div className="text-right sm:text-left">
                <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">{t('scale', 'Quy mô')}</span>
                <div className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  {members.length} {t('membersUnit', 'Người')} • {expenses.length} {t('billsUnit', 'Bill')}
                </div>
              </div>
            </div>

            <button
              type="button"
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
            { id: 'settlement', label: t('settlementVietQR', 'Quyết toán công nợ'), count: settlements.length, icon: Sparkles },
            { id: 'history', label: t('editHistory', 'Lịch sử chỉnh sửa'), count: activities.length, icon: History },
          ].map((tab) => {
            const isTabActive = tab.id === 'history' ? tripHistoryModalOpen : activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`tactile-tab shrink-0 whitespace-nowrap ${isTabActive ? 'active-emerald' : ''}`}
              >
                <span className="whitespace-nowrap shrink-0">{tab.label}</span>
                {tab.count !== null && (
                  <span className={`tactile-badge w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 leading-none ${isTabActive ? 'bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-950 dark:text-emerald-200' : 'bg-[#f4f3ec] dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'}`}>
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
        <TripOverviewTab
          trip={trip}
          expenses={expenses}
          members={members}
          balances={balances}
          currentUser={currentUser}
          onSaveBudget={handleSaveBudget}
          onOpenLuckyWheel={() => setLuckyWheelModalOpen(true)}
          onOpenTripWrapped={() => setTripWrappedModalOpen(true)}
          t={t}
        />
      )}

      {/* TAB CONTENT 2: EXPENSES */}
      {activeTab === 'expenses' && (
        <TripExpensesTab
          expenses={expenses}
          filteredExpenses={filteredExpenses}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedPayerFilter={selectedPayerFilter}
          setSelectedPayerFilter={setSelectedPayerFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          members={members}
          onOpenAddExpense={handleOpenAddExpense}
          onSelectExpense={(exp) => {
            setSelectedExpense(exp);
            setViewExpenseModalOpen(true);
          }}
          t={t}
        />
      )}

      {/* TAB CONTENT 3: MEMBERS */}
      {activeTab === 'members' && (
        <TripMembersTab
          trip={trip}
          members={members}
          isCreator={isCreator}
          copiedCode={copiedCode}
          onCopyCode={handleCopyCode}
          onOpenInviteLinkModal={() => setInviteLinkModalOpen(true)}
          onOpenInviteFriendsModal={openInviteFriendsModal}
          onRemoveMember={handleRemoveMember}
          t={t}
        />
      )}

      {/* TAB CONTENT 4: SETTLEMENT */}
      {activeTab === 'settlement' && (
        <TripSettlementsTab
          trip={trip}
          balances={balances}
          members={members}
          settlements={settlements}
          currentUser={currentUser}
          isCreator={isCreator}
          unsettledDebts={unsettledDebts}
          confirmedSettlements={confirmedSettlements}
          totalSettlements={totalSettlements}
          settlementProgress={settlementProgress}
          isAllSettled={isAllSettled}
          onOpenCompleteModal={() => setCompleteTripModalOpen(true)}
          onOpenVietQR={(s) => {
            setSelectedSettlement(s);
            setVietQrModalOpen(true);
          }}
          onOpenSmartNudge={(s) => {
            setSmartNudgeSettlement(s);
            setSmartNudgeModalOpen(true);
          }}
          onMarkAsPaid={handleMarkAsPaid}
          onConfirmPayment={handleConfirmPayment}
          t={t}
        />
      )}

      <Suspense fallback={null}>
        {/* MODAL: ADD / EDIT EXPENSE */}
        {addExpenseModalOpen && (
          <ExpenseFormModal
            isOpen={addExpenseModalOpen}
            onClose={() => setAddExpenseModalOpen(false)}
            editingExpense={editingExpense}
            members={members}
            currentUser={currentUser}
            expTitle={expTitle}
            setExpTitle={setExpTitle}
            expAmount={expAmount}
            setExpAmount={setExpAmount}
            expCurrency={expCurrency}
            setExpCurrency={setExpCurrency}
            expOriginalAmount={expOriginalAmount}
            setExpOriginalAmount={setExpOriginalAmount}
            expExchangeRate={expExchangeRate}
            setExpExchangeRate={setExpExchangeRate}
            expPaidBy={expPaidBy}
            setExpPaidBy={setExpPaidBy}
            expParticipants={expParticipants}
            expSplitType={expSplitType}
            setExpSplitType={setExpSplitType}
            expIndividualAmounts={expIndividualAmounts}
            setExpIndividualAmounts={setExpIndividualAmounts}
            expBillImageUrl={expBillImageUrl}
            expDate={expDate}
            setExpDate={setExpDate}
            expNote={expNote}
            setExpNote={setExpNote}
            liveShares={liveShares}
            submitting={submitting}
            onSaveExpense={handleSaveExpense}
            onOpenCamera={() => setCameraModalOpen(true)}
            onSelectAllParticipants={handleSelectAllParticipants}
            onClearAllParticipants={handleClearAllParticipants}
            onToggleParticipant={toggleParticipant}
            t={t}
          />
        )}

        {/* MODAL: VIEW EXPENSE DETAIL & AUDIT HISTORY */}
        {viewExpenseModalOpen && selectedExpense && (
          <ExpenseDetailModal
            isOpen={viewExpenseModalOpen}
            onClose={() => setViewExpenseModalOpen(false)}
            selectedExpense={selectedExpense}
            members={members}
            onDeleteExpense={handleDeleteExpense}
            onOpenEditExpense={handleOpenEditExpense}
            t={t}
          />
        )}

        {/* CAMERA & BILL UPLOAD MODAL */}
        {cameraModalOpen && (
          <CameraModal
            isOpen={cameraModalOpen}
            onClose={() => setCameraModalOpen(false)}
            currentImageUrl={expBillImageUrl}
            onImageSelected={(url) => setExpBillImageUrl(url)}
          />
        )}

        {/* VIETQR & PAYMENT MODAL */}
        {vietQrModalOpen && selectedSettlement && (
          <VietQRModal
            isOpen={vietQrModalOpen}
            onClose={() => {
              setVietQrModalOpen(false);
              setSelectedSettlement(null);
            }}
            settlement={selectedSettlement}
            tripName={trip.name}
            onMarkAsPaid={handleMarkAsPaid}
            onConfirmPayment={handleConfirmPayment}
          />
        )}

        {/* MODAL: MỜI BẰNG LINK & QR TRỰC TIẾP */}
        {inviteLinkModalOpen && (
          <InviteTripModal
            isOpen={inviteLinkModalOpen}
            onClose={() => setInviteLinkModalOpen(false)}
            trip={trip}
            onOpenFriendList={openInviteFriendsModal}
          />
        )}

        {/* MODAL: MỜI BẠN BÈ VÀO CHUYẾN ĐI NÀY */}
        {inviteFriendsModalOpen && (
          <InviteFriendsModal
            isOpen={inviteFriendsModalOpen}
            onClose={() => setInviteFriendsModalOpen(false)}
            trip={trip}
            friendsList={friendsList}
            loadingFriends={loadingFriends}
            invitingFriendId={invitingFriendId}
            members={members}
            onInviteFriend={handleInviteFriendToTrip}
            t={t}
          />
        )}

        {/* MODAL: CONFIRM COMPLETE TRIP */}
        {completeTripModalOpen && (
          <CompleteTripModal
            isOpen={completeTripModalOpen}
            onClose={() => setCompleteTripModalOpen(false)}
            isAllSettled={isAllSettled}
            confirmedSettlements={confirmedSettlements}
            totalSettlements={totalSettlements}
            settlementProgress={settlementProgress}
            unsettledDebts={unsettledDebts}
            balances={balances}
            members={members}
            completingTrip={completingTrip}
            onConfirmCompleteTrip={handleConfirmCompleteTrip}
            onGoToSettlementTab={() => {
              setCompleteTripModalOpen(false);
              setActiveTab('settlement');
            }}
            t={t}
          />
        )}

        {/* MODAL: SMART NUDGE (NHẮC NỢ THÔNG MINH) */}
        {smartNudgeModalOpen && smartNudgeSettlement && (
          <SmartNudgeModal
            isOpen={smartNudgeModalOpen}
            onClose={() => {
              setSmartNudgeModalOpen(false);
              setSmartNudgeSettlement(null);
            }}
            settlement={smartNudgeSettlement}
            tripName={trip?.name}
            onNudgeSent={(updated) => {
              setSettlements(prev => prev.map(s => (s.id === updated.id ? { ...s, ...updated } : s)));
            }}
          />
        )}

        {/* MODAL: LUCKY WHEEL (VÒNG XOAY MAY MẮN) */}
        {luckyWheelModalOpen && (
          <LuckyWheelModal
            isOpen={luckyWheelModalOpen}
            onClose={() => setLuckyWheelModalOpen(false)}
            members={members}
            onPickWinnerForExpense={handlePickWinnerForExpense}
            t={t}
          />
        )}

        {/* MODAL: SPLIQO WRAPPED (THẺ KÝ ỨC CHUYẾN ĐI) */}
        {tripWrappedModalOpen && (
          <TripWrappedModal
            isOpen={tripWrappedModalOpen}
            onClose={() => setTripWrappedModalOpen(false)}
            trip={trip}
            expenses={expenses}
            members={members}
            balances={balances}
            settlements={settlements}
            t={t}
          />
        )}

        {/* MODAL: TRIP AUDIT & EDIT HISTORY */}
        {tripHistoryModalOpen && (
          <TripHistoryModal
            isOpen={tripHistoryModalOpen}
            onClose={() => setTripHistoryModalOpen(false)}
            activities={activities}
            loading={loadingActivities}
            onRefresh={fetchTripActivities}
            tripName={trip?.name || ''}
          />
        )}
      </Suspense>
    </div>
  );
}
