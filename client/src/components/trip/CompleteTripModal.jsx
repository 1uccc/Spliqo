import React from 'react';
import Modal from '../Modal';
import { AlertCircle, ArrowRight, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { formatVND } from '../../services/calculation';

export default function CompleteTripModal({
  isOpen,
  onClose,
  isAllSettled,
  confirmedSettlements = 0,
  totalSettlements = 0,
  settlementProgress = 0,
  unsettledDebts = [],
  balances,
  members = [],
  completingTrip = false,
  onConfirmCompleteTrip,
  onGoToSettlementTab,
  t
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('completeTripModalTitle', 'Chốt sổ chuyến đi')}
      maxWidth="max-w-xl"
      footer={
        !isAllSettled ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 w-full">
            <button
              type="button"
              onClick={onClose}
              className="tactile-btn-pill text-xs order-2 sm:order-1 cursor-pointer px-4 py-2"
            >
              {t('close', 'Đóng')}
            </button>

            <button
              type="button"
              onClick={onGoToSettlementTab}
              className="tactile-btn-dark text-xs flex items-center justify-center gap-1.5 order-1 sm:order-2 cursor-pointer px-4 py-2"
            >
              <span>{t('viewSettlementTabBtn', 'Đến mục Quyết toán để xử lý')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={onClose}
              disabled={completingTrip}
              className="tactile-btn-pill text-xs cursor-pointer px-4 py-2"
            >
              {t('cancel', 'Hủy bỏ')}
            </button>

            <button
              type="button"
              onClick={onConfirmCompleteTrip}
              disabled={completingTrip}
              className="tactile-btn-dark text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/15 cursor-pointer px-5 py-2 font-bold"
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
        )
      }
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
              * {t('archivedTripNotice', 'Sau khi chốt sổ, chuyến đi sẽ được lưu trữ với trạng thái "Đã chốt sổ", không phát sinh thêm chi phí mới.')}
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}
