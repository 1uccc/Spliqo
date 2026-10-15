import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../services/api';
import { formatVND } from '../services/calculation';
import { createRealtimeStream } from '../services/realtime';
import VietQRModal from '../components/VietQRModal';
import SmartNudgeModal from '../components/SmartNudgeModal';
import { 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  Building, 
  Copy, 
  Check, 
  CheckCircle2, 
  Clock, 
  QrCode, 
  RefreshCw, 
  ShieldCheck, 
  User,
  Sparkles
} from 'lucide-react';

export default function SettlementsPage() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [settlementOverview, setSettlementOverview] = useState({
    totalSpent: 0,
    totalDebt: 0,
    totalReceivable: 0,
    myDebts: [],
    owedToMe: [],
    trips: []
  });
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [vietQrModalOpen, setVietQrModalOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [nudgeModalOpen, setNudgeModalOpen] = useState(false);
  const [nudgeSettlement, setNudgeSettlement] = useState(null);

  const fetchOverviewData = useCallback(async () => {
    try {
      setOverviewLoading(true);
      let overview = null;
      try {
        overview = await api.get('/settlements/overview');
      } catch (err) {
        console.warn('Backend overview endpoint failed, computing fallback client-side:', err);
      }

      if (!overview || !overview.myDebts) {
        const allTrips = await api.get('/trips');
        let totalSpent = 0;
        let totalDebt = 0;
        let totalReceivable = 0;
        const myDebts = [];
        const owedToMe = [];
        const currentUid = currentUser?.uid || currentUser?.userId || currentUser?.id;

        for (const trip of allTrips) {
          try {
            const tripDetail = await api.get(`/trips/${trip.id}`);
            const expenses = tripDetail.expenses || [];
            const userPaidInTrip = expenses
              .filter(e => e.paidBy === currentUid)
              .reduce((sum, e) => sum + (e.amount || 0), 0);
            totalSpent += userPaidInTrip;

            const tripSettlements = tripDetail.settlements || [];
            tripSettlements.forEach(s => {
              const toUser = s.toUser || tripDetail.members?.find(m => (m.userId === s.toUserId || m.uid === s.toUserId || m.id === s.toUserId)) || {};
              const fromUser = s.fromUser || tripDetail.members?.find(m => (m.userId === s.fromUserId || m.uid === s.fromUserId || m.id === s.fromUserId)) || {};
              const enhanced = {
                ...s,
                tripId: trip.id,
                tripName: trip.name,
                tripCode: trip.tripCode,
                toUser,
                fromUser
              };

              if (s.fromUserId === currentUid) {
                myDebts.push(enhanced);
                if (s.status !== 'CONFIRMED') {
                  totalDebt += s.amount || 0;
                }
              }

              if (s.toUserId === currentUid) {
                owedToMe.push(enhanced);
                if (s.status !== 'CONFIRMED') {
                  totalReceivable += s.amount || 0;
                }
              }
            });
          } catch (e) {
            console.warn(`Could not compute settlements for trip ${trip.id}:`, e);
          }
        }

        overview = {
          totalSpent,
          totalDebt,
          totalReceivable,
          myDebts,
          owedToMe,
          trips: allTrips
        };
      }

      setSettlementOverview(overview || {
        totalSpent: 0,
        totalDebt: 0,
        totalReceivable: 0,
        myDebts: [],
        owedToMe: [],
        trips: []
      });
    } catch (err) {
      console.error('Failed to load settlement overview:', err);
    } finally {
      setOverviewLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchOverviewData();

    const eventSource = createRealtimeStream();
    if (eventSource) {
      eventSource.addEventListener('NOTIFICATION_NEW', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'PAYMENT_CONFIRMED' || data.type === 'PAYMENT_PAID') {
            fetchOverviewData();
          }
        } catch (err) {
          console.warn('[Settlements SSE] Error parsing notification:', err);
        }
      });
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [fetchOverviewData]);

  // Handle Mark As Paid (Debtor confirms they transferred)
  const handleMarkAsPaid = async (debt) => {
    try {
      setProcessingId(debt.id);
      await api.post(`/trips/${debt.tripId}/settlements/${debt.id}/pay`, {
        fromUserId: currentUser?.uid,
        toUserId: debt.toUserId,
        amount: debt.amount
      });
      showToast(`Đã xác nhận đã chuyển tiền cho ${debt.toUser?.displayName || 'thành viên'}!`, 'success');
      await fetchOverviewData();
    } catch (err) {
      showToast(err.message || 'Lỗi khi xác nhận chuyển tiền', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Confirm Payment (Recipient confirms receipt)
  const handleConfirmPayment = async (credit) => {
    try {
      setProcessingId(credit.id);
      await api.post(`/trips/${credit.tripId}/settlements/${credit.id}/confirm`, {
        toUserId: currentUser?.uid
      });
      showToast(`Đã xác nhận nhận tiền thành công từ ${credit.fromUser?.displayName || 'thành viên'}!`, 'success');
      await fetchOverviewData();
    } catch (err) {
      showToast(err.message || 'Lỗi khi xác nhận thanh toán', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCopyText = (text, key, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`Đã sao chép ${label || 'thông tin'}!`, 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const unpaidDebts = settlementOverview.myDebts.filter(d => d.status !== 'CONFIRMED');
  const unconfirmedReceivables = settlementOverview.owedToMe.filter(c => c.status !== 'CONFIRMED');

  return (
    <div className="space-y-6 animate-fade-in text-[#18181b] dark:text-[#f4f4f5]">
      {/* 1. Page Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18181b] dark:text-white flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-[#18181b] dark:text-white shrink-0" />
            <span>{t('settlementOverview', 'Quyết toán công nợ')}</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {t('settlementSubtitle', 'Chi tiết các khoản đang nợ, đã chi, thông tin chuyển khoản ngân hàng và xác nhận thanh toán.')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            onClick={() => fetchOverviewData()}
            disabled={overviewLoading}
            className="tactile-btn-pill text-xs flex items-center gap-1.5"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${overviewLoading ? 'animate-spin' : ''}`} />
            <span>{t('refresh', 'Cập nhật')}</span>
          </button>
        </div>
      </div>

      {/* 2. Summary Bento Cards: Đang nợ, Đã chi, Cần thu hồi */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Đang nợ (You Owe) */}
        <div className="tactile-card p-5 sm:p-6 bg-[#f4f3ec] dark:bg-[#1a1a20] border border-[#e6e4dc] dark:border-[#2e2e38] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-rose-500" /> {t('youOwe', 'Đang nợ (Cần trả)')}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400">
              {unpaidDebts.length} {t('debtsUnit', 'khoản')}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#18181b] dark:text-white mt-2 tracking-tight">
            {formatVND(settlementOverview.totalDebt)}
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            {t('totalDebtDesc', 'Tổng số tiền bạn cần chuyển khoản cho các thành viên')}
          </p>
        </div>

        {/* Card 2: Đã chi (You Paid) */}
        <div className="tactile-card p-5 sm:p-6 bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] border border-zinc-900 dark:border-white shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-emerald-400 dark:text-emerald-600" /> {t('youPaid', 'Đã chi (Bạn ứng trước)')}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/10 dark:bg-black/10 text-emerald-300 dark:text-emerald-700">
              {settlementOverview.trips?.length || 0} {t('tripsUnit', 'chuyến')}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white dark:text-[#18181b] mt-2 tracking-tight">
            {formatVND(settlementOverview.totalSpent)}
          </div>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-600 mt-1">
            {t('totalSpentDesc', 'Tổng tiền túi bạn đã chi trả cho các hoạt động và chuyến đi')}
          </p>
        </div>

        {/* Card 3: Cần thu hồi (Owed to You) */}
        <div className="tactile-card p-5 sm:p-6 bg-[#f4f3ec] dark:bg-[#1a1a20] border border-[#e6e4dc] dark:border-[#2e2e38]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowDownLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> {t('owedToYou', 'Cần thu hồi (Được trả)')}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400">
              {unconfirmedReceivables.length} {t('debtorsUnit', 'người nợ')}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#18181b] dark:text-white mt-2 tracking-tight">
            {formatVND(settlementOverview.totalReceivable)}
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            {t('totalReceivableDesc', 'Số tiền các thành viên khác đang nợ và cần chuyển cho bạn')}
          </p>
        </div>
      </div>

      {/* 3. SECTION 1: CÁC KHOẢN BẠN ĐANG NỢ (CẦN CHUYỂN KHOẢN) */}
      <div className="tactile-card overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#e6e4dc] dark:border-[#2e2e38] bg-[#edebe4] dark:bg-[#1e1e24] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[#18181b] dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-rose-600" />
              {t('debtsToPay', 'Các khoản bạn đang nợ (Cần chuyển khoản)')}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {t('debtsToPayDesc', 'Danh sách người bạn đang nợ tiền ở các chuyến đi kèm thông tin tài khoản ngân hàng để chuyển khoản.')}
            </p>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-white dark:bg-[#2a2a32] border border-[#dedbd0] dark:border-[#3a3a44] text-[#18181b] dark:text-white self-start sm:self-auto">
            {settlementOverview.myDebts.length} {t('transactionsUnit', 'giao dịch')}
          </span>
        </div>

        {settlementOverview.myDebts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-[#18181b] dark:text-white text-base">{t('noDebts', 'Tuyệt vời! Bạn không nợ ai cả')}</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              {t('noDebtsDesc', 'Toàn bộ các khoản chi tiêu của bạn ở tất cả các chuyến đi đều đã được thanh toán hoặc cân bằng hoàn hảo.')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#e6e4dc]/70 dark:divide-[#2e2e38]">
            {settlementOverview.myDebts.map((debt) => {
              const recipient = debt.toUser || {};
              const isPending = debt.status === 'PENDING';
              const isPaid = debt.status === 'PAID';
              const isConfirmed = debt.status === 'CONFIRMED';
              const isProcessing = processingId === debt.id;
              const transferContent = `Spliqo ${debt.tripName || ''}`.trim();

              return (
                <div
                  key={debt.id}
                  className="p-5 sm:p-6 hover:bg-[#f4f3ec]/40 dark:hover:bg-[#1f1f26] transition-colors space-y-4"
                >
                  {/* Top Row: User info, Trip tag, Amount & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={recipient.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${debt.toUserId}`}
                        alt=""
                        className="w-11 h-11 rounded-full bg-zinc-100 object-cover border border-[#e6e4dc] dark:border-[#2e2e38]"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-[#18181b] dark:text-white text-sm sm:text-base">
                            {recipient.displayName || 'Người nhận'}
                          </h4>
                          <Link
                            to={`/trips/${debt.tripId}?tab=settlement`}
                            className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white dark:bg-[#2a2a32] border border-[#dedbd0] dark:border-[#3a3a44] text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:border-black transition-colors"
                          >
                            {debt.tripName} #{debt.tripCode}
                          </Link>
                        </div>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                          {t('debtRecipientDesc', 'Người bạn cần chuyển tiền tất toán')}
                        </span>
                      </div>
                    </div>

                    {/* Amount & Status Badge */}
                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-[11px] text-zinc-400 font-semibold block">{t('amountOwed', 'Số tiền nợ')}</span>
                        <span className="text-lg sm:text-xl font-extrabold text-rose-700 dark:text-rose-400">
                          {formatVND(debt.amount)}
                        </span>
                      </div>

                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 ${isConfirmed
                          ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400'
                          : isPaid
                            ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400'
                            : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
                          }`}
                      >
                        {isConfirmed ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            {t('confirmed', 'Đã tất toán')}
                          </>
                        ) : isPaid ? (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            {t('paidPending', 'Đã chuyển (Chờ duyệt)')}
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-rose-500" />
                            {t('unpaid', 'Chưa thanh toán')}
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Bank Details Card (Thông tin chuyển khoản) */}
                  <div className="p-4 rounded-2xl bg-[#f4f3ec] dark:bg-[#1a1a20] border border-[#e6e4dc] dark:border-[#2e2e38] grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    {/* Ngân hàng */}
                    <div className="flex items-center justify-between sm:justify-start gap-2">
                      <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 font-medium">
                        <Building className="w-3.5 h-3.5 text-zinc-400" /> {t('bank', 'Ngân hàng')}:
                      </span>
                      <span className="font-bold text-[#18181b] dark:text-white bg-white dark:bg-[#2a2a32] px-2 py-0.5 rounded-lg border border-[#e6e4dc] dark:border-[#3a3a44]">
                        {recipient.bankName || 'VCB'}
                      </span>
                    </div>

                    {/* Số tài khoản & Copy */}
                    <div className="flex items-center justify-between sm:justify-start gap-2">
                      <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 font-medium">
                        <CreditCard className="w-3.5 h-3.5 text-zinc-400" /> {t('accountNumber', 'Số TK')}:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-extrabold text-[#18181b] dark:text-white">
                          {recipient.bankAccountNumber || t('notUpdated', 'Chưa cập nhật')}
                        </span>
                        {recipient.bankAccountNumber && (
                          <button
                            onClick={() => handleCopyText(recipient.bankAccountNumber, `acc_${debt.id}`, t('accountNumber', 'Số tài khoản'))}
                            className="p-1 rounded-full hover:bg-white dark:hover:bg-[#2a2a32] text-zinc-600 dark:text-zinc-300 border border-transparent hover:border-[#dedbd0] transition-colors"
                            title={t('copy', 'Sao chép')}
                          >
                            {copiedKey === `acc_${debt.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Chủ tài khoản */}
                    <div className="flex items-center justify-between sm:justify-start gap-2">
                      <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 font-medium">
                        <User className="w-3.5 h-3.5 text-zinc-400" /> {t('accountHolder', 'Chủ TK')}:
                      </span>
                      <span className="font-bold text-[#18181b] dark:text-white uppercase">
                        {recipient.bankAccountHolder || recipient.displayName}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons: Xem VietQR & Xác nhận đã chuyển */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                      <span>{t('transferContent', 'Nội dung CK')}:</span>
                      <span className="font-mono font-bold text-[#18181b] dark:text-white bg-white dark:bg-[#2a2a32] px-2 py-0.5 rounded-lg border border-[#e6e4dc] dark:border-[#3a3a44]">
                        {transferContent}
                      </span>
                      <button
                        onClick={() => handleCopyText(transferContent, `msg_${debt.id}`, t('transferContent', 'Nội dung CK'))}
                        className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500"
                        title={t('copy', 'Sao chép')}
                      >
                        {copiedKey === `msg_${debt.id}` ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {/* Button 1: Xem VietQR Modal */}
                      <button
                        onClick={() => {
                          setSelectedSettlement(debt);
                          setVietQrModalOpen(true);
                        }}
                        className="tactile-btn-pill text-xs flex items-center gap-1.5"
                      >
                        <QrCode className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                        <span>{t('viewVietQR', 'Mở mã VietQR')}</span>
                      </button>

                      {/* Button 2: XÁC NHẬN ĐÃ CHUYỂN */}
                      {isPending && (
                        <button
                          onClick={() => handleMarkAsPaid(debt)}
                          disabled={isProcessing}
                          className="tactile-btn-dark text-xs flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{isProcessing ? t('loading', 'Đang lưu...') : t('markAsPaid', 'Xác nhận đã chuyển')}</span>
                        </button>
                      )}

                      {isPaid && (
                        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {t('transferNotified', 'Đã gửi thông báo • Đang chờ người nhận duyệt')}
                        </span>
                      )}

                      {isConfirmed && (
                        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          {t('transactionCompleted', 'Giao dịch đã hoàn tất')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. SECTION 2: CÁC KHOẢN NGƯỜI KHÁC ĐANG NỢ BẠN (CẦN THU HỒI) */}
      <div className="tactile-card overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#e6e4dc] dark:border-[#2e2e38] bg-[#edebe4] dark:bg-[#1e1e24] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[#18181b] dark:text-white flex items-center gap-2">
              <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
              {t('debtsToReceive', 'Các khoản người khác đang nợ bạn (Cần thu hồi)')}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {t('debtsToReceiveDesc', 'Các thành viên cần chuyển khoản lại cho bạn. Khi nhận được tiền, hãy bấm "Xác nhận đã nhận" để chốt sổ.')}
            </p>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-white dark:bg-[#2a2a32] border border-[#dedbd0] dark:border-[#3a3a44] text-[#18181b] dark:text-white self-start sm:self-auto">
            {settlementOverview.owedToMe.length} {t('transactionsUnit', 'giao dịch')}
          </span>
        </div>

        {settlementOverview.owedToMe.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-xs">
            {t('noReceivables', 'Hiện tại không có thành viên nào đang nợ tiền bạn.')}
          </div>
        ) : (
          <div className="divide-y divide-[#e6e4dc]/70 dark:divide-[#2e2e38]">
            {settlementOverview.owedToMe.map((credit) => {
              const debtor = credit.fromUser || {};
              const isPaid = credit.status === 'PAID';
              const isConfirmed = credit.status === 'CONFIRMED';
              const isProcessing = processingId === credit.id;

              return (
                <div
                  key={credit.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#f4f3ec]/40 dark:hover:bg-[#1f1f26] transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={debtor.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${credit.fromUserId}`}
                      alt=""
                      className="w-10 h-10 rounded-full bg-zinc-100 object-cover border border-[#e6e4dc] dark:border-[#2e2e38]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-[#18181b] dark:text-white text-sm">
                          {debtor.displayName || 'Thành viên'}
                        </h4>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-[#2a2a32] border border-[#dedbd0] dark:border-[#3a3a44] text-zinc-600 dark:text-zinc-300">
                          {credit.tripName}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {t('owesYouFromTrip', 'Nợ bạn từ chuyến đi')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-right">
                      <span className="text-[11px] text-zinc-400 font-semibold block">{t('amountToReceive', 'Cần nhận')}</span>
                      <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                        +{formatVND(credit.amount)}
                      </span>
                    </div>

                    {/* Status / Confirm Receipt Button */}
                    {isConfirmed ? (
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {t('confirmed', 'Đã tất toán')}
                      </span>
                    ) : isPaid ? (
                      <button
                        onClick={() => handleConfirmPayment(credit)}
                        disabled={isProcessing}
                        className="tactile-btn-dark text-xs flex items-center gap-1.5 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{isProcessing ? t('loading', 'Đang lưu...') : t('confirmReceipt', 'Xác nhận đã nhận tiền')}</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setNudgeSettlement(credit);
                            setNudgeModalOpen(true);
                          }}
                          className="tactile-btn-pill text-xs flex items-center gap-1.5 border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 cursor-pointer shadow-xs"
                          title="Gửi tin nhắn hoặc thông báo nhắc chuyển khoản khéo léo"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>{t('nudgeDebtor', 'Nhắc nhẹ')}</span>
                        </button>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#f4f3ec] dark:bg-[#24242b] text-zinc-500 dark:text-zinc-400 border border-[#e6e4dc] dark:border-[#32323c] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-400" /> {t('waitingForMember', 'Chờ chuyển')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. VietQR Modal */}
      {selectedSettlement && (
        <VietQRModal
          isOpen={vietQrModalOpen}
          onClose={() => {
            setVietQrModalOpen(false);
            setSelectedSettlement(null);
          }}
          settlement={selectedSettlement}
          tripName={selectedSettlement?.tripName}
          onMarkAsPaid={async (settlement) => {
            await handleMarkAsPaid(settlement);
          }}
          onConfirmPayment={async (settlement) => {
            await handleConfirmPayment(settlement);
          }}
          onPaymentSuccess={() => {
            fetchOverviewData();
          }}
        />
      )}

      {/* 6. Smart Nudge Modal */}
      {nudgeSettlement && (
        <SmartNudgeModal
          isOpen={nudgeModalOpen}
          onClose={() => {
            setNudgeModalOpen(false);
            setNudgeSettlement(null);
          }}
          settlement={nudgeSettlement}
          tripName={nudgeSettlement?.tripName}
          onNudgeSent={(updated) => {
            setSettlementOverview(prev => ({
              ...prev,
              owedToMe: prev.owedToMe.map(c => (c.id === updated.id ? { ...c, ...updated } : c))
            }));
          }}
        />
      )}
    </div>
  );
}
