/**
 * Settlement Service for SplitMate
 * Implements Debt Simplification (Minimum Cash Flow algorithm) to minimize transactions,
 * and handles settlement payment lifecycle and VietQR formatting.
 */

/**
 * Calculates the optimized list of settlements ("Who pays whom")
 * using a greedy algorithm that minimizes the number of transactions needed.
 * 
 * @param {Record<string, { userId: string, balance: number, displayName?: string }>} memberTotals 
 * @returns {Array<{ id: string, fromUserId: string, toUserId: string, amount: number, status: string }>}
 */
export function optimizeSettlements(memberTotals) {
  // Extract creditors (balance > 0) and debtors (balance < 0)
  const creditors = [];
  const debtors = [];

  for (const item of Object.values(memberTotals)) {
    const bal = Math.round(item.balance);
    if (bal > 0) {
      creditors.push({
        userId: item.userId,
        displayName: item.displayName || 'Thành viên',
        amount: bal,
      });
    } else if (bal < 0) {
      debtors.push({
        userId: item.userId,
        displayName: item.displayName || 'Thành viên',
        amount: -bal, // positive debt
      });
    }
  }

  // Sort descending by amount to settle largest debts first
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let cIdx = 0;
  let dIdx = 0;

  while (cIdx < creditors.length && dIdx < debtors.length) {
    const creditor = creditors[cIdx];
    const debtor = debtors[dIdx];

    const settledAmount = Math.min(debtor.amount, creditor.amount);

    if (settledAmount > 0) {
      transactions.push({
        id: `settle_${debtor.userId}_${creditor.userId}`,
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount: settledAmount,
        status: 'PENDING', // PENDING -> PAID -> CONFIRMED
      });
    }

    debtor.amount -= settledAmount;
    creditor.amount -= settledAmount;

    if (debtor.amount === 0) {
      dIdx++;
    }
    if (creditor.amount === 0) {
      cIdx++;
    }
  }

  return transactions;
}

/**
 * Merges optimized settlement plan with existing recorded settlements in database.
 * Preserves payment statuses (PAID, CONFIRMED, transaction timestamps, proof/receipts).
 * 
 * @param {Array} optimizedSettlements Calculated settlements
 * @param {Array} existingSettlements Database settlements for the trip
 * @param {Record<string, any>} memberMap Mapping of user info
 * @returns {Array} Combined settlement objects
 */
export function reconcileSettlements(optimizedSettlements, existingSettlements = [], memberMap = {}) {
  const existingMap = {};
  for (const s of existingSettlements) {
    const key = `${s.fromUserId}_${s.toUserId}`;
    existingMap[key] = s;
  }

  return optimizedSettlements.map((s, idx) => {
    const key = `${s.fromUserId}_${s.toUserId}`;
    const existing = existingMap[key];

    const fromUser = memberMap[s.fromUserId] || {};
    const toUser = memberMap[s.toUserId] || {};

    if (existing) {
      return {
        ...existing,
        id: existing.id || `settle_${s.fromUserId}_${s.toUserId}_${idx}`,
        fromUserId: s.fromUserId,
        toUserId: s.toUserId,
        amount: s.amount,
        status: existing.status || 'PENDING',
        fromUser: {
          userId: s.fromUserId,
          displayName: fromUser.displayName || 'Người gửi',
          photoURL: fromUser.photoURL || '',
        },
        toUser: {
          userId: s.toUserId,
          displayName: toUser.displayName || 'Người nhận',
          photoURL: toUser.photoURL || '',
          bankName: toUser.bankName || '',
          bankAccountNumber: toUser.bankAccountNumber || '',
          bankAccountHolder: toUser.bankAccountHolder || '',
          paymentQrUrl: toUser.paymentQrUrl || '',
        },
      };
    }

    return {
      id: `settle_${s.fromUserId}_${s.toUserId}_${idx}`,
      fromUserId: s.fromUserId,
      toUserId: s.toUserId,
      amount: s.amount,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      paidAt: null,
      confirmedAt: null,
      fromUser: {
        userId: s.fromUserId,
        displayName: fromUser.displayName || 'Người gửi',
        photoURL: fromUser.photoURL || '',
      },
      toUser: {
        userId: s.toUserId,
        displayName: toUser.displayName || 'Người nhận',
        photoURL: toUser.photoURL || '',
        bankName: toUser.bankName || '',
        bankAccountNumber: toUser.bankAccountNumber || '',
        bankAccountHolder: toUser.bankAccountHolder || '',
        paymentQrUrl: toUser.paymentQrUrl || '',
      },
    };
  });
}

/**
 * Generates VietQR standard payment link if bank credentials are present.
 * Uses vietqr.io open standard quick-pay format.
 */
export function generateVietQRUrl({ bankName, bankAccountNumber, bankAccountHolder, amount, tripName = '' }) {
  if (!bankName || !bankAccountNumber) return null;
  
  // Clean bank code and account
  const cleanBank = encodeURIComponent(bankName.trim().toUpperCase());
  const cleanAcc = encodeURIComponent(bankAccountNumber.trim());
  const cleanAmount = Math.round(Number(amount) || 0);
  const memo = encodeURIComponent(`SplitMate ${tripName}`.slice(0, 50));
  const holder = encodeURIComponent((bankAccountHolder || '').trim().toUpperCase());

  return `https://img.vietqr.io/image/${cleanBank}-${cleanAcc}-compact2.png?amount=${cleanAmount}&addInfo=${memo}&accountName=${holder}`;
}
