import React from 'react';
import { Sparkles, CheckCircle2, Clock, AlertCircle, QrCode, Check } from 'lucide-react';
import { formatVND } from '../../services/calculation';

export default function TripSettlementsTab({
  trip,
  balances,
  members = [],
  settlements = [],
  currentUser,
  isCreator,
  unsettledDebts = [],
  confirmedSettlements = 0,
  totalSettlements = 0,
  settlementProgress = 0,
  isAllSettled = false,
  onOpenCompleteModal,
  onOpenVietQR,
  onOpenSmartNudge,
  onMarkAsPaid,
  onConfirmPayment,
  t
}) {
  return (
    <div className="space-y-6">
      {/* Settlement Summary Header */}
      <div className="tactile-card p-6 sm:p-8 space-y-4 bg-[#18181b] text-white">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" /> {t('settlementReportTitle', 'Báo cáo tất toán chi phí')}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
            <span className="text-xs text-zinc-400 font-medium">{t('totalTripCost', 'Tổng tiền chuyến đi')}</span>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">
              {formatVND(balances?.totalExpense || 0)}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
            <span className="text-xs text-zinc-400 font-medium">{t('membersCount', 'Số thành viên')}</span>
            <div className="text-2xl font-extrabold text-white mt-1">
              {members.length} {t('peopleUnit', 'người')}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
            <span className="text-xs text-zinc-400 font-medium">{t('requiredTransfers', 'Giao dịch cần thực hiện')}</span>
            <div className="text-2xl font-extrabold text-teal-300 mt-1">
              {settlements.length} {t('transfersUnit', 'chuyển khoản')}
            </div>
          </div>
        </div>
      </div>

      {/* Settlement Progress & Completion Condition Banner */}
      {trip?.status === 'COMPLETED' ? (
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
                    onClick={onOpenCompleteModal}
                    className="tactile-btn-dark text-xs flex items-center gap-1.5 self-start sm:self-auto shadow-sm cursor-pointer"
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
              {t('whoPaysWhom', 'Ai cần trả cho ai?')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {t('optimizedGreedyDesc', 'Thuật toán tối ưu hóa đã rút gọn số lượng giao dịch tối thiểu để giải phóng toàn bộ công nợ.')}
            </p>
          </div>
        </div>

        {settlements.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 dark:text-zinc-500 text-xs">
            {t('noDebtsAllBalanced', 'Không có khoản nợ nào cần giải quyết. Tất cả đã cân bằng!')}
          </div>
        ) : (
          <div className="divide-y divide-[#e6e4dc]/70 dark:divide-[#272732]">
            {settlements.map((s) => {
              const currentUid = String(currentUser?.uid || currentUser?.id || currentUser?.userId || '');
              const fromUid = String(s.fromUserId || s.fromUser?.id || s.fromUser?.uid || s.fromUser?.userId || '');
              const toUid = String(s.toUserId || s.toUser?.id || s.toUser?.uid || s.toUser?.userId || '');

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
                        <span className="text-[11px] text-rose-700 dark:text-rose-400 font-semibold">
                          {t('debtorRole', 'Người nợ tiền')}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex flex-col items-center px-2">
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-3.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                        {t('transferAmount', 'chuyển')} {formatVND(s.amount)} →
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
                            {t('receiverRole', 'Người nhận tiền')}
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
                            {t('noBankAccountYet', 'Chưa cập nhật tài khoản ngân hàng')}
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
                          {t('settled', 'Đã tất toán')}
                        </>
                      ) : s.status === 'PAID' ? (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          {t('paidPendingConfirmation', 'Đã chuyển (Chờ duyệt)')}
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-rose-500" />
                          {t('unpaid', 'Chưa thanh toán')}
                        </>
                      )}
                    </span>

                    {/* Button 0: Nhắc nhẹ - Hiển thị cho người nhận tiền hoặc trưởng nhóm khi chưa thanh toán */}
                    {(isReceiver || isCreator) && s.status !== 'CONFIRMED' && s.status !== 'PAID' && onOpenSmartNudge && (
                      <button
                        onClick={() => onOpenSmartNudge(s)}
                        className="tactile-btn-pill text-xs border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 flex items-center gap-1.5 cursor-pointer shadow-xs"
                        title="Gửi tin nhắn hoặc thông báo nhắc chuyển khoản khéo léo"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>{t('nudgeDebtor', 'Nhắc nhẹ')}</span>
                      </button>
                    )}

                    {/* Button 1: QR Modal (Mọi thành viên đều có thể mở xem) */}
                    <button
                      onClick={() => onOpenVietQR(s)}
                      className="tactile-btn-pill text-xs border border-[#e6e4dc] dark:border-[#2e2e38] flex items-center gap-1.5 cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                      <span>{t('viewVietQR', 'Mở mã VietQR')}</span>
                    </button>

                    {/* Button 2: XÁC NHẬN ĐÃ CHUYỂN - Chỉ người nợ tiền (s.fromUserId) mới thấy */}
                    {isPayer && s.status !== 'CONFIRMED' && s.status !== 'PAID' && (
                      <button
                        onClick={() => onMarkAsPaid(s)}
                        className="tactile-btn-dark text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{t('markAsPaid', 'Xác nhận đã chuyển')}</span>
                      </button>
                    )}

                    {/* Button 3: XÁC NHẬN ĐÃ NHẬN TIỀN - Chỉ người nhận tiền (s.toUserId) mới thấy khi người nợ đã bấm chuyển */}
                    {isReceiver && s.status === 'PAID' && (
                      <button
                        onClick={() => onConfirmPayment(s)}
                        className="tactile-btn-dark text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
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
  );
}
