/**
 * Client-side calculation service
 * Provides instant live preview for forms and UI calculations
 */

export function calculateLiveShares({ amount, participants = [], splitType = 'equal', individualAmounts = {} }) {
  const numAmount = Math.round(Number(amount) || 0);
  const shares = {};

  if (numAmount <= 0 || !participants || participants.length === 0) {
    return { shares, allocatedTotal: 0, remaining: numAmount, isValid: false };
  }

  if (splitType === 'equal') {
    const count = participants.length;
    const baseShare = Math.floor(numAmount / count);
    const remainder = numAmount % count;

    participants.forEach((userId, index) => {
      shares[userId] = baseShare + (index < remainder ? 1 : 0);
    });

    return {
      shares,
      allocatedTotal: numAmount,
      remaining: 0,
      isValid: true,
      perPerson: baseShare
    };
  }

  if (splitType === 'custom') {
    let allocatedTotal = 0;
    for (const userId of participants) {
      const share = Math.round(Number(individualAmounts[userId]) || 0);
      shares[userId] = share;
      allocatedTotal += share;
    }

    const remaining = numAmount - allocatedTotal;

    return {
      shares,
      allocatedTotal,
      remaining,
      isValid: remaining === 0,
      diff: remaining
    };
  }

  return { shares, allocatedTotal: 0, remaining: numAmount, isValid: false };
}

export function formatVND(amount) {
  const num = Math.round(Number(amount) || 0);
  return `${num.toLocaleString('vi-VN')}đ`;
}

export function formatVNDInput(val) {
  if (val === '' || val === null || val === undefined) return '';
  const digits = String(val).replace(/\D/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function parseVNDInput(val) {
  if (val === '' || val === null || val === undefined) return 0;
  const digits = String(val).replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

