import React from 'react';
import Modal from '../Modal';
import { 
  History, 
  ShieldCheck, 
  Sparkles, 
  Edit3, 
  Clock, 
  Trash2, 
  Receipt, 
  User, 
  FileText, 
  Users, 
  Tag, 
  DollarSign, 
  Calendar, 
  MessageSquare, 
  Camera,
  Globe
} from 'lucide-react';
import { formatVND } from '../../services/calculation';
import { formatForeignAmount, getCurrencyInfo } from '../../services/currencyService';

export default function ExpenseDetailModal({
  isOpen,
  onClose,
  selectedExpense,
  members = [],
  onDeleteExpense,
  onOpenEditExpense,
  t
}) {
  if (!selectedExpense) return null;

  const isForeign = selectedExpense.currency && selectedExpense.currency !== 'VND';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('expenseDetailAndHistory', 'Chi tiết khoản chi & Lịch sử chỉnh sửa')}
      maxWidth="max-w-xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={() => onDeleteExpense(selectedExpense.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> {t('deleteExpense', 'Xóa khoản chi')}
          </button>

          <button
            type="button"
            onClick={() => onOpenEditExpense(selectedExpense)}
            className="tactile-btn-dark text-xs font-bold px-4 py-2 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5" /> {t('edit', 'Chỉnh sửa')}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="text-center p-4 rounded-2xl bg-[#edebe4]/70 dark:bg-[#1a1a22] border border-[#dedbd0] dark:border-[#2e2e38]">
          <h3 className="text-lg font-bold text-[#18181b] dark:text-white">{selectedExpense.title}</h3>
          
          {isForeign ? (
            <div className="mt-1">
              <div className="text-2xl font-extrabold font-mono text-[#18181b] dark:text-white">
                {formatForeignAmount(selectedExpense.originalAmount || selectedExpense.amount, selectedExpense.currency)}
              </div>
              <div className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                ≈ {formatVND(selectedExpense.amount)} ({t('exchangeRateLabel', 'Tỷ giá:')} 1 {selectedExpense.currency} = {new Intl.NumberFormat('vi-VN').format(selectedExpense.exchangeRate || 1)}đ)
              </div>
            </div>
          ) : (
            <div className="text-2xl font-extrabold font-mono text-[#18181b] dark:text-white mt-1">
              {formatVND(selectedExpense.amount)}
            </div>
          )}

          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
            {t('date', 'Ngày')}: {selectedExpense.date}
          </p>
        </div>

        {selectedExpense.billImageUrl && (
          <div className="rounded-2xl overflow-hidden border border-[#dedbd0] dark:border-[#2e2e38] shadow-xs">
            <img
              src={selectedExpense.billImageUrl}
              alt={selectedExpense.title || 'Bill'}
              className="w-full max-h-56 object-contain bg-white dark:bg-black/20"
            />
          </div>
        )}

        <div className="space-y-2 text-xs">
          {isForeign && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-amber-900 dark:text-amber-200 font-medium flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                {t('currencyAndRateLabel', 'Tiền tệ & Tỷ giá:')}
              </span>
              <span className="font-bold font-mono text-amber-950 dark:text-amber-100">
                {getCurrencyInfo(selectedExpense.currency).flag} {selectedExpense.currency} (1 {selectedExpense.currency} = {new Intl.NumberFormat('vi-VN').format(selectedExpense.exchangeRate || 1)} VNĐ)
              </span>
            </div>
          )}

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#edebe4]/50 dark:bg-[#212129] border border-[#dedbd0] dark:border-[#2e2e38]">
            <span className="text-zinc-600 dark:text-zinc-400 font-medium">
              {t('paidByLabel', 'Người thanh toán')}:
            </span>
            <span className="font-bold text-[#18181b] dark:text-white">
              {members.find((m) => (m.userId || m.uid || m.id) === selectedExpense.paidBy)?.displayName || t('member', 'Thành viên')}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#edebe4]/50 dark:bg-[#212129] border border-[#dedbd0] dark:border-[#2e2e38]">
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">
              {t('splitMethodLabel', 'Phương thức chia')}:
            </span>
            <span className="font-bold text-[#18181b] dark:text-white">
              {selectedExpense.splitType === 'custom' ? t('customSplit', 'Chia riêng theo từng người') : t('equalSplit', 'Chia đều')}
            </span>
          </div>

          {selectedExpense.note && (
            <div className="p-2.5 rounded-xl bg-[#edebe4]/50 dark:bg-[#212129] border border-[#dedbd0] dark:border-[#2e2e38] text-zinc-600 dark:text-zinc-300">
              <span className="font-bold text-[#18181b] dark:text-white block mb-0.5">{t('note', 'Ghi chú')}:</span>
              {selectedExpense.note}
            </div>
          )}
        </div>

        {/* Participants share list */}
        <div>
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5">
            {t('participantsList', 'Danh sách người chịu chi phí')} ({selectedExpense.participants?.length || 0})
          </span>
          <div className="space-y-1.5">
            {selectedExpense.participants?.map((pId) => {
              const m = members.find((u) => (u.userId || u.uid || u.id) === pId);
              const shareAmount =
                selectedExpense.splitType === 'custom'
                  ? selectedExpense.individualAmounts?.[pId] || 0
                  : Math.floor(selectedExpense.amount / (selectedExpense.participants?.length || 1));

              return (
                <div key={pId} className="flex items-center justify-between text-xs py-1.5 border-b border-[#dedbd0]/70 dark:border-[#2e2e38]">
                  <span className="text-zinc-700 dark:text-zinc-300">{m?.displayName}</span>
                  <span className="font-mono font-bold text-[#18181b] dark:text-white">{formatVND(shareAmount)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Audit History Timeline */}
        <div className="pt-4 border-t border-[#dedbd0] dark:border-[#2e2e38] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <History className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <span>{t('auditHistoryTitle', 'Lịch sử chỉnh sửa & Nhật ký kiểm toán')}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 font-semibold font-mono">
                    {Array.isArray(selectedExpense.history) ? selectedExpense.history.length : 1} {t('recordsUnit', 'bản ghi')}
                  </span>
                </h4>
              </div>
            </div>
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> {t('transparencyBadge', 'Minh bạch tài chính 100%')}
            </span>
          </div>

          {/* Timeline Container */}
          <div className="relative pl-6 space-y-4 max-h-80 overflow-y-auto pr-1.5 before:absolute before:top-3 before:bottom-3 before:left-2.5 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
            {(Array.isArray(selectedExpense.history) && selectedExpense.history.length > 0
              ? selectedExpense.history
              : [
                  {
                    id: `hist_init_${selectedExpense.id}`,
                    action: 'CREATE',
                    authorName: members.find(m => m.userId === selectedExpense.createdBy)?.displayName || t('member', 'Thành viên'),
                    timestamp: selectedExpense.createdAt || selectedExpense.date,
                    description: t('initialExpenseNote', 'Khởi tạo khoản chi ban đầu: {amount}').replace('{amount}', formatVND(selectedExpense.amount)),
                    snapshot: {
                      title: selectedExpense.title,
                      amountFormatted: formatVND(selectedExpense.amount),
                      paidBy: members.find(m => m.userId === selectedExpense.paidBy)?.displayName || t('member', 'Thành viên'),
                      splitType: selectedExpense.splitType === 'custom' ? t('customSplitBadge', 'Chia tùy chỉnh') : t('equalSplit', 'Chia đều'),
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
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={authorPhoto}
                          alt=""
                          className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 object-cover ring-1 ring-white/50 shrink-0"
                        />
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-bold text-zinc-900 dark:text-white truncate">
                            {item.authorName || t('member', 'Thành viên')}
                          </span>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${
                              isCreate
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40'
                            }`}
                          >
                            {isCreate ? t('initialCreation', '★ Khởi tạo ban đầu') : `${t('editRevision', 'Lần sửa')} #${revNum}`}
                          </span>
                        </div>
                      </div>

                      <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                        {item.timestamp ? new Date(item.timestamp).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                      </span>
                    </div>

                    {item.description && !isCreate && (
                      <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 italic pl-1 border-l-2 border-amber-400/60 dark:border-amber-500/40 py-0.5">
                        "{item.description}"
                      </p>
                    )}

                    {Array.isArray(item.diffs) && item.diffs.length > 0 ? (
                      <div className="space-y-1.5 pt-1">
                        {item.diffs.map((diff, dIdx) => (
                          <div
                            key={dIdx}
                            className="p-2.5 rounded-xl bg-white/80 dark:bg-[#18181f] border border-[#e6e4dc] dark:border-[#2e2e38] text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                {diff.field === 'amount' && <Receipt className="w-3.5 h-3.5 text-emerald-600" />}
                                {diff.field === 'paidBy' && <User className="w-3.5 h-3.5 text-teal-600" />}
                                {diff.field === 'title' && <FileText className="w-3.5 h-3.5 text-blue-600" />}
                                {diff.field === 'participants' && <Users className="w-3.5 h-3.5 text-emerald-600" />}
                                {diff.field === 'splitType' && <Tag className="w-3.5 h-3.5 text-amber-600" />}
                                {diff.field === 'customShares' && <DollarSign className="w-3.5 h-3.5 text-sky-600" />}
                                {diff.field === 'date' && <Calendar className="w-3.5 h-3.5 text-rose-600" />}
                                {diff.field === 'note' && <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />}
                                {diff.field === 'billImageUrl' && <Camera className="w-3.5 h-3.5 text-sky-600" />}
                                <span>{diff.label}:</span>
                              </span>

                              {diff.field === 'amount' && diff.diffFormatted && (
                                <span
                                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                    diff.isIncrease
                                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  }`}
                                >
                                  {diff.isIncrease
                                    ? t('increasedBy', 'Tăng {amount}').replace('{amount}', diff.diffFormatted)
                                    : t('decreasedBy', 'Giảm {amount}').replace('{amount}', diff.diffFormatted)}
                                </span>
                              )}
                            </div>

                            {diff.field === 'participants' ? (
                              <div className="space-y-0.5 pl-5 pt-0.5">
                                <div className="text-zinc-700 dark:text-zinc-300">
                                  {t('scalePrefix', 'Quy mô:')}{' '}
                                  <span className="line-through text-zinc-600 dark:text-zinc-400">
                                    {diff.oldCount} {t('peopleUnit', 'người')}
                                  </span>{' '}
                                  → <strong className="text-zinc-900 dark:text-white">{diff.newCount} {t('peopleUnit', 'người')}</strong>
                                </div>
                                {diff.added && diff.added.length > 0 && (
                                  <div className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                    <span>{t('addedPrefix', '+ Thêm:')}</span>
                                    <span>{diff.added.join(', ')}</span>
                                  </div>
                                )}
                                {diff.removed && diff.removed.length > 0 && (
                                  <div className="text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-1">
                                    <span>{t('removedPrefix', '- Bỏ bớt:')}</span>
                                    <span>{diff.removed.join(', ')}</span>
                                  </div>
                                )}
                              </div>
                            ) : diff.field === 'customShares' ? (
                              <div className="space-y-1.5 pl-5 pt-1">
                                <div className="grid grid-cols-1 gap-1.5">
                                  {diff.shareChanges?.map((sc, scIdx) => (
                                    <div key={scIdx} className="p-2 rounded-lg bg-zinc-50 dark:bg-[#252530] border border-zinc-200/70 dark:border-zinc-700/60 flex items-center justify-between text-xs">
                                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">{sc.name}</span>
                                      <div className="flex items-center gap-1.5 font-mono">
                                        <span className="line-through text-zinc-600 dark:text-zinc-400">{sc.oldShare}</span>
                                        <span className="text-zinc-600 dark:text-zinc-400">→</span>
                                        <span className="font-bold text-zinc-900 dark:text-white">{sc.newShare}</span>
                                        <span className={`text-[11px] px-1.5 py-0.5 rounded font-semibold ${sc.isIncrease ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'}`}>
                                          {sc.diffFormatted}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : diff.field === 'billImageUrl' ? (
                              <div className="pl-5 text-emerald-800 dark:text-emerald-300 font-semibold">
                                {diff.action}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 pl-5 flex-wrap">
                                <span className="line-through text-zinc-600 dark:text-zinc-400 font-mono">
                                  {diff.oldValue || t('emptyParens', '(Trống)')}
                                </span>
                                <span className="text-zinc-600 dark:text-zinc-400">→</span>
                                <span className="font-bold text-zinc-900 dark:text-white font-mono bg-zinc-100 dark:bg-[#252530] px-2 py-0.5 rounded-md">
                                  {diff.newValue || t('emptyParens', '(Trống)')}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : isCreate && (item.snapshot || item.details) ? (
                      <div className="space-y-1.5 pt-1">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                          <div className="p-2 rounded-xl bg-white/80 dark:bg-[#18181f] border border-[#e6e4dc] dark:border-[#2e2e38]">
                            <span className="text-zinc-600 dark:text-zinc-400 text-[11px] block">{t('expenseAmountLabel', 'Số tiền chi')}</span>
                            <strong className="text-emerald-700 dark:text-emerald-400 font-mono text-xs">
                              {item.snapshot?.amountFormatted || (item.details?.find(d => d.field === 'amount')?.value) || formatVND(selectedExpense.amount)}
                            </strong>
                          </div>
                          <div className="p-2 rounded-xl bg-white/80 dark:bg-[#18181f] border border-[#e6e4dc] dark:border-[#2e2e38]">
                            <span className="text-zinc-600 dark:text-zinc-400 text-[11px] block">{t('payerLabelShort', 'Người trả tiền')}</span>
                            <strong className="text-zinc-900 dark:text-white truncate block">
                              {item.snapshot?.paidBy || (item.details?.find(d => d.field === 'paidBy')?.value) || t('member', 'Thành viên')}
                            </strong>
                          </div>
                          <div className="p-2 rounded-xl bg-white/80 dark:bg-[#18181f] border border-[#e6e4dc] dark:border-[#2e2e38]">
                            <span className="text-zinc-600 dark:text-zinc-400 text-[11px] block">{t('splitMethodShort', 'Cách chia')}</span>
                            <strong className="text-zinc-900 dark:text-white truncate block">
                              {item.snapshot?.splitType || (item.details?.find(d => d.field === 'splitType')?.value) || t('equalSplit', 'Chia đều')}
                            </strong>
                          </div>
                          <div className="p-2 rounded-xl bg-white/80 dark:bg-[#18181f] border border-[#e6e4dc] dark:border-[#2e2e38]">
                            <span className="text-zinc-600 dark:text-zinc-400 text-[11px] block">{t('participantsShort', 'Người tham gia')}</span>
                            <strong className="text-zinc-900 dark:text-white truncate block">
                              {item.snapshot?.participantCount || selectedExpense.participants?.length || 0} {t('peopleUnit', 'người')}
                            </strong>
                          </div>
                          <div className="p-2 rounded-xl bg-white/80 dark:bg-[#18181f] border border-[#e6e4dc] dark:border-[#2e2e38]">
                            <span className="text-zinc-600 dark:text-zinc-400 text-[11px] block">{t('recordedDateShort', 'Ngày ghi nhận')}</span>
                            <strong className="text-zinc-900 dark:text-white font-mono block">
                              {item.snapshot?.date || selectedExpense.date}
                            </strong>
                          </div>
                          <div className="p-2 rounded-xl bg-white/80 dark:bg-[#18181f] border border-[#e6e4dc] dark:border-[#2e2e38]">
                            <span className="text-zinc-600 dark:text-zinc-400 text-[11px] block">{t('billReceiptLabel', 'Hóa đơn')}</span>
                            <strong className="text-zinc-900 dark:text-white truncate block">
                              {item.snapshot?.hasBill || selectedExpense.billImageUrl ? t('hasBillText', 'Đã đính kèm bill') : t('noBillText', 'Không có bill')}
                            </strong>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 pt-1">
                        {item.changes && item.changes.length > 0 ? (
                          <ul className="text-xs text-zinc-700 dark:text-zinc-300 space-y-1 pl-4 list-disc">
                            {item.changes.map((c, cIdx) => (
                              <li key={cIdx}>{c}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 pl-2">{item.description}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
