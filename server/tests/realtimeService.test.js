import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { realtimeService } from '../services/realtimeService.js';
import { EventEmitter } from 'events';

describe('realtimeService (Server-Sent Events Realtime Hub)', () => {
  beforeEach(() => {
    realtimeService.tripSubscribers.clear();
    realtimeService.userSubscribers.clear();
  });

  afterEach(() => {
    realtimeService.tripSubscribers.clear();
    realtimeService.userSubscribers.clear();
  });

  it('thiết lập đúng SSE headers và gửi handshake khi client kết nối', () => {
    const req = new EventEmitter();
    req.user = { uid: 'user_test_1' };
    req.query = { tripId: 'trip_123' };

    const writtenData = [];
    const res = {
      writeHead: vi.fn(),
      write: vi.fn((chunk) => writtenData.push(chunk))
    };

    realtimeService.handleStream(req, res);

    // Kiểm tra headers
    expect(res.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    }));

    // Kiểm tra handshake
    expect(res.write).toHaveBeenCalledWith('retry: 3000\n\n');
    const combinedOutput = writtenData.join('');
    expect(combinedOutput).toContain('event: connected');
    expect(combinedOutput).toContain('trip_123');
    expect(combinedOutput).toContain('user_test_1');

    // Kiểm tra lưu subscriber
    expect(realtimeService.userSubscribers.get('user_test_1')?.size).toBe(1);
    expect(realtimeService.tripSubscribers.get('trip_123')?.size).toBe(1);
  });

  it('broadcastToTrip gửi event tức thì đến các client của đúng chuyến đi', () => {
    const req1 = new EventEmitter();
    req1.user = { uid: 'u1' };
    req1.query = { tripId: 'trip_A' };
    const written1 = [];
    const res1 = { writeHead: vi.fn(), write: vi.fn((chunk) => written1.push(chunk)) };
    realtimeService.handleStream(req1, res1);

    const req2 = new EventEmitter();
    req2.user = { uid: 'u2' };
    req2.query = { tripId: 'trip_B' }; // Chuyến đi khác
    const written2 = [];
    const res2 = { writeHead: vi.fn(), write: vi.fn((chunk) => written2.push(chunk)) };
    realtimeService.handleStream(req2, res2);

    written1.length = 0;
    written2.length = 0;

    // Phát event EXPENSE_ADDED cho trip_A
    const expensePayload = {
      id: 'exp_999',
      title: 'Ăn tối lẩu bò',
      amount: 450000
    };
    const sent = realtimeService.broadcastToTrip('trip_A', 'EXPENSE_ADDED', { expense: expensePayload });

    expect(sent).toBe(1);

    // Client trip_A nhận được
    const out1 = written1.join('');
    expect(out1).toContain('event: EXPENSE_ADDED');
    expect(out1).toContain('Ăn tối lẩu bò');

    // Client trip_B không nhận được
    expect(written2.length).toBe(0);
  });

  it('sendToUser gửi thông báo trực tiếp đến người dùng cụ thể', () => {
    const req = new EventEmitter();
    req.user = { uid: 'u_target' };
    req.query = {};
    const written = [];
    const res = { writeHead: vi.fn(), write: vi.fn((chunk) => written.push(chunk)) };
    realtimeService.handleStream(req, res);

    written.length = 0;

    const notif = {
      id: 'notif_123',
      title: 'Xác nhận thanh toán',
      message: 'Alice đã nhận tiền'
    };
    realtimeService.sendToUser('u_target', 'NOTIFICATION_NEW', notif);

    const output = written.join('');
    expect(output).toContain('event: NOTIFICATION_NEW');
    expect(output).toContain('Alice đã nhận tiền');
  });

  it('tự động dọn dẹp subscriber khi client ngắt kết nối (req close)', () => {
    const req = new EventEmitter();
    req.user = { uid: 'u_cleanup' };
    req.query = { tripId: 'trip_cleanup' };
    const res = { writeHead: vi.fn(), write: vi.fn() };

    realtimeService.handleStream(req, res);
    expect(realtimeService.userSubscribers.has('u_cleanup')).toBe(true);
    expect(realtimeService.tripSubscribers.has('trip_cleanup')).toBe(true);

    // Client đóng kết nối
    req.emit('close');

    expect(realtimeService.userSubscribers.has('u_cleanup')).toBe(false);
    expect(realtimeService.tripSubscribers.has('trip_cleanup')).toBe(false);
  });
});
