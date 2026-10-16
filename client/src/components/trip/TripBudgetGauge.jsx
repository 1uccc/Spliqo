import React, { useState } from 'react';
import Modal from '../Modal';
import { 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  Settings2, 
  Calendar, 
  Users, 
  Sparkles,
  Info
} from 'lucide-react';
import { formatVND } from '../../services/calculation';

export default function TripBudgetGauge({
  trip,
  expenses = [],
  members = [],
  balances,
  onSaveBudget,
  t
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [budgetType, setBudgetType] = useState(trip?.budget?.type || 'total');
  const [budgetAmount, setBudgetAmount] = useState(trip?.budget?.amount ? String(trip.budget.amount) : '');
  const [saving, setSaving] = useState(false);

  // Budget calculations
  const hasBudget = trip?.budget && Number(trip.budget.amount) > 0;
  const rawAmount = hasBudget ? Number(trip.budget.amount) : 0;
  const currentType = trip?.budget?.type || 'total';
  const memberCount = Math.max(members.length, 1);
  const effectiveBudget = currentType === 'per_person' ? rawAmount * memberCount : rawAmount;
  const totalSpent = Number(balances?.totalExpense) || 0;

  const percentUsed = effectiveBudget > 0 ? Math.round((totalSpent / effectiveBudget) * 100) : 0;
  const remaining = effectiveBudget - totalSpent;
  const isOverBudget = remaining < 0;

  // Days analysis
  const parseDate = (dStr) => {
    if (!dStr) return new Date();
    const [y, m, d] = dStr.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };

  const startDate = parseDate(trip?.startDate);
  const endDate = parseDate(trip?.endDate);
  const diffTime = endDate.getTime() - startDate.getTime();
  const totalDays = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);

  const now = new Date();
  const startDiff = now.getTime() - startDate.getTime();
  const rawElapsed = Math.round(startDiff / (1000 * 60 * 60 * 24)) + 1;
  const elapsedDays = Math.min(totalDays, Math.max(1, rawElapsed));

  // Burn rate calculations
  const dailyTarget = effectiveBudget > 0 ? Math.round(effectiveBudget / totalDays) : 0;
  const dailySpentAvg = totalSpent > 0 ? Math.round(totalSpent / elapsedDays) : 0;
  const projectedTotal = Math.round(dailySpentAvg * totalDays);
  const burnRateExcess = projectedTotal - effectiveBudget;

  // Today's expenses
  const todayStr = new Date().toISOString().split('T')[0];
  const todayExpenses = expenses.filter(e => (e.date || '').split('T')[0] === todayStr);
  const todaySpent = todayExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const todayPercentOfDaily = dailyTarget > 0 ? Math.round((todaySpent / dailyTarget) * 100) : 0;

  // Quick preset helper
  const handleSelectPreset = (val) => {
    setBudgetAmount(String(val));
  };

  const handleOpenModal = () => {
    setBudgetType(trip?.budget?.type || 'total');
    setBudgetAmount(trip?.budget?.amount ? String(trip.budget.amount) : '');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const num = Math.round(Number(budgetAmount) || 0);
    setSaving(true);
    try {
      if (num <= 0) {
        await onSaveBudget(null);
      } else {
        await onSaveBudget({
          amount: num,
          type: budgetType
        });
      }
      setModalOpen(false);
    } catch {
      // Toast handled by parent
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveBudget = async () => {
    setSaving(true);
    try {
      await onSaveBudget(null);
      setModalOpen(false);
    } catch {
      // Handled by parent
    } finally {
      setSaving(false);
    }
  };

  // Status Theme Determination
  let statusTheme = {
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    barColor: 'from-emerald-500 to-teal-400',
    iconColor: 'text-emerald-500',
    headline: t('budgetSafe', 'Chi tiêu đang rất an toàn'),
    desc: `Đã chi ${percentUsed}% ngân sách. Còn lại ${formatVND(remaining)} cho ${totalDays - elapsedDays + 1} ngày tới.`
  };

  if (isOverBudget) {
    statusTheme = {
      badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800',
      barColor: 'from-rose-500 to-pink-600',
      iconColor: 'text-rose-500',
      headline: t('budgetExceeded', 'Báo động: Đã vượt ngân sách dự kiến!'),
      desc: `Nhóm đã vung tay quá trán thêm ${formatVND(Math.abs(remaining))}. Cần cân đối lại các khoản chi sắp tới!`
    };
  } else if (percentUsed >= 85 || (projectedTotal > effectiveBudget && percentUsed >= 60)) {
    statusTheme = {
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      barColor: 'from-amber-500 to-orange-500',
      iconColor: 'text-amber-500',
      headline: t('budgetWarning', 'Cảnh báo: Tốc độ chi tiêu đang ở mức cao'),
      desc: `Đã chạm ngưỡng ${percentUsed}% ngân sách. Dự kiến cuối chuyến đi sẽ vượt khoảng ${formatVND(burnRateExcess)}.`
    };
  } else if (percentUsed >= 60) {
    statusTheme = {
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800',
      barColor: 'from-blue-500 to-cyan-400',
      iconColor: 'text-blue-500',
      headline: t('budgetModerate', 'Đang sử dụng hơn nửa ngân sách'),
      desc: `Nhóm đã tiêu ${percentUsed}%. Hạn mức an toàn còn lại trung bình: ${formatVND(Math.max(0, Math.round(remaining / Math.max(1, totalDays - elapsedDays + 1))))}/ngày.`
    };
  }

  return (
    <>
      <div className="tactile-card p-5 sm:p-6 relative overflow-hidden transition-all">
        {/* Glow Accent in background */}
        <div 
          className="absolute -top-12 -right-12 w-44 h-44 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{
            background: isOverBudget 
              ? 'radial-gradient(circle, #f43f5e 0%, transparent 70%)' 
              : percentUsed >= 80 
              ? 'radial-gradient(circle, #f59e0b 0%, transparent 70%)'
              : 'radial-gradient(circle, #10b981 0%, transparent 70%)'
          }}
        />

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center bg-[#f4f3ec] dark:bg-[#252530] border border-[#e6e4dc] dark:border-[#32323e] ${statusTheme.iconColor}`}>
              <Target className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-[#18181b] dark:text-white">
                  {t('tripBudgetTracker', 'Hạn mức chi tiêu & Cảnh báo')}
                </h3>
                {hasBudget && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusTheme.badge}`}>
                    {percentUsed}%
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {hasBudget 
                  ? (currentType === 'per_person' 
                      ? `${formatVND(rawAmount)} / người × ${memberCount} người` 
                      : 'Hạn mức trọn gói cả chuyến đi')
                  : t('noBudgetNotice', 'Chưa thiết lập hạn mức chi tiêu dự kiến')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenModal}
            className="self-start sm:self-auto text-xs font-bold px-3 py-1.5 rounded-xl bg-white dark:bg-[#23232c] hover:bg-[#faf9f6] dark:hover:bg-[#2c2c36] text-zinc-700 dark:text-zinc-200 border border-[#e6e4dc] dark:border-[#32323e] flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5 text-zinc-500" />
            <span>{hasBudget ? t('editBudget', 'Sửa ngân sách') : t('setBudgetBtn', 'Đặt ngân sách')}</span>
          </button>
        </div>

        {/* If Budget is Set: Show Full Visual Gauge & Burn-rate */}
        {hasBudget ? (
          <div className="space-y-4 relative z-10">
            {/* Visual Progress Bar (Multi-layer segmented gauge) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#18181b] dark:text-white">
                  {formatVND(totalSpent)} <span className="text-zinc-400 font-normal">/ {formatVND(effectiveBudget)}</span>
                </span>
                <span className={isOverBudget ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-zinc-500 dark:text-zinc-400'}>
                  {isOverBudget 
                    ? `Vượt ${formatVND(Math.abs(remaining))}` 
                    : `Còn ${formatVND(remaining)}`}
                </span>
              </div>

              {/* Progress Track */}
              <div className="w-full h-3.5 bg-[#f4f3ec] dark:bg-[#1f1f28] rounded-full overflow-hidden p-0.5 border border-[#e6e4dc] dark:border-[#32323e] relative">
                {/* 70% Safe Line Indicator */}
                <div className="absolute top-0 bottom-0 left-[70%] w-0.5 bg-zinc-300 dark:bg-zinc-600 z-10 opacity-70" title="Mốc 70%" />
                {/* 100% Budget Line Indicator */}
                <div className="absolute top-0 bottom-0 left-[99%] w-0.5 bg-rose-400 dark:bg-rose-500 z-10" title="Mốc 100%" />

                <div
                  className={`h-full rounded-full bg-gradient-to-r ${statusTheme.barColor} transition-all duration-700 ease-out`}
                  style={{ width: `${Math.min(100, Math.max(percentUsed, 2))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-zinc-400 px-0.5 font-medium">
                <span>0đ</span>
                <span>An toàn (70%)</span>
                <span>Hạn mức (100%)</span>
              </div>
            </div>

            {/* Smart Advice Banner */}
            <div className={`p-3 sm:p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
              isOverBudget
                ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-200'
                : percentUsed >= 85
                ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-200'
                : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-200'
            }`}>
              {isOverBudget ? (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              ) : percentUsed >= 85 ? (
                <Flame className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <p className="font-bold">{statusTheme.headline}</p>
                <p className="text-[11px] opacity-90 leading-relaxed">{statusTheme.desc}</p>
              </div>
            </div>

            {/* Burn-rate & Daily Analytics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {/* Daily Target */}
              <div className="p-3 rounded-2xl bg-[#faf9f6] dark:bg-[#1a1a22] border border-[#e6e4dc] dark:border-[#2a2a36]">
                <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-semibold mb-1">
                  <Calendar className="w-3 h-3" />
                  <span>Định mức/ngày</span>
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-[#18181b] dark:text-white truncate">
                  {formatVND(dailyTarget)}
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  Tổng {totalDays} ngày đi
                </div>
              </div>

              {/* Daily Burn Rate */}
              <div className="p-3 rounded-2xl bg-[#faf9f6] dark:bg-[#1a1a22] border border-[#e6e4dc] dark:border-[#2a2a36]">
                <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-semibold mb-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>Thực tế tiêu/ngày</span>
                </div>
                <div className={`text-xs sm:text-sm font-extrabold truncate ${dailySpentAvg > dailyTarget ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {formatVND(dailySpentAvg)}
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  Ngày {elapsedDays}/{totalDays}
                </div>
              </div>

              {/* Today's Expense */}
              <div className="p-3 rounded-2xl bg-[#faf9f6] dark:bg-[#1a1a22] border border-[#e6e4dc] dark:border-[#2a2a36]">
                <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-semibold mb-1">
                  <Flame className="w-3 h-3 text-orange-500" />
                  <span>Đã chi hôm nay</span>
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-[#18181b] dark:text-white truncate">
                  {formatVND(todaySpent)}
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5 truncate">
                  {todayPercentOfDaily > 0 ? `${todayPercentOfDaily}% chỉ tiêu ngày` : 'Chưa có bill hôm nay'}
                </div>
              </div>

              {/* Projected Total */}
              <div className="p-3 rounded-2xl bg-[#faf9f6] dark:bg-[#1a1a22] border border-[#e6e4dc] dark:border-[#2a2a36]">
                <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-semibold mb-1">
                  <Sparkles className="w-3 h-3 text-purple-500" />
                  <span>Dự báo tổng kết</span>
                </div>
                <div className={`text-xs sm:text-sm font-extrabold truncate ${projectedTotal > effectiveBudget ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  ~{formatVND(projectedTotal)}
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5 truncate">
                  {projectedTotal > effectiveBudget ? 'Nguy cơ vượt hạn mức' : 'Nằm trong kế hoạch'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty state prompt to set budget */
          <div className="p-4 rounded-2xl bg-[#faf9f6] dark:bg-[#1a1a22] border border-dashed border-[#dedbd0] dark:border-[#2e2e38] text-center space-y-2">
            <p className="text-xs text-zinc-600 dark:text-zinc-300">
              💡 Đặt hạn mức chi tiêu để Spliqo tự động theo dõi tiến độ, cảnh báo vung tay quá trán và dự báo chi phí mỗi ngày cho nhóm!
            </p>
            <button
              type="button"
              onClick={handleOpenModal}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Thiết lập hạn mức ngay</span>
            </button>
          </div>
        )}
      </div>

      {/* MODAL SET/EDIT BUDGET */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={hasBudget ? t('editTripBudgetModal', 'Điều chỉnh hạn mức chi tiêu') : t('setTripBudgetModal', 'Thiết lập hạn mức chi tiêu')}
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center justify-between w-full">
            {hasBudget ? (
              <button
                type="button"
                onClick={handleRemoveBudget}
                disabled={saving}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold px-2 py-1 cursor-pointer"
              >
                Xóa hạn mức
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={saving}
                className="tactile-btn-pill text-xs px-4 py-2 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="tactile-btn-dark text-xs px-5 py-2 font-bold cursor-pointer"
              >
                {saving ? 'Đang lưu...' : 'Lưu hạn mức'}
              </button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Budget Type Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Cách tính hạn mức
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#f4f3ec] dark:bg-[#1a1a22] border border-[#e6e4dc] dark:border-[#2e2e38]">
              <button
                type="button"
                onClick={() => setBudgetType('total')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  budgetType === 'total'
                    ? 'bg-white dark:bg-[#2c2c36] text-[#18181b] dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-white'
                }`}
              >
                Trọn gói cả nhóm
              </button>
              <button
                type="button"
                onClick={() => setBudgetType('per_person')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  budgetType === 'per_person'
                    ? 'bg-white dark:bg-[#2c2c36] text-[#18181b] dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-white'
                }`}
              >
                Theo đầu người
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              {budgetType === 'per_person' ? 'Số tiền dự kiến mỗi người (VND)' : 'Tổng số tiền dự kiến cả chuyến (VND)'}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="any"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder={budgetType === 'per_person' ? 'Ví dụ: 3000000' : 'Ví dụ: 15000000'}
                className="w-full px-4 py-3 rounded-2xl bg-[#faf9f6] dark:bg-[#1a1a22] border border-[#e6e4dc] dark:border-[#2e2e38] text-sm font-bold text-[#18181b] dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                VNĐ
              </span>
            </div>
            {budgetAmount && Number(budgetAmount) > 0 && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                = {formatVND(budgetAmount)}
                {budgetType === 'per_person' && (
                  <span className="text-zinc-500 dark:text-zinc-400 ml-1">
                    (Cả nhóm {memberCount} người: {formatVND(Number(budgetAmount) * memberCount)})
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-zinc-500">Gợi ý nhanh:</span>
            <div className="flex flex-wrap gap-1.5">
              {(budgetType === 'per_person' 
                ? [1000000, 2000000, 3000000, 5000000, 10000000]
                : [5000000, 10000000, 15000000, 20000000, 30000000]
              ).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="px-2.5 py-1 rounded-xl bg-[#f4f3ec] dark:bg-[#252530] hover:bg-[#eae8df] dark:hover:bg-[#2e2e3c] text-[11px] font-bold text-zinc-700 dark:text-zinc-300 border border-[#e6e4dc] dark:border-[#32323e] cursor-pointer active:scale-95 transition-all"
                >
                  {formatVND(preset)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-200 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Hạn mức này chỉ dùng để nhóm cùng theo dõi và đưa ra cảnh báo khi chi tiêu quá tay, không ảnh hưởng đến thuật toán cân đối công nợ thực tế.
            </span>
          </div>
        </form>
      </Modal>
    </>
  );
}
