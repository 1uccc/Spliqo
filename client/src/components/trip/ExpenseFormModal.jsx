import React from 'react';
import Modal from '../Modal';
import { Camera, Globe, ArrowRightLeft } from 'lucide-react';
import { formatVND, formatVNDInput, parseVNDInput } from '../../services/calculation';
import { SUPPORTED_CURRENCIES, getCurrencyInfo } from '../../services/currencyService';

export default function ExpenseFormModal({
  isOpen,
  onClose,
  editingExpense,
  members = [],
  currentUser,
  expTitle,
  setExpTitle,
  expAmount,
  setExpAmount,
  expCurrency = 'VND',
  setExpCurrency,
  expOriginalAmount,
  setExpOriginalAmount,
  expExchangeRate,
  setExpExchangeRate,
  expPaidBy,
  setExpPaidBy,
  expParticipants = [],
  expSplitType,
  setExpSplitType,
  expIndividualAmounts = {},
  setExpIndividualAmounts,
  expBillImageUrl,
  expDate,
  setExpDate,
  expNote,
  setExpNote,
  liveShares,
  submitting,
  onSaveExpense,
  onOpenCamera,
  onSelectAllParticipants,
  onClearAllParticipants,
  onToggleParticipant,
  t
}) {
  const handleCustomAmountChange = (changedUserId, inputValue) => {
    const totalAmount = Math.round(Number(expAmount) || 0);
    const digitsOnly = String(inputValue).replace(/\D/g, '');
    const enteredAmount = digitsOnly === '' ? 0 : Number(digitsOnly);

    const changedIndex = expParticipants.indexOf(changedUserId);
    if (changedIndex === -1) return;

    const nextAmounts = { ...expIndividualAmounts };
    nextAmounts[changedUserId] = digitsOnly === '' ? '' : enteredAmount;

    const subsequentParticipants = expParticipants.slice(changedIndex + 1);

    if (subsequentParticipants.length > 0) {
      // Sum of participants up to changedIndex
      const sumPrior = expParticipants.slice(0, changedIndex).reduce((sum, pid) => {
        return sum + (Number(nextAmounts[pid]) || 0);
      }, 0);
      const sumAllocated = sumPrior + enteredAmount;
      const remaining = Math.max(0, totalAmount - sumAllocated);

      const count = subsequentParticipants.length;
      const base = Math.floor(remaining / count);
      const rem = remaining % count;

      subsequentParticipants.forEach((pid, subIdx) => {
        nextAmounts[pid] = base + (subIdx < rem ? 1 : 0);
      });
    } else {
      // If editing the last participant in the list, auto-adjust the preceding participant(s)
      const priorParticipants = expParticipants.slice(0, changedIndex);
      if (priorParticipants.length === 1) {
        const onlyOtherId = priorParticipants[0];
        nextAmounts[onlyOtherId] = Math.max(0, totalAmount - enteredAmount);
      } else if (priorParticipants.length > 1) {
        const remaining = Math.max(0, totalAmount - enteredAmount);
        const count = priorParticipants.length;
        const base = Math.floor(remaining / count);
        const rem = remaining % count;
        priorParticipants.forEach((pid, pIdx) => {
          nextAmounts[pid] = base + (pIdx < rem ? 1 : 0);
        });
      }
    }

    setExpIndividualAmounts(nextAmounts);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingExpense ? t('editExpense', 'Chỉnh sửa khoản chi') : t('addExpense', 'Thêm khoản chi mới')}
      maxWidth="max-w-xl"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <button
            type="button"
            onClick={onClose}
            className="tactile-btn-pill cursor-pointer px-4 py-2 text-xs font-semibold"
          >
            {t('cancel', 'Hủy')}
          </button>
          <button
            type="submit"
            form="expense-form"
            disabled={submitting}
            className="tactile-btn-dark disabled:opacity-50 cursor-pointer px-5 py-2 text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            {submitting ? t('saving', 'Đang lưu...') : editingExpense ? t('updateExpense', 'Cập nhật khoản chi') : t('saveExpense', 'Lưu khoản chi')}
          </button>
        </div>
      }
    >
      <form id="expense-form" onSubmit={onSaveExpense} className="space-y-4">
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
                {expBillImageUrl ? t('billAttached', 'Đã đính kèm ảnh hóa đơn') : t('billPhoto', 'Ảnh hóa đơn')}
              </span>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {t('captureOrUploadBillDesc', 'Chụp hoặc tải ảnh hóa đơn thanh toán')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenCamera}
            className="tactile-btn-pill text-xs border border-[#e6e4dc] dark:border-[#2e2e38] cursor-pointer"
          >
            {expBillImageUrl ? t('changePhoto', 'Thay đổi ảnh') : t('captureUploadPhoto', 'Chụp / Tải ảnh')}
          </button>
        </div>

        {/* Expense Name */}
        <div>
          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
            {t('expenseNameLabel', 'Tên khoản chi *')}
          </label>
          <input
            type="text"
            required
            placeholder={t('expenseNamePlaceholder', 'Ví dụ: Ăn tối Pad Thai, Vé tham quan Tokyo Tower, Taxi Marina Bay...')}
            value={expTitle}
            onChange={(e) => setExpTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl bg-[#f4f3ec] dark:bg-[#1a1a22] border border-[#e6e4dc] dark:border-[#2e2e38] text-sm text-[#18181b] dark:text-white outline-none focus:border-zinc-900 dark:focus:border-purple-500 focus:bg-white dark:focus:bg-[#20202c] transition-colors"
          />
        </div>

        {/* Currency Selector */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-zinc-500" />
              <span>{t('currency', 'Tiền tệ (Du lịch quốc tế)')}</span>
            </label>
            {expCurrency !== 'VND' && (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Tự quy đổi sang VNĐ
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 py-1">
            {SUPPORTED_CURRENCIES.map((c) => {
              const isSelected = (expCurrency || 'VND') === c.code;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    if (c.code === expCurrency) return;
                    setExpCurrency(c.code);
                    const currentVnd = Number(expAmount) || (Number(expOriginalAmount) * (Number(expExchangeRate) || 1)) || 0;
                    if (c.code === 'VND') {
                      setExpExchangeRate(1);
                      const finalVnd = currentVnd > 0 ? String(Math.round(currentVnd)) : '';
                      setExpAmount(finalVnd);
                      setExpOriginalAmount(finalVnd);
                    } else {
                      const rate = c.defaultRate || 1;
                      setExpExchangeRate(rate);
                      if (currentVnd > 0) {
                        const foreignVal = Math.round((currentVnd / rate) * 100) / 100;
                        setExpOriginalAmount(String(foreignVal));
                        setExpAmount(String(Math.round(foreignVal * rate)));
                      }
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 min-w-[70px] sm:min-w-[76px] text-center ${
                    isSelected
                      ? 'bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] shadow-md scale-105 ring-2 ring-zinc-900/10 dark:ring-white/20'
                      : 'bg-[#f4f3ec] dark:bg-[#1a1a22] text-zinc-600 dark:text-zinc-400 border border-[#e6e4dc] dark:border-[#2e2e38] hover:border-zinc-400 hover:bg-[#edece4] dark:hover:bg-[#252530]'
                  }`}
                >
                  <span className="text-xs leading-none">{c.flag}</span>
                  <span className="font-mono tracking-tight">{c.code}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount & Paid By */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              {t('amount', 'Số tiền')} {expCurrency !== 'VND' ? `(${expCurrency}) *` : '*'}
            </label>
            <div className="relative">
              <input
                type={expCurrency === 'VND' ? 'text' : 'number'}
                inputMode={expCurrency === 'VND' ? 'numeric' : 'decimal'}
                required
                step="any"
                min={expCurrency === 'VND' ? undefined : '0.01'}
                placeholder="0"
                value={expCurrency === 'VND' ? formatVNDInput(expAmount) : expOriginalAmount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (expCurrency === 'VND') {
                    const rawDigits = val.replace(/\D/g, '');
                    setExpAmount(rawDigits);
                    setExpOriginalAmount(rawDigits);
                    if (expSplitType === 'custom' && expParticipants.length > 0 && rawDigits) {
                      const total = Number(rawDigits) || 0;
                      const base = Math.floor(total / expParticipants.length);
                      const rem = total % expParticipants.length;
                      const updated = {};
                      expParticipants.forEach((pid, idx) => {
                        updated[pid] = base + (idx < rem ? 1 : 0);
                      });
                      setExpIndividualAmounts(updated);
                    }
                  } else {
                    setExpOriginalAmount(val);
                    const rate = Number(expExchangeRate) || getCurrencyInfo(expCurrency).defaultRate;
                    setExpAmount(String(Math.round((Number(val) || 0) * rate)));
                  }
                }}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#f4f3ec] dark:bg-[#1a1a22] border border-[#e6e4dc] dark:border-[#2e2e38] text-sm font-bold text-zinc-900 dark:text-white outline-none focus:border-zinc-900 dark:focus:border-purple-500 focus:bg-white dark:focus:bg-[#20202c] transition-colors"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-bold text-zinc-500">
                {getCurrencyInfo(expCurrency).symbol}
              </span>
            </div>

            {/* Live formatted VND helper text */}
            {expCurrency === 'VND' && Number(expAmount) > 0 && (
              <div className="mt-1 flex items-center justify-between text-[11px] px-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <span>Quy đổi:</span>
                <span>= {formatVND(expAmount)}</span>
              </div>
            )}

            {/* Quick VND shortcuts (+10k, +50k, +100k, +200k, +500k, Xóa) */}
            {expCurrency === 'VND' && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {[
                  { label: '+10k', val: 10000 },
                  { label: '+50k', val: 50000 },
                  { label: '+100k', val: 100000 },
                  { label: '+200k', val: 200000 },
                  { label: '+500k', val: 500000 },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => {
                      const current = Number(expAmount) || 0;
                      const next = current + chip.val;
                      setExpAmount(String(next));
                      setExpOriginalAmount(String(next));
                      if (expSplitType === 'custom' && expParticipants.length > 0) {
                        const base = Math.floor(next / expParticipants.length);
                        const rem = next % expParticipants.length;
                        const updated = {};
                        expParticipants.forEach((pid, idx) => {
                          updated[pid] = base + (idx < rem ? 1 : 0);
                        });
                        setExpIndividualAmounts(updated);
                      }
                    }}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#f4f3ec] dark:bg-[#252532] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-[#323242] transition-colors border border-[#e6e4dc] dark:border-[#32323e] cursor-pointer"
                  >
                    {chip.label}
                  </button>
                ))}
                {Number(expAmount) > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setExpAmount('');
                      setExpOriginalAmount('');
                      if (expSplitType === 'custom') {
                        const updated = {};
                        expParticipants.forEach((pid) => {
                          updated[pid] = 0;
                        });
                        setExpIndividualAmounts(updated);
                      }
                    }}
                    className="px-1.5 py-0.5 rounded-lg text-[10px] font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                  >
                    {t('clear', 'Xóa')}
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              {t('paidByLabel', 'Người trả tiền *')}
            </label>
            <select
              value={expPaidBy}
              onChange={(e) => setExpPaidBy(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#f4f3ec] dark:bg-[#1a1a22] border border-[#e6e4dc] dark:border-[#2e2e38] text-sm font-semibold text-zinc-800 dark:text-zinc-200 outline-none focus:border-zinc-900 dark:focus:border-purple-500 focus:bg-white dark:focus:bg-[#20202c] transition-colors"
            >
              {members.map((m) => {
                const memberId = m.userId || m.uid || m.id;
                const isMe = memberId === (currentUser?.uid || currentUser?.userId || currentUser?.id);
                return (
                  <option key={memberId} value={memberId}>
                    {m.displayName} {isMe ? `(${t('me', 'Tôi')})` : ''}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Foreign Currency Exchange Rate & Live VND Conversion Card */}
        {expCurrency !== 'VND' && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Tỷ giá: 1 {expCurrency} =
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="any"
                  value={expExchangeRate}
                  onChange={(e) => {
                    const newRate = Number(e.target.value) || 0;
                    setExpExchangeRate(e.target.value);
                    setExpAmount(Math.round((Number(expOriginalAmount) || 0) * newRate));
                  }}
                  className="w-24 px-2 py-1 text-right font-bold rounded-lg bg-white dark:bg-[#20202a] border border-amber-300 dark:border-amber-700/60 text-[#18181b] dark:text-white outline-none text-xs"
                />
                <span className="font-bold text-amber-900 dark:text-amber-200">VNĐ</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1.5 border-t border-amber-500/20 text-amber-950 dark:text-amber-100">
              <span className="text-[11px] font-medium opacity-80">Quy đổi sang VNĐ (chuẩn quyết toán):</span>
              <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                ≈ {new Intl.NumberFormat('vi-VN').format(Number(expAmount) || 0)} VNĐ
              </span>
            </div>
          </div>
        )}

        {/* Participants Selection */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              {t('participantsUsingLabel', 'Người tham gia sử dụng')} ({expParticipants.length}/{members.length})
            </label>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">
              <button type="button" onClick={onSelectAllParticipants} className="hover:underline font-bold cursor-pointer">
                {t('selectAll', 'Chọn tất cả')}
              </button>
              <span>•</span>
              <button type="button" onClick={onClearAllParticipants} className="hover:underline text-zinc-400 dark:text-zinc-500 cursor-pointer">
                {t('clearAll', 'Bỏ chọn')}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 p-2.5 sm:p-3 rounded-2xl bg-[#f4f3ec] dark:bg-[#1a1a22] border border-[#e6e4dc] dark:border-[#2e2e38]">
            {members.map((m) => {
              const memberId = m.userId || m.uid || m.id;
              const isChecked = expParticipants.includes(memberId);
              return (
                <label
                  key={memberId}
                  className={`flex-1 min-w-[130px] flex items-center gap-2 p-2.5 rounded-xl cursor-pointer text-xs font-semibold transition-all select-none ${
                    isChecked
                      ? 'bg-white dark:bg-[#212129] text-zinc-900 dark:text-white shadow-xs border border-[#e6e4dc] dark:border-[#32323e]'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleParticipant(memberId)}
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
            {t('splitMethodLabel', 'Phương thức chia tiền')}
          </label>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <button
              type="button"
              onClick={() => setExpSplitType('equal')}
              className={`py-2 px-3 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                expSplitType === 'equal'
                  ? 'bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] border-[#18181b] dark:border-white shadow-xs'
                  : 'bg-[#f4f3ec] dark:bg-[#22222a] border-[#e6e4dc] dark:border-[#32323e] text-zinc-600 dark:text-zinc-300 hover:bg-[#eae8df] dark:hover:bg-[#2c2c36]'
              }`}
            >
              {t('equalSplit', 'Chia đều')}
            </button>

            <button
              type="button"
              onClick={() => {
                setExpSplitType('custom');
                if ((!expIndividualAmounts || Object.keys(expIndividualAmounts).length === 0) && expParticipants.length > 0 && Number(expAmount) > 0) {
                  const num = Math.round(Number(expAmount) || 0);
                  const base = Math.floor(num / expParticipants.length);
                  const rem = num % expParticipants.length;
                  const initial = {};
                  expParticipants.forEach((pid, idx) => {
                    initial[pid] = base + (idx < rem ? 1 : 0);
                  });
                  setExpIndividualAmounts(initial);
                }
              }}
              className={`py-2 px-3 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                expSplitType === 'custom'
                  ? 'bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] border-[#18181b] dark:border-white shadow-xs'
                  : 'bg-[#f4f3ec] dark:bg-[#22222a] border-[#e6e4dc] dark:border-[#32323e] text-zinc-600 dark:text-zinc-300 hover:bg-[#eae8df] dark:hover:bg-[#2c2c36]'
              }`}
            >
              {t('customSplit', 'Chia tùy chỉnh')}
            </button>
          </div>

          {/* Split Details Section */}
          {expSplitType === 'equal' ? (
            <div className="p-3.5 rounded-2xl text-xs text-zinc-900 dark:text-zinc-200 flex items-center justify-between bg-[#f4f3ec] dark:bg-[#1a1a22] border border-[#e6e4dc] dark:border-[#2e2e38]">
              <span>{t('estimatedPerPerson', 'Mỗi người chịu dự kiến:')}</span>
              <span className="font-extrabold text-[#18181b] dark:text-white text-sm">
                {formatVND(liveShares?.perPerson || 0)}/{t('person', 'người')}
              </span>
            </div>
          ) : (
            <div className="space-y-2 p-3 rounded-2xl bg-[#f4f3ec] dark:bg-[#1a1a22] border border-[#e6e4dc] dark:border-[#2e2e38]">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                <div className="flex items-center gap-2">
                  <span>{t('enterCustomIndividualAmounts', 'Số tiền từng người:')}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const num = Math.round(Number(expAmount) || 0);
                      if (num > 0 && expParticipants.length > 0) {
                        const base = Math.floor(num / expParticipants.length);
                        const rem = num % expParticipants.length;
                        const initial = {};
                        expParticipants.forEach((pid, idx) => {
                          initial[pid] = base + (idx < rem ? 1 : 0);
                        });
                        setExpIndividualAmounts(initial);
                      }
                    }}
                    className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white underline cursor-pointer"
                  >
                    (Chia đều lại)
                  </button>
                </div>
                <span
                  className={
                    liveShares?.remaining === 0
                      ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                      : 'text-rose-600 dark:text-rose-400 font-bold'
                  }
                >
                  {liveShares?.remaining === 0
                    ? t('matchedFull', 'Đã khớp 100% ✓')
                    : liveShares?.remaining > 0
                    ? `${t('remainingDeficit', 'Còn thiếu:')} ${formatVND(liveShares.remaining)}`
                    : `${t('remainingExceeded', 'Vượt quá:')} ${formatVND(Math.abs(liveShares.remaining))}`}
                </span>
              </div>

              {expParticipants.map((userId) => {
                const m = members.find((u) => (u.userId || u.uid || u.id) === userId);
                return (
                  <div key={userId} className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300 truncate">{m?.displayName}</span>
                    <div className="w-36 relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={formatVNDInput(expIndividualAmounts[userId])}
                        onChange={(e) => handleCustomAmountChange(userId, e.target.value)}
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
          <div className="min-w-0">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              {t('expenseDate', 'Ngày chi')}
            </label>
            <input
              type="date"
              value={expDate}
              onChange={(e) => setExpDate(e.target.value)}
              className="w-full max-w-full px-3 py-2 rounded-2xl bg-[#f4f3ec] dark:bg-[#1a1a22] border border-[#e6e4dc] dark:border-[#2e2e38] text-xs text-[#18181b] dark:text-white outline-none focus:border-zinc-900 dark:focus:border-purple-500 focus:bg-white dark:focus:bg-[#20202c] transition-colors appearance-none"
              style={{ boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              {t('note', 'Ghi chú')}
            </label>
            <input
              type="text"
              placeholder={t('expenseNotePlaceholder', 'Ví dụ: E bị mệt về phòng trước...')}
              value={expNote}
              onChange={(e) => setExpNote(e.target.value)}
              className="w-full px-3 py-2 rounded-2xl bg-[#f4f3ec] dark:bg-[#1a1a22] border border-[#e6e4dc] dark:border-[#2e2e38] text-xs text-[#18181b] dark:text-white outline-none focus:border-zinc-900 dark:focus:border-purple-500 focus:bg-white dark:focus:bg-[#20202c] transition-colors"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
