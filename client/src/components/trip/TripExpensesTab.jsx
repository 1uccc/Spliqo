import React from 'react';
import { Search, Receipt, Plus } from 'lucide-react';
import { formatVND } from '../../services/calculation';
import { formatForeignAmount, getCurrencyInfo } from '../../services/currencyService';
import { useLanguage } from '../../contexts/LanguageContext';

export default function TripExpensesTab({
  expenses = [],
  filteredExpenses = [],
  searchQuery,
  setSearchQuery,
  selectedPayerFilter,
  setSelectedPayerFilter,
  sortBy,
  setSortBy,
  members = [],
  onOpenAddExpense,
  onSelectExpense,
  t
}) {
  const { isEn, displayCurrency, formatMoney } = useLanguage();
  const fmt = (val) => (displayCurrency === 'VND' ? formatVND(val) : formatMoney(val));

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search, Filter Payer, Sort */}
      <div className="tactile-card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-600 dark:text-zinc-400 absolute left-3.5 top-3" aria-hidden="true" />
          <input
            type="text"
            aria-label={t('searchExpensePlaceholder', 'Tìm khoản chi, ghi chú...')}
            placeholder={t('searchExpensePlaceholder', 'Tìm khoản chi, ghi chú...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-full bg-[#f4f3ec] dark:bg-[#1a1a22] border border-[#e6e4dc] dark:border-[#2e2e38] text-xs text-[#18181b] dark:text-white focus:border-zinc-900 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-[#20202c] transition-colors placeholder:text-zinc-600 dark:placeholder:text-zinc-400"
          />
        </div>

        {/* Filter by Payer & Sort */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
          <select
            aria-label={t('allPayers', 'Tất cả người trả')}
            value={selectedPayerFilter}
            onChange={(e) => setSelectedPayerFilter(e.target.value)}
            className="w-full min-w-0 truncate px-3 py-2 rounded-full bg-[#f4f3ec] dark:bg-[#1a1a22] border border-[#e6e4dc] dark:border-[#2e2e38] text-xs text-zinc-800 dark:text-zinc-200 focus:border-zinc-900 dark:focus:border-emerald-400"
          >
            <option value="">{t('allPayers', 'Tất cả người trả')}</option>
            {members.map((m) => {
              const memberId = m.userId || m.uid || m.id;
              return (
                <option key={memberId} value={memberId}>
                  {m.displayName}
                </option>
              );
            })}
          </select>

          {/* Sort */}
          <select
            aria-label={isEn ? 'Sort expenses' : 'Sắp xếp khoản chi'}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full min-w-0 truncate px-3 py-2 rounded-full bg-[#f4f3ec] dark:bg-[#1a1a22] border border-[#e6e4dc] dark:border-[#2e2e38] text-xs text-zinc-800 dark:text-zinc-200 focus:border-zinc-900 dark:focus:border-emerald-400"
          >
            <option value="date">{t('sortNewest', 'Mới nhất')}</option>
            <option value="amount">{t('sortHighestAmount', 'Số tiền lớn nhất')}</option>
          </select>
        </div>
      </div>

      {/* Expenses List */}
      {filteredExpenses.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#1a1a22] border border-[#e6e4dc] dark:border-[#2e2e38] shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#f4f3ec] dark:bg-[#22222a] text-zinc-600 dark:text-zinc-400 mx-auto flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-[#18181b] dark:text-white text-base">
            {t('noExpensesTitle', 'Chưa có khoản chi nào')}
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto">
            {expenses.length === 0
              ? t('noExpensesDesc', 'Hãy thêm khoản chi đầu tiên để bắt đầu theo dõi chi phí chuyến đi!')
              : t('noFilteredExpensesDesc', 'Không tìm thấy khoản chi phù hợp với điều kiện lọc.')}
          </p>
          <button
            type="button"
            onClick={onOpenAddExpense}
            className="tactile-btn-dark mt-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> {t('addExpenseNew', 'Thêm khoản chi mới')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredExpenses.map((expense) => {
            const payer = members.find((m) => (m.userId || m.uid || m.id) === expense.paidBy);
            const participantCount = expense.participants?.length || 0;

            return (
              <button
                key={expense.id}
                type="button"
                onClick={() => onSelectExpense(expense)}
                className="w-full text-left group tactile-card p-3.5 sm:p-5 cursor-pointer flex items-center justify-between gap-3 sm:gap-4"
              >
                <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                  {/* Bill thumbnail or default icon */}
                  {expense.billImageUrl ? (
                    <img
                      src={expense.billImageUrl}
                      alt={expense.title}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl object-cover border border-[#e6e4dc] dark:border-[#2e2e38] shrink-0 shadow-xs"
                    />
                  ) : (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#f4f3ec] dark:bg-[#212129] text-zinc-700 dark:text-zinc-200 border border-[#e6e4dc] dark:border-[#32323e] flex items-center justify-center shrink-0">
                      <Receipt className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-[#18181b] dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate text-sm sm:text-base">
                        {expense.title}
                      </h4>
                      {expense.splitType === 'custom' && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                          {t('customSplitBadge', 'Chia tùy chỉnh')}
                        </span>
                      )}
                      {expense.currency && expense.currency !== 'VND' && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800 flex items-center gap-1">
                          <span>{getCurrencyInfo(expense.currency).flag}</span>
                          <span>{expense.currency}</span>
                        </span>
                      )}
                      {expense.isOfflinePending && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 flex items-center gap-1 border border-amber-300 dark:border-amber-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          {t('pendingOfflineSync', 'Chờ đồng bộ')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400 mt-1 flex-wrap">
                      <span>
                        {t('paidByLabel', 'Người trả')}:{' '}
                        <strong className="text-zinc-900 dark:text-zinc-200">
                          {payer?.displayName || t('member', 'Thành viên')}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>{participantCount} {t('participantsCount', 'người tham gia')}</span>
                      <span>•</span>
                      <span>{expense.date}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {expense.currency && expense.currency !== 'VND' ? (
                    <div>
                      <div className="text-base sm:text-lg font-extrabold font-mono text-[#18181b] dark:text-white">
                        {formatForeignAmount(expense.originalAmount || expense.amount, expense.currency)}
                      </div>
                      <div className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400">
                        {displayCurrency === 'VND' ? `≈ ${formatVND(expense.amount)}` : fmt(expense.amount)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-base sm:text-lg font-extrabold font-mono text-[#18181b] dark:text-white">
                      {fmt(expense.amount)}
                    </div>
                  )}
                  <span className="text-xs text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors font-medium">
                    {t('viewDetailArrow', 'Xem chi tiết →')}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
