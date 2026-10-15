import { describe, it, expect } from 'vitest';
import {
  calculateExpenseShares,
  calculateMemberTotals,
  calculateBalances
} from '../services/calculationService.js';

describe('calculationService', () => {
  describe('calculateExpenseShares', () => {
    describe('Chia đều (splitType = equal) và xử lý tiền lẻ 1đ', () => {
      it('chia 100,001đ cho 3 người: bảo đảm tổng các phần bằng chính xác 100,001đ', () => {
        const expense = {
          amount: 100001,
          participants: ['user_A', 'user_B', 'user_C'],
          splitType: 'equal'
        };

        const shares = calculateExpenseShares(expense);

        // 100,001 / 3 = 33,333 dư 2 => 2 người đầu nhận 33,334đ, người thứ 3 nhận 33,333đ
        expect(shares['user_A']).toBe(33334);
        expect(shares['user_B']).toBe(33334);
        expect(shares['user_C']).toBe(33333);

        const sum = Object.values(shares).reduce((acc, val) => acc + val, 0);
        expect(sum).toBe(100001);
      });

      it('chia 1đ cho 2 người: người đầu chịu 1đ, người sau chịu 0đ, tổng đúng 1đ', () => {
        const expense = {
          amount: 1,
          participants: ['user_1', 'user_2'],
          splitType: 'equal'
        };

        const shares = calculateExpenseShares(expense);
        expect(shares['user_1']).toBe(1);
        expect(shares['user_2']).toBe(0);

        const sum = shares['user_1'] + shares['user_2'];
        expect(sum).toBe(1);
      });

      it('chia 10đ cho 3 người: 4đ, 3đ, 3đ => tổng đúng 10đ', () => {
        const expense = {
          amount: 10,
          participants: ['u1', 'u2', 'u3'],
          splitType: 'equal'
        };

        const shares = calculateExpenseShares(expense);
        expect(shares['u1']).toBe(4);
        expect(shares['u2']).toBe(3);
        expect(shares['u3']).toBe(3);

        const sum = Object.values(shares).reduce((a, b) => a + b, 0);
        expect(sum).toBe(10);
      });

      it('chia 50,000đ cho 7 người: tổng luôn bằng chính xác 50,000đ', () => {
        const participants = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'];
        const expense = {
          amount: 50000,
          participants,
          splitType: 'equal'
        };

        const shares = calculateExpenseShares(expense);
        const sum = Object.values(shares).reduce((a, b) => a + b, 0);
        expect(sum).toBe(50000);
      });
    });

    describe('Chia tùy chỉnh (splitType = custom)', () => {
      it('chia hợp lệ khi tổng các phần khớp đúng amount', () => {
        const expense = {
          amount: 150000,
          participants: ['uA', 'uB', 'uC'],
          splitType: 'custom',
          individualAmounts: {
            uA: 70000,
            uB: 50000,
            uC: 30000
          }
        };

        const shares = calculateExpenseShares(expense);
        expect(shares).toEqual({
          uA: 70000,
          uB: 50000,
          uC: 30000
        });
      });

      it('ném lỗi khi chia tùy chỉnh có số tiền âm', () => {
        const expense = {
          amount: 100000,
          participants: ['uA', 'uB'],
          splitType: 'custom',
          individualAmounts: {
            uA: 120000,
            uB: -20000
          }
        };

        expect(() => calculateExpenseShares(expense)).toThrow(
          /Số tiền cho thành viên uB không được âm/
        );
      });

      it('ném lỗi khi tổng tiền phân bổ còn thiếu', () => {
        const expense = {
          amount: 100000,
          participants: ['uA', 'uB'],
          splitType: 'custom',
          individualAmounts: {
            uA: 40000,
            uB: 40000
          }
        };

        expect(() => calculateExpenseShares(expense)).toThrow(
          /Tổng tiền phân bổ còn thiếu 20\.000/
        );
      });

      it('ném lỗi khi tổng tiền phân bổ vượt quá', () => {
        const expense = {
          amount: 100000,
          participants: ['uA', 'uB'],
          splitType: 'custom',
          individualAmounts: {
            uA: 60000,
            uB: 50000
          }
        };

        expect(() => calculateExpenseShares(expense)).toThrow(
          /Tổng tiền phân bổ vượt quá 10\.000/
        );
      });
    });

    describe('Kiểm tra đầu vào bất hợp lệ', () => {
      it('ném lỗi khi số tiền <= 0', () => {
        expect(() =>
          calculateExpenseShares({ amount: 0, participants: ['u1'] })
        ).toThrow('Số tiền chi tiêu phải lớn hơn 0.');

        expect(() =>
          calculateExpenseShares({ amount: -5000, participants: ['u1'] })
        ).toThrow('Số tiền chi tiêu phải lớn hơn 0.');
      });

      it('ném lỗi khi không có người tham gia', () => {
        expect(() =>
          calculateExpenseShares({ amount: 10000, participants: [] })
        ).toThrow('Khoản chi phải có ít nhất một người tham gia.');
      });

      it('ném lỗi khi splitType không được hỗ trợ', () => {
        expect(() =>
          calculateExpenseShares({
            amount: 10000,
            participants: ['u1'],
            splitType: 'percentage'
          })
        ).toThrow("Loại phân chia 'percentage' không hợp lệ.");
      });
    });
  });

  describe('calculateMemberTotals', () => {
    it('kiểm tra invariant sum(Balance) = 0 trong kịch bản nhiều hóa đơn phức tạp', () => {
      const members = [
        { userId: 'u_alice', displayName: 'Alice' },
        { userId: 'u_bob', displayName: 'Bob' },
        { userId: 'u_charlie', displayName: 'Charlie' },
        { userId: 'u_david', displayName: 'David' }
      ];

      const expenses = [
        // Hóa đơn 1: Alice trả 300,000đ cho cả 4 người chia đều (75k/người)
        {
          id: 'exp1',
          amount: 300000,
          paidBy: 'u_alice',
          participants: ['u_alice', 'u_bob', 'u_charlie', 'u_david'],
          splitType: 'equal'
        },
        // Hóa đơn 2: Bob trả 100,001đ cho [Alice, Bob, Charlie] chia đều
        {
          id: 'exp2',
          amount: 100001,
          paidBy: 'u_bob',
          participants: ['u_alice', 'u_bob', 'u_charlie'],
          splitType: 'equal'
        },
        // Hóa đơn 3: Charlie trả 250,000đ chia tùy chỉnh
        {
          id: 'exp3',
          amount: 250000,
          paidBy: 'u_charlie',
          participants: ['u_alice', 'u_bob', 'u_david'],
          splitType: 'custom',
          individualAmounts: {
            u_alice: 100000,
            u_bob: 100000,
            u_david: 50000
          }
        },
        // Hóa đơn 4: David trả 40,000đ cho Bob và David chia đều
        {
          id: 'exp4',
          amount: 40000,
          paidBy: 'u_david',
          participants: ['u_bob', 'u_david'],
          splitType: 'equal'
        }
      ];

      const result = calculateMemberTotals(expenses, members);

      expect(result.invariantsSatisfied).toBe(true);

      const totalExpenseExpected = 300000 + 100001 + 250000 + 40000; // 690,001đ
      expect(result.totalExpense).toBe(totalExpenseExpected);

      const totals = Object.values(result.memberTotals);
      const sumPaid = totals.reduce((sum, m) => sum + m.totalPaid, 0);
      const sumOwed = totals.reduce((sum, m) => sum + m.totalOwed, 0);
      const sumBalance = totals.reduce((sum, m) => sum + m.balance, 0);

      // Invariants:
      // 1. Tổng tiền mọi người đã trả = tổng chi tiêu
      expect(sumPaid).toBe(totalExpenseExpected);
      // 2. Tổng nợ phải chịu = tổng chi tiêu
      expect(sumOwed).toBe(totalExpenseExpected);
      // 3. Tổng số dư phải triệt tiêu chính xác bằng 0: sum(Balance) = 0
      expect(Math.abs(sumBalance)).toBeLessThanOrEqual(1);
    });

    it('tự động bổ sung thành viên xuất hiện trong chi tiêu nhưng chưa khai báo trong members', () => {
      const expenses = [
        {
          id: 'exp1',
          amount: 60000,
          paidBy: 'external_user',
          participants: ['external_user', 'member_1'],
          splitType: 'equal'
        }
      ];

      const members = [{ userId: 'member_1', displayName: 'Member 1' }];
      const result = calculateMemberTotals(expenses, members);

      expect(result.memberTotals['external_user']).toBeDefined();
      expect(result.memberTotals['external_user'].totalPaid).toBe(60000);
      expect(result.memberTotals['external_user'].totalOwed).toBe(30000);
      expect(result.memberTotals['external_user'].balance).toBe(30000);
    });

    it('trả về 0 chi tiêu khi danh sách hóa đơn rỗng', () => {
      const members = [{ userId: 'u1', displayName: 'User 1' }];
      const result = calculateMemberTotals([], members);

      expect(result.totalExpense).toBe(0);
      expect(result.memberTotals['u1'].balance).toBe(0);
      expect(result.invariantsSatisfied).toBe(true);
    });
  });

  describe('calculateBalances', () => {
    it('phân loại chính xác CREDITOR, DEBTOR, SETTLED và xác định đúng topPayer', () => {
      const memberTotals = {
        u1: { userId: 'u1', displayName: 'Alice', balance: 50000, totalPaid: 100000 },
        u2: { userId: 'u2', displayName: 'Bob', balance: -50000, totalPaid: 0 },
        u3: { userId: 'u3', displayName: 'Charlie', balance: 0, totalPaid: 30000 }
      };

      const result = calculateBalances(memberTotals);

      const alice = result.members.find(m => m.userId === 'u1');
      const bob = result.members.find(m => m.userId === 'u2');
      const charlie = result.members.find(m => m.userId === 'u3');

      expect(alice.status).toBe('CREDITOR');
      expect(bob.status).toBe('DEBTOR');
      expect(charlie.status).toBe('SETTLED');

      expect(result.topPayer.userId).toBe('u1');
      expect(result.topPayer.totalPaid).toBe(100000);
    });
  });
});
