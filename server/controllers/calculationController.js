import { dbService } from '../services/dbService.js';
import { calculateMemberTotals, calculateBalances } from '../services/calculationService.js';
import { optimizeSettlements, reconcileSettlements, generateVietQRUrl } from '../services/settlementService.js';

export async function getTripSummary(req, res) {
  try {
    const { tripId } = req.params;
    const trip = dbService.getTrip(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Không tìm thấy chuyến đi.' });
    }

    const members = dbService.getTripMembers(tripId);
    const expenses = dbService.getTripExpenses(tripId);

    const { totalExpense, memberTotals, invariantsSatisfied } = calculateMemberTotals(expenses, members);
    const { members: memberList, topPayer } = calculateBalances(memberTotals);

    return res.json({
      tripId,
      tripName: trip.name,
      status: trip.status,
      totalExpense,
      memberCount: members.length,
      expenseCount: expenses.length,
      topPayer,
      members: memberList,
      invariantsSatisfied
    });
  } catch (err) {
    console.error('[getTripSummary] Error:', err);
    return res.status(500).json({ error: err.message || 'Lỗi khi tính toán tổng quan chuyến đi.' });
  }
}

export async function getTripBalances(req, res) {
  try {
    const { tripId } = req.params;
    const trip = dbService.getTrip(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Không tìm thấy chuyến đi.' });
    }

    const members = dbService.getTripMembers(tripId);
    const expenses = dbService.getTripExpenses(tripId);

    const { totalExpense, memberTotals, invariantsSatisfied } = calculateMemberTotals(expenses, members);
    const { members: memberList, topPayer } = calculateBalances(memberTotals);

    // Sum checks for frontend verification badge
    let sumPaid = 0;
    let sumOwed = 0;
    let sumBalance = 0;

    memberList.forEach(m => {
      sumPaid += m.totalPaid;
      sumOwed += m.totalOwed;
      sumBalance += m.balance;
    });

    return res.json({
      totalExpense,
      sumPaid,
      sumOwed,
      sumBalance,
      invariantsSatisfied,
      members: memberList,
      topPayer
    });
  } catch (err) {
    console.error('[getTripBalances] Error:', err);
    return res.status(500).json({ error: err.message || 'Lỗi khi tính toán bảng cân đối công nợ.' });
  }
}

export async function getTripSettlements(req, res) {
  try {
    const { tripId } = req.params;
    const trip = dbService.getTrip(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Không tìm thấy chuyến đi.' });
    }

    const members = dbService.getTripMembers(tripId);
    const expenses = dbService.getTripExpenses(tripId);

    const { totalExpense, memberTotals } = calculateMemberTotals(expenses, members);
    const optimized = optimizeSettlements(memberTotals);
    const existingSettlements = dbService.getTripSettlements(tripId);

    const memberMap = {};
    members.forEach(m => {
      memberMap[m.userId] = m;
    });

    const reconciled = reconcileSettlements(optimized, existingSettlements, memberMap);

    // Attach VietQR URLs to settlements
    const settlementsWithQR = reconciled.map(s => {
      const recipient = s.toUser;
      const vietQrUrl = recipient?.bankName && recipient?.bankAccountNumber
        ? generateVietQRUrl({
            bankName: recipient.bankName,
            bankAccountNumber: recipient.bankAccountNumber,
            bankAccountHolder: recipient.bankAccountHolder,
            amount: s.amount,
            tripName: trip.name,
          })
        : (recipient?.paymentQrUrl || null);

      return {
        ...s,
        vietQrUrl
      };
    });

    return res.json({
      tripId,
      tripName: trip.name,
      totalExpense,
      settlements: settlementsWithQR,
      allSettled: settlementsWithQR.length === 0 || settlementsWithQR.every(s => s.status === 'CONFIRMED'),
    });
  } catch (err) {
    console.error('[getTripSettlements] Error:', err);
    return res.status(500).json({ error: err.message || 'Lỗi khi tính toán danh sách quyết toán.' });
  }
}
