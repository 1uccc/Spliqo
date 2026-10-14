/**
 * Calculation Service for Spliqo
 * Handles calculating expense shares, member totals, balances, and invariant validation.
 */

/**
 * Calculates individual participant shares for a single expense.
 * Guarantees that the sum of shares equals the total expense amount exactly.
 * 
 * @param {Object} expense 
 * @returns {Record<string, number>} mapping of userId to their share amount
 */
export function calculateExpenseShares(expense) {
  const { amount, participants = [], splitType = 'equal', individualAmounts = {} } = expense;
  const numAmount = Math.round(Number(amount) || 0);

  if (numAmount <= 0) {
    throw new Error('Số tiền chi tiêu phải lớn hơn 0.');
  }

  if (!participants || participants.length === 0) {
    throw new Error('Khoản chi phải có ít nhất một người tham gia.');
  }

  const shares = {};

  if (splitType === 'equal') {
    const count = participants.length;
    const baseShare = Math.floor(numAmount / count);
    const remainder = numAmount % count;

    // Distribute remainder 1 unit at a time to first remainder participants
    participants.forEach((userId, index) => {
      shares[userId] = baseShare + (index < remainder ? 1 : 0);
    });
  } else if (splitType === 'custom') {
    let allocatedTotal = 0;
    for (const userId of participants) {
      const share = Math.round(Number(individualAmounts[userId]) || 0);
      if (share < 0) {
        throw new Error(`Số tiền cho thành viên ${userId} không được âm.`);
      }
      shares[userId] = share;
      allocatedTotal += share;
    }

    if (allocatedTotal !== numAmount) {
      const diff = numAmount - allocatedTotal;
      if (diff > 0) {
        throw new Error(`Tổng tiền phân bổ còn thiếu ${diff.toLocaleString('vi-VN')}đ.`);
      } else {
        throw new Error(`Tổng tiền phân bổ vượt quá ${Math.abs(diff).toLocaleString('vi-VN')}đ.`);
      }
    }
  } else {
    throw new Error(`Loại phân chia '${splitType}' không hợp lệ.`);
  }

  return shares;
}

/**
 * Aggregates all expenses for a trip across all members.
 * 
 * @param {Array} expenses List of trip expenses
 * @param {Array} members List of trip members
 * @returns {Object} { totalExpense, memberTotals: Record<userId, { totalPaid, totalOwed, balance }> }
 */
export function calculateMemberTotals(expenses = [], members = []) {
  const memberMap = {};

  // Initialize all known members
  for (const member of members) {
    const id = member.userId || member.uid || member.id;
    if (id) {
      memberMap[id] = {
        userId: id,
        displayName: member.displayName || 'Thành viên',
        photoURL: member.photoURL || '',
        bankName: member.bankName || '',
        bankAccountNumber: member.bankAccountNumber || '',
        bankAccountHolder: member.bankAccountHolder || '',
        paymentQrUrl: member.paymentQrUrl || '',
        totalPaid: 0,
        totalOwed: 0,
        balance: 0,
      };
    }
  }

  let totalExpense = 0;

  for (const expense of expenses) {
    const amount = Math.round(Number(expense.amount) || 0);
    totalExpense += amount;

    const payerId = expense.paidBy;
    if (payerId) {
      if (!memberMap[payerId]) {
        memberMap[payerId] = {
          userId: payerId,
          displayName: 'Thành viên',
          totalPaid: 0,
          totalOwed: 0,
          balance: 0,
        };
      }
      memberMap[payerId].totalPaid += amount;
    }

    // Calculate participant shares
    const shares = calculateExpenseShares(expense);
    for (const [userId, share] of Object.entries(shares)) {
      if (!memberMap[userId]) {
        memberMap[userId] = {
          userId,
          displayName: 'Thành viên',
          totalPaid: 0,
          totalOwed: 0,
          balance: 0,
        };
      }
      memberMap[userId].totalOwed += share;
    }
  }

  // Calculate balance for each member
  let sumPaid = 0;
  let sumOwed = 0;
  let sumBalance = 0;

  for (const id of Object.keys(memberMap)) {
    const item = memberMap[id];
    item.balance = item.totalPaid - item.totalOwed;
    sumPaid += item.totalPaid;
    sumOwed += item.totalOwed;
    sumBalance += item.balance;
  }

  // Validate System Invariants
  if (Math.abs(sumPaid - totalExpense) > 1) {
    throw new Error(`Data Inconsistency: Tổng thanh toán (${sumPaid}) không khớp tổng chi tiêu (${totalExpense}).`);
  }
  if (Math.abs(sumOwed - totalExpense) > 1) {
    throw new Error(`Data Inconsistency: Tổng phải chịu (${sumOwed}) không khớp tổng chi tiêu (${totalExpense}).`);
  }
  if (Math.abs(sumBalance) > 2) {
    throw new Error(`Data Inconsistency: Tổng balance không bằng 0 (chênh lệch: ${sumBalance}).`);
  }

  return {
    totalExpense,
    memberTotals: memberMap,
    invariantsSatisfied: true,
  };
}

/**
 * Returns summary array with members sorted by balance or paid.
 */
export function calculateBalances(memberTotals) {
  const membersList = Object.values(memberTotals).map(m => ({
    ...m,
    status: m.balance > 0 ? 'CREDITOR' : m.balance < 0 ? 'DEBTOR' : 'SETTLED',
  }));

  // Top payer
  const topPayer = [...membersList].sort((a, b) => b.totalPaid - a.totalPaid)[0] || null;

  return {
    members: membersList,
    topPayer,
  };
}
