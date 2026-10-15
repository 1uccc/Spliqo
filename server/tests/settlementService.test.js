import { describe, it, expect } from 'vitest';
import {
  optimizeSettlements,
  reconcileSettlements,
  generateVietQRUrl
} from '../services/settlementService.js';

describe('settlementService', () => {
  describe('optimizeSettlements (Thuật toán rút gọn chuỗi giao dịch nợ)', () => {
    it('rút gọn chuỗi nợ bắc cầu: A nợ B, B nợ C => A trả thẳng C (loại bỏ hoàn toàn trung gian B)', () => {
      // Giả sử sau khi tính balance:
      // A chi tiêu vượt nợ: balance = -100,000 (A nợ 100k)
      // B đã trả 100k và tiêu 100k: balance = 0 (B hòa)
      // C trả thừa: balance = +100,000 (C được nhận 100k)
      const memberTotals = {
        user_A: { userId: 'user_A', displayName: 'Alice', balance: -100000 },
        user_B: { userId: 'user_B', displayName: 'Bob', balance: 0 },
        user_C: { userId: 'user_C', displayName: 'Charlie', balance: 100000 }
      };

      const transactions = optimizeSettlements(memberTotals);

      // Chỉ cần đúng 1 giao dịch duy nhất
      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toEqual({
        id: 'settle_user_A_user_C',
        fromUserId: 'user_A',
        toUserId: 'user_C',
        amount: 100000,
        status: 'PENDING'
      });
      // B không phải nhận tiền hay chuyển tiền cho ai
      expect(transactions.some(t => t.fromUserId === 'user_B' || t.toUserId === 'user_B')).toBe(false);
    });

    it('tối ưu hóa giao dịch đa thành viên: tối đa N-1 giao dịch và tổng nợ bảo toàn', () => {
      // 4 thành viên: 2 chủ nợ (+150k, +50k), 2 con nợ (-120k, -80k)
      const memberTotals = {
        u_creditor1: { userId: 'u_creditor1', balance: 150000 },
        u_creditor2: { userId: 'u_creditor2', balance: 50000 },
        u_debtor1: { userId: 'u_debtor1', balance: -120000 },
        u_debtor2: { userId: 'u_debtor2', balance: -80000 }
      };

      const transactions = optimizeSettlements(memberTotals);

      // Tối đa N - 1 = 3 giao dịch
      expect(transactions.length).toBeLessThanOrEqual(3);

      // Kiểm tra chi tiết thuật toán tham lam ưu tiên nợ lớn nhất:
      // u_debtor1 (-120k) trả u_creditor1 (+150k): 120k (u_creditor1 còn +30k)
      // u_debtor2 (-80k) trả u_creditor1 (+30k): 30k (u_creditor1 xong, u_debtor2 còn -50k)
      // u_debtor2 (-50k) trả u_creditor2 (+50k): 50k (cả hai xong)
      expect(transactions).toEqual([
        {
          id: 'settle_u_debtor1_u_creditor1',
          fromUserId: 'u_debtor1',
          toUserId: 'u_creditor1',
          amount: 120000,
          status: 'PENDING'
        },
        {
          id: 'settle_u_debtor2_u_creditor1',
          fromUserId: 'u_debtor2',
          toUserId: 'u_creditor1',
          amount: 30000,
          status: 'PENDING'
        },
        {
          id: 'settle_u_debtor2_u_creditor2',
          fromUserId: 'u_debtor2',
          toUserId: 'u_creditor2',
          amount: 50000,
          status: 'PENDING'
        }
      ]);

      // Tổng số tiền luân chuyển đúng bằng 200,000đ
      const totalTransferred = transactions.reduce((sum, t) => sum + t.amount, 0);
      expect(totalTransferred).toBe(200000);
    });

    it('trả về mảng rỗng khi tất cả thành viên đã cân bằng (balance = 0)', () => {
      const memberTotals = {
        u1: { userId: 'u1', balance: 0 },
        u2: { userId: 'u2', balance: 0 }
      };

      const transactions = optimizeSettlements(memberTotals);
      expect(transactions).toEqual([]);
    });

    it('xử lý chính xác trường hợp 1 người bao toàn bộ chi phí', () => {
      const memberTotals = {
        u_host: { userId: 'u_host', balance: 90000 },
        u_guest1: { userId: 'u_guest1', balance: -30000 },
        u_guest2: { userId: 'u_guest2', balance: -30000 },
        u_guest3: { userId: 'u_guest3', balance: -30000 }
      };

      const transactions = optimizeSettlements(memberTotals);
      expect(transactions).toHaveLength(3);
      transactions.forEach(t => {
        expect(t.toUserId).toBe('u_host');
        expect(t.amount).toBe(30000);
      });
    });
  });

  describe('reconcileSettlements (Đồng bộ kế hoạch trả nợ với dữ liệu DB)', () => {
    it('bảo tồn trạng thái PAID và thông tin xác nhận từ settlement cũ', () => {
      const optimizedSettlements = [
        { id: 'settle_u1_u2', fromUserId: 'u1', toUserId: 'u2', amount: 50000, status: 'PENDING' }
      ];

      const existingSettlements = [
        {
          id: 'settle_existing_123',
          fromUserId: 'u1',
          toUserId: 'u2',
          amount: 50000,
          status: 'PAID',
          paidAt: '2026-03-01T10:00:00Z',
          proofUrl: 'https://example.com/receipt.jpg'
        }
      ];

      const memberMap = {
        u1: { userId: 'u1', displayName: 'Người Trả' },
        u2: {
          userId: 'u2',
          displayName: 'Người Nhận',
          bankName: 'MBBANK',
          bankAccountNumber: '99998888'
        }
      };

      const reconciled = reconcileSettlements(optimizedSettlements, existingSettlements, memberMap);

      expect(reconciled).toHaveLength(1);
      const item = reconciled[0];
      // Phải bảo tồn ID và trạng thái PAID
      expect(item.id).toBe('settle_existing_123');
      expect(item.status).toBe('PAID');
      expect(item.paidAt).toBe('2026-03-01T10:00:00Z');
      expect(item.proofUrl).toBe('https://example.com/receipt.jpg');
      // Kèm thông tin tài khoản ngân hàng của người nhận
      expect(item.toUser.bankName).toBe('MBBANK');
      expect(item.toUser.bankAccountNumber).toBe('99998888');
    });

    it('tạo settlement mới với status PENDING khi chưa từng thanh toán trong DB', () => {
      const optimized = [
        { id: 'settle_a_b', fromUserId: 'a', toUserId: 'b', amount: 100000, status: 'PENDING' }
      ];

      const reconciled = reconcileSettlements(optimized, [], {});
      expect(reconciled).toHaveLength(1);
      expect(reconciled[0].status).toBe('PENDING');
      expect(reconciled[0].paidAt).toBeNull();
      expect(reconciled[0].confirmedAt).toBeNull();
      expect(reconciled[0].createdAt).toBeDefined();
    });
  });

  describe('generateVietQRUrl (Tạo mã thanh toán VietQR tiêu chuẩn)', () => {
    it('sinh đúng URL ảnh VietQR chuẩn khi có đủ tên ngân hàng và số tài khoản', () => {
      const qrUrl = generateVietQRUrl({
        bankName: 'vietcombank ',
        bankAccountNumber: ' 0123456789 ',
        bankAccountHolder: 'nguyen van a',
        amount: 250000,
        tripName: 'Chuyến đi Đà Lạt'
      });

      expect(qrUrl).toBeDefined();
      expect(qrUrl).toContain('https://img.vietqr.io/image/VIETCOMBANK-0123456789-compact2.png');
      expect(qrUrl).toContain('amount=250000');
      expect(qrUrl).toContain('accountName=NGUYEN%20VAN%20A');
      expect(qrUrl).toContain('addInfo=Spliqo%20Chuy%E1%BA%BFn%20%C4%91i%20%C4%90%C3%A0%20L%E1%BA%A1t');
    });

    it('trả về null nếu thiếu tên ngân hàng hoặc số tài khoản', () => {
      expect(
        generateVietQRUrl({
          bankName: '',
          bankAccountNumber: '0123456789',
          amount: 50000
        })
      ).toBeNull();

      expect(
        generateVietQRUrl({
          bankName: 'TCB',
          bankAccountNumber: '',
          amount: 50000
        })
      ).toBeNull();

      expect(
        generateVietQRUrl({
          amount: 50000
        })
      ).toBeNull();
    });
  });
});
