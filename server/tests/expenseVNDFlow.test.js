import { describe, it, expect, beforeEach } from 'vitest';
import { dbService } from '../services/dbService.js';
import { calculateExpenseShares, calculateMemberTotals } from '../services/calculationService.js';
import { addExpense } from '../controllers/expenseController.js';

describe('VND Expense Flow Tests', () => {
  const testTripId = 'trip_test_vnd';
  const user1 = 'u_test_1';
  const user2 = 'u_test_2';
  const user3 = 'u_test_3';

  beforeEach(() => {
    // Setup test users and trip in memory
    dbService.data.users[user1] = { uid: user1, displayName: 'Nguyen Van A' };
    dbService.data.users[user2] = { uid: user2, displayName: 'Tran Thi B' };
    dbService.data.users[user3] = { uid: user3, displayName: 'Le Van C' };

    dbService.data.trips[testTripId] = {
      id: testTripId,
      name: 'Chuyến đi Đà Lạt',
      status: 'ACTIVE',
      createdBy: user1,
      createdAt: new Date().toISOString()
    };

    dbService.data.tripMembers[testTripId] = [
      { userId: user1, role: 'Creator' },
      { userId: user2, role: 'Member' },
      { userId: user3, role: 'Member' }
    ];

    dbService.data.expenses[testTripId] = [];
  });

  it('tính toán chia đều khoản chi VND 50,000đ chuẩn xác', () => {
    const expense = {
      amount: 50000,
      currency: 'VND',
      paidBy: user1,
      participants: [user1, user2, user3],
      splitType: 'equal'
    };

    const shares = calculateExpenseShares(expense);
    // 50000 / 3 = 16666 dư 2 -> 16667, 16667, 16666
    expect(shares[user1]).toBe(16667);
    expect(shares[user2]).toBe(16667);
    expect(shares[user3]).toBe(16666);

    const total = Object.values(shares).reduce((a, b) => a + b, 0);
    expect(total).toBe(50000);
  });

  it('tính toán chia tùy chỉnh khoản chi VND 120,000đ', () => {
    const expense = {
      amount: 120000,
      currency: 'VND',
      paidBy: user2,
      participants: [user1, user2, user3],
      splitType: 'custom',
      individualAmounts: {
        [user1]: 50000,
        [user2]: 40000,
        [user3]: 30000
      }
    };

    const shares = calculateExpenseShares(expense);
    expect(shares[user1]).toBe(50000);
    expect(shares[user2]).toBe(40000);
    expect(shares[user3]).toBe(30000);

    const total = Object.values(shares).reduce((a, b) => a + b, 0);
    expect(total).toBe(120000);
  });

  it('addExpense controller chấp nhận và lưu khoản chi VND hợp lệ', async () => {
    const req = {
      params: { tripId: testTripId },
      user: { uid: user1, displayName: 'Nguyen Van A' },
      body: {
        title: 'Ăn tối lẩu gà lá é',
        amount: 350000,
        currency: 'VND',
        originalAmount: 350000,
        exchangeRate: 1,
        paidBy: user1,
        participants: [user1, user2, user3],
        splitType: 'equal',
        date: '2026-10-16'
      }
    };

    let statusCode = 200;
    let jsonResponse = null;
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonResponse = data;
        return this;
      }
    };

    await addExpense(req, res);

    expect(statusCode).toBe(201);
    expect(jsonResponse).toBeDefined();
    expect(jsonResponse.amount).toBe(350000);
    expect(jsonResponse.currency).toBe('VND');
    expect(jsonResponse.paidBy).toBe(user1);
    expect(jsonResponse.participants).toEqual([user1, user2, user3]);

    // Check persistence in dbService
    const expenses = dbService.getTripExpenses(testTripId);
    expect(expenses).toHaveLength(1);
    expect(expenses[0].amount).toBe(350000);

    // Calculate totals and ensure invariants
    const members = dbService.getTripMembers(testTripId);
    const summary = calculateMemberTotals(expenses, members);
    expect(summary.totalExpense).toBe(350000);
    expect(summary.memberTotals[user1].totalPaid).toBe(350000);
  });

  it('từ chối khoản chi VND có số tiền <= 0', async () => {
    const req = {
      params: { tripId: testTripId },
      user: { uid: user1 },
      body: {
        title: 'Khoản chi lỗi',
        amount: 0,
        currency: 'VND',
        paidBy: user1,
        participants: [user1, user2],
        splitType: 'equal'
      }
    };

    let statusCode = 200;
    let errorResponse = null;
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        errorResponse = data;
        return this;
      }
    };

    await addExpense(req, res);
    expect(statusCode).toBe(400);
    expect(errorResponse.error).toContain('Số tiền chi tiêu phải lớn hơn 0');
  });
});
