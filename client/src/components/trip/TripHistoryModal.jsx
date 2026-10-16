import React, { useState, useMemo } from 'react';
import Modal from '../Modal';
import { 
  History, 
  Search, 
  X, 
  Filter, 
  RotateCw, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  Users, 
  UserPlus, 
  UserMinus, 
  CreditCard, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  Receipt,
  FileText
} from 'lucide-react';
import { formatVND } from '../../services/calculation';
import { useLanguage } from '../../contexts/LanguageContext';

function formatRelativeTime(dateString, isEn = false) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return isEn ? 'Just now' : 'Vừa xong';
  if (diffMin < 60) return isEn ? `${diffMin} min ago` : `${diffMin} phút trước`;
  if (diffHours < 24) return isEn ? `${diffHours} hr ago` : `${diffHours} giờ trước`;
  if (diffDays === 1) return isEn ? 'Yesterday' : 'Hôm qua';
  if (diffDays < 7) return isEn ? `${diffDays} days ago` : `${diffDays} ngày trước`;
  return date.toLocaleDateString(isEn ? 'en-US' : 'vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function TripHistoryModal({
  isOpen,
  onClose,
  activities = [],
  loading = false,
  onRefresh,
  tripName = ''
}) {
  const { t, isEn } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL | CREATE | UPDATE | DELETE | MEMBER | SETTLEMENT

  // Metrics for quick filter tags
  const counts = useMemo(() => {
    return {
      all: activities.length,
      create: activities.filter(a => a.action === 'CREATE' || a.type === 'EXPENSE_CREATED').length,
      update: activities.filter(a => a.action === 'UPDATE' || a.type === 'EXPENSE_UPDATED').length,
      delete: activities.filter(a => a.action === 'DELETE' || a.type === 'EXPENSE_DELETED').length,
      member: activities.filter(a => a.type?.startsWith('MEMBER_')).length,
      settlement: activities.filter(a => a.type?.startsWith('SETTLEMENT_')).length,
    };
  }, [activities]);

  // Filtered and searched list
  const filteredActivities = useMemo(() => {
    return activities.filter((item) => {
      // 1. Tag filter
      if (activeFilter === 'CREATE' && item.action !== 'CREATE' && item.type !== 'EXPENSE_CREATED') return false;
      if (activeFilter === 'UPDATE' && item.action !== 'UPDATE' && item.type !== 'EXPENSE_UPDATED') return false;
      if (activeFilter === 'DELETE' && item.action !== 'DELETE' && item.type !== 'EXPENSE_DELETED') return false;
      if (activeFilter === 'MEMBER' && !item.type?.startsWith('MEMBER_')) return false;
      if (activeFilter === 'SETTLEMENT' && !item.type?.startsWith('SETTLEMENT_')) return false;

      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesTitle = item.title && item.title.toLowerCase().includes(q);
        const matchesAuthor = item.authorName && item.authorName.toLowerCase().includes(q);
        const matchesDesc = item.description && item.description.toLowerCase().includes(q);
        const matchesChanges = Array.isArray(item.changes) && item.changes.some(c => c.toLowerCase().includes(q));
        if (!matchesTitle && !matchesAuthor && !matchesDesc && !matchesChanges) return false;
      }

      return true;
    });
  }, [activities, activeFilter, searchQuery]);

  const getActivityBadge = (item) => {
    switch (item.type || item.action) {
      case 'EXPENSE_CREATED':
      case 'CREATE':
        return {
          icon: PlusCircle,
          color: 'text-emerald-600 dark:text-emerald-400',
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40',
          dot: 'bg-emerald-500',
          label: t('historyCreate', 'Thêm khoản chi')
        };
      case 'EXPENSE_UPDATED':
      case 'UPDATE':
        return {
          icon: Edit3,
          color: 'text-amber-600 dark:text-amber-400',
          bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40',
          dot: 'bg-amber-500',
          label: t('historyUpdate', 'Chỉnh sửa')
        };
      case 'EXPENSE_DELETED':
      case 'DELETE':
        return {
          icon: Trash2,
          color: 'text-rose-600 dark:text-rose-400',
          bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40',
          dot: 'bg-rose-500',
          label: t('historyDelete', 'Xóa khoản chi')
        };
      case 'MEMBER_JOINED':
        return {
          icon: UserPlus,
          color: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/40',
          dot: 'bg-blue-500',
          label: isEn ? 'New member' : 'Thành viên mới'
        };
      case 'MEMBER_REMOVED':
        return {
          icon: UserMinus,
          color: 'text-rose-600 dark:text-rose-400',
          bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40',
          dot: 'bg-rose-500',
          label: isEn ? 'Removed member' : 'Xóa thành viên'
        };
      case 'SETTLEMENT_PAID':
        return {
          icon: CreditCard,
          color: 'text-indigo-600 dark:text-indigo-400',
          bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/40',
          dot: 'bg-indigo-500',
          label: isEn ? 'Transfer sent' : 'Chuyển khoản'
        };
      case 'SETTLEMENT_CONFIRMED':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-600 dark:text-emerald-400',
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40',
          dot: 'bg-emerald-500',
          label: isEn ? 'Payment received' : 'Đã nhận tiền'
        };
      case 'TRIP_COMPLETED':
        return {
          icon: Sparkles,
          color: 'text-purple-600 dark:text-purple-400',
          bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/40',
          dot: 'bg-purple-500',
          label: isEn ? 'Trip completed' : 'Chốt sổ chuyến đi'
        };
      default:
        return {
          icon: History,
          color: 'text-zinc-600 dark:text-zinc-400',
          bg: 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800',
          dot: 'bg-zinc-400',
          label: isEn ? 'Activity' : 'Hoạt động'
        };
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-2xl"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-[#18181b] dark:text-white leading-tight">
              {t('tripEditHistoryTitle', 'Lịch sử chỉnh sửa chuyến đi')}
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
              {t('tripEditHistorySubtitle', 'Nhật ký kiểm toán minh bạch ghi lại toàn bộ thay đổi')}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            {isEn ? (
              <>Showing <strong className="text-zinc-800 dark:text-zinc-200">{filteredActivities.length}</strong> / {activities.length} records</>
            ) : (
              <>Hiển thị <strong className="text-zinc-800 dark:text-zinc-200">{filteredActivities.length}</strong> / {activities.length} bản ghi</>
            )}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="tactile-btn-pill px-5 py-2 text-xs font-bold cursor-pointer"
          >
            {t('close', 'Đóng')}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Search & Refresh Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchHistoryPlaceholder', 'Tìm theo tên khoản chi, người sửa, nội dung...')}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#edebe4]/70 dark:bg-[#202028] border border-[#dedbd0] dark:border-[#30303c] text-xs sm:text-sm text-[#18181b] dark:text-white placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-xl bg-[#edebe4]/70 dark:bg-[#202028] border border-[#dedbd0] dark:border-[#30303c] text-zinc-600 dark:text-zinc-300 hover:bg-[#e4e1d7] dark:hover:bg-[#272732] transition-colors cursor-pointer shrink-0"
              title={t('refreshHistoryTooltip', 'Làm mới lịch sử')}
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-500' : ''}`} />
            </button>
          )}
        </div>

        {/* Filter Tags */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs select-none">
          {[
            { id: 'ALL', label: t('all', 'Tất cả'), count: counts.all },
            { id: 'CREATE', label: t('historyCreate', 'Thêm chi phí'), count: counts.create },
            { id: 'UPDATE', label: t('historyUpdate', 'Chỉnh sửa'), count: counts.update },
            { id: 'DELETE', label: t('historyDelete', 'Đã xóa'), count: counts.delete },
            { id: 'MEMBER', label: t('historyMember', 'Thành viên'), count: counts.member },
            { id: 'SETTLEMENT', label: t('historySettlement', 'Quyết toán'), count: counts.settlement },
          ].map((f) => {
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={`px-3 py-1.5 rounded-full font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] shadow-xs'
                    : 'bg-[#edebe4]/60 dark:bg-[#202028] text-zinc-600 dark:text-zinc-300 hover:bg-[#e4e1d7] dark:hover:bg-[#2a2a36] border border-[#dedbd0] dark:border-[#30303c]'
                }`}
              >
                <span>{f.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  isActive
                    ? 'bg-white/20 dark:bg-black/20 text-white dark:text-black'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}>
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Timeline Content */}
        {loading && activities.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-zinc-200 dark:border-zinc-800 border-t-purple-600 rounded-full animate-spin" />
            <span className="text-xs text-zinc-400 font-medium">
              {isEn ? 'Loading edit history...' : 'Đang tải lịch sử chỉnh sửa...'}
            </span>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#edebe4]/40 dark:bg-[#1a1a22] border border-dashed border-[#dedbd0] dark:border-[#2e2e38] my-4">
            <History className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-2 stroke-[1.5]" />
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              {searchQuery 
                ? (isEn ? 'No matching activities found' : 'Không tìm thấy hoạt động nào phù hợp') 
                : t('noHistoryActivities', 'Chưa có lịch sử chỉnh sửa nào')}
            </p>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? (isEn ? 'Try changing your search keyword or click the All tab.' : 'Hãy thử thay đổi từ khóa tìm kiếm hoặc bấm nút Tất cả.')
                : t('noHistoryDesc', 'Mọi thao tác thêm chi phí, cập nhật số tiền, xóa khoản chi hoặc quyết toán sẽ được lưu lại tại đây.')}
            </p>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-5 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#dedbd0] dark:before:bg-[#2e2e38]">
            {filteredActivities.map((item) => {
              const badge = getActivityBadge(item);
              const BadgeIcon = badge.icon;
              const isDelete = item.type === 'EXPENSE_DELETED' || item.action === 'DELETE';
              const isCreate = item.type === 'EXPENSE_CREATED' || item.action === 'CREATE';
              const isUpdate = item.type === 'EXPENSE_UPDATED' || item.action === 'UPDATE';

              return (
                <div key={item.id} className="relative group">
                  {/* Timeline Node Icon */}
                  <div
                    className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center border-2 border-white dark:border-[#18181f] shadow-xs ${badge.bg} ${badge.color}`}
                    title={badge.label}
                  >
                    <BadgeIcon className="w-3.5 h-3.5" />
                  </div>

                  {/* Card Content */}
                  <div
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                      isDelete
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/40'
                        : isCreate
                        ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200/60 dark:border-emerald-900/30'
                        : 'bg-white dark:bg-[#1a1a22] border-[#dedbd0] dark:border-[#2e2e38] shadow-xs'
                    }`}
                  >
                    {/* Header Row: Author, Action Badge & Time */}
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                      <div className="flex items-center gap-2">
                        {item.authorPhotoURL ? (
                          <img
                            src={item.authorPhotoURL}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-bold text-[10px] flex items-center justify-center">
                            {(item.authorName || 'U')[0].toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs font-bold text-[#18181b] dark:text-white">
                          {item.authorName || (isEn ? 'Member' : 'Thành viên')}
                        </span>

                        {/* Action Badge */}
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${badge.bg} ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      {/* Timestamp */}
                      <span
                        className="text-[11px] text-zinc-400 font-medium flex items-center gap-1 shrink-0"
                        title={item.timestamp ? new Date(item.timestamp).toLocaleString(isEn ? 'en-US' : 'vi-VN') : ''}
                      >
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(item.timestamp, isEn)}
                      </span>
                    </div>

                    {/* Primary Title / Description */}
                    <p className={`text-xs sm:text-sm font-bold ${isDelete ? 'text-rose-950 dark:text-rose-200 line-through' : 'text-[#18181b] dark:text-zinc-100'}`}>
                      {item.title ? item.title : item.description}
                    </p>

                    {/* Secondary Description */}
                    {item.title && item.description && (
                      <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    {/* Special card for Deleted Expense */}
                    {isDelete && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-rose-100/70 dark:bg-rose-950/40 border border-rose-300/60 dark:border-rose-900/50 text-[11px] text-rose-800 dark:text-rose-300 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-bold">{isEn ? 'Expense deleted' : 'Khoản chi đã bị xóa'}</p>
                          <p className="opacity-80">
                            {isEn ? 'Amount:' : 'Số tiền:'} <strong>{formatVND(item.amount || 0)}</strong> {item.paidByName ? `• ${isEn ? 'Paid by:' : 'Người trả:'} ${item.paidByName}` : ''}
                          </p>
                        </div>
                        <span className="px-2 py-1 rounded-md bg-rose-200 dark:bg-rose-900/60 font-mono font-black text-[10px]">
                          {isEn ? 'DELETED' : 'ĐÃ XÓA'}
                        </span>
                      </div>
                    )}

                    {/* Created Expense Summary Pills */}
                    {isCreate && item.amount && (
                      <div className="mt-2 flex items-center gap-2 flex-wrap text-[11px]">
                        <span className="font-mono font-black px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                          {formatVND(item.amount)}
                        </span>
                        {item.paidByName && (
                          <span className="text-zinc-500 dark:text-zinc-400">
                            {isEn ? 'Paid by:' : 'Người trả:'} <strong>{item.paidByName}</strong>
                          </span>
                        )}
                        {item.participantCount > 0 && (
                          <span className="text-zinc-400 dark:text-zinc-500">
                            • {isEn ? `Split between ${item.participantCount} members` : `Chia cho ${item.participantCount} người`}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Diffs & Changes Detail Breakdown (for Updates) */}
                    {isUpdate && Array.isArray(item.diffs) && item.diffs.length > 0 && (
                      <div className="mt-2.5 space-y-1.5 pt-2 border-t border-[#dedbd0]/60 dark:border-[#2e2e38]">
                        <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          {isEn ? 'Change breakdown:' : 'Chi tiết các thay đổi:'}
                        </p>
                        <div className="grid grid-cols-1 gap-1.5 text-[11px]">
                          {item.diffs.map((d, dIdx) => (
                            <div
                              key={dIdx}
                              className="p-2 rounded-xl bg-[#edebe4]/50 dark:bg-[#202028] border border-[#dedbd0] dark:border-[#2e2e38] flex items-center justify-between gap-3"
                            >
                              <span className="font-bold text-zinc-700 dark:text-zinc-300 min-w-[90px]">
                                {d.label || d.field}:
                              </span>

                              <div className="flex items-center gap-1.5 text-right font-medium min-w-0">
                                <span className="text-rose-600 dark:text-rose-400 line-through truncate max-w-[120px]">
                                  {d.oldValue || '—'}
                                </span>
                                <ArrowRight className="w-3 h-3 text-zinc-400 shrink-0" />
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-[120px]">
                                  {d.newValue || '—'}
                                </span>
                                {d.diffFormatted && (
                                  <span className={`font-mono font-bold text-[10px] px-1 rounded ${d.isIncrease ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {d.diffFormatted}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fallback to simple bulleted changes if diffs not structured */}
                    {isUpdate && (!item.diffs || item.diffs.length === 0) && Array.isArray(item.changes) && item.changes.length > 0 && (
                      <div className="mt-2 space-y-1 pt-1.5 border-t border-[#dedbd0]/60 dark:border-[#2e2e38] text-[11px] text-zinc-600 dark:text-zinc-300">
                        {item.changes.map((c, cIdx) => (
                          <div key={cIdx} className="flex items-start gap-1.5">
                            <span className="text-amber-500 font-bold">•</span>
                            <span>{c}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
