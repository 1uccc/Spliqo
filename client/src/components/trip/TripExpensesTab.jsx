import React from 'react';
import { Search, Receipt, Plus } from 'lucide-react';
import { formatVND } from '../../services/calculation';
import { formatForeignAmount, getCurrencyInfo } from '../../services/currencyService';

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
  return (
    <div className="space-y-4">
      {/* Controls Bar: Search, Filter Payer, Sort */}
      <div className="tactile-card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder={t('searchExpensePlaceholder', 'Tìm khoản chi, ghi chú...')}
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
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-full bg-[#f4f3ec] dark:bg-[#1a1a22] border border-[#e6e4dc] dark:border-[#2e2e38] text-xs outline-none text-zinc-700 dark:text-zinc-200"
          >
            <option value="date">{t('sortNewest', 'Mới nhất')}</option>
            <option value="amount">{t('sortHighestAmount', 'Số tiền lớn nhất')}</option>
          </select>
        </div>
      </div>

      {/* Expenses List */}
      {filteredExpenses.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#1a1a22] border border-[#e6e4dc] dark:border-[#2e2e38] shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#f4f3ec] dark:bg-[#22222a] text-zinc-500 dark:text-zinc-400 mx-auto flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-[#18181b] dark:text-white text-base">
            {t('noExpensesTitle', 'Chưa có khoản chi nào')}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            {expenses.length === 0
              ? t('noExpensesDesc', 'Hãy thêm khoản chi đầu tiên để bắt đầu theo dõi chi phí chuyến đi!')
              : t('noFilteredExpensesDesc', 'Không tìm thấy khoản chi phù hợp với điều kiện lọc.')}
          </p>
          <button
            onClick={onOpenAddExpense}
            className="tactile-btn-dark mt-2"
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
              <div
                key={expense.id}
                onClick={() => onSelectExpense(expense)}
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
                          {t('customSplitBadge', 'Chia tùy chỉnh')}
                        </span>
                      )}
                      {expense.currency && expense.currency !== 'VND' && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 flex items-center gap-1">
                          <span>{getCurrencyInfo(expense.currency).flag}</span>
                          <span>{expense.currency}</span>
                        </span>
                      )}
                      {expense.isOfflinePending && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center gap-1 border border-amber-300 dark:border-amber-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Chờ đồng bộ 📶
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex-wrap">
                      <span>
                        {t('paidByLabel', 'Người trả')}:{' '}
                        <strong className="text-zinc-800 dark:text-zinc-200">
                          {payer?.displayName || 'Thành viên'}
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
                      <div className="text-base sm:text-lg font-extrabold text-[#18181b] dark:text-white">
                        {formatForeignAmount(expense.originalAmount || expense.amount, expense.currency)}
                      </div>
                      <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        ≈ {formatVND(expense.amount)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-base sm:text-lg font-extrabold text-[#18181b] dark:text-white">
                      {formatVND(expense.amount)}
                    </div>
                  )}
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-zinc-200 transition-colors font-medium">
                    {t('viewDetailArrow', 'Xem chi tiết →')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
