import { dbService } from '../services/dbService.js';
import { realtimeService } from '../services/realtimeService.js';
import { calculateMemberTotals } from '../services/calculationService.js';
import { optimizeSettlements, reconcileSettlements } from '../services/settlementService.js';

export async function markAsPaid(req, res) {
  try {
    const { tripId, settlementId } = req.params;
    const currentUserId = req.user.uid;
    const { fromUserId, toUserId, amount, proofImageUrl, note } = req.body;

    const trip = dbService.getTrip(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Không tìm thấy chuyến đi.' });
    }

    // Permission check: strictly debtor (payer)
    const list = dbService.getTripSettlements(tripId);
    const existing = list.find(s => s.id === settlementId);
    const actualFromUserId = existing?.fromUserId || fromUserId;

    if (actualFromUserId && String(actualFromUserId) !== String(currentUserId)) {
      return res.status(403).json({ error: 'Chỉ người nợ (người chuyển tiền) của khoản này mới có quyền xác nhận đã chuyển.' });
    }

    const updated = dbService.saveSettlement(tripId, {
      id: settlementId,
      fromUserId: actualFromUserId,
      toUserId: existing?.toUserId || toUserId,
      amount: Math.round(Number(amount || existing?.amount) || 0),
      status: 'PAID',
      paidAt: new Date().toISOString(),
      proofImageUrl: proofImageUrl || '',
      note: note || '',
    });

    const payerName = req.user.displayName || 'Một thành viên';
    const recipientUser = dbService.getUser(existing?.toUserId || toUserId);
    const recipientName = recipientUser?.displayName || 'Người nhận';
    const formattedAmount = (Math.round(Number(amount || existing?.amount) || 0)).toLocaleString('vi-VN') + 'đ';

    dbService.addTripActivity(tripId, {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'SETTLEMENT_PAID',
      action: 'SETTLE_PAY',
      settlementId,
      amount: updated.amount,
      authorId: currentUserId,
      authorName: payerName,
      authorPhotoURL: req.user.photoURL || '',
      timestamp: updated.paidAt,
      description: `${payerName} đã đánh dấu chuyển khoản ${formattedAmount} cho ${recipientName}`
    });

    // Notify the recipient about the payment awaiting confirmation
    const targetRecipientId = existing?.toUserId || toUserId;
    if (targetRecipientId && targetRecipientId !== currentUserId) {
      const payerName = req.user.displayName || 'Một thành viên';
      const formattedAmount = (Math.round(Number(amount || existing?.amount) || 0)).toLocaleString('vi-VN') + 'đ';
      dbService.addNotification(targetRecipientId, {
        type: 'PAYMENT_PAID',
        title: 'Chờ xác nhận thanh toán',
        message: `${payerName} vừa đánh dấu đã chuyển ${formattedAmount} cho bạn trong "${trip.name}". Hãy kiểm tra tài khoản và xác nhận.`,
        link: `/settlements`,
        actor: {
          uid: currentUserId,
          displayName: req.user.displayName,
          photoURL: req.user.photoURL,
        }
      });
    }

    try {
      realtimeService.broadcastToTrip(tripId, 'SETTLEMENT_UPDATED', {
        settlementId,
        status: 'PAID',
        settlement: updated,
        actor: {
          uid: currentUserId,
          displayName: req.user.displayName || 'Một thành viên'
        }
      });
    } catch (e) {
      console.warn('[markAsPaid] Realtime broadcast error:', e.message);
    }

    return res.json({
      success: true,
      message: 'Đã đánh dấu đã thanh toán. Đang chờ người nhận xác nhận.',
      settlement: updated
    });
  } catch (err) {
    console.error('[markAsPaid] Error:', err);
    return res.status(500).json({ error: 'Lỗi khi cập nhật trạng thái thanh toán.' });
  }
}

export async function confirmPayment(req, res) {
  try {
    const { tripId, settlementId } = req.params;
    const currentUserId = req.user.uid;
    const { toUserId } = req.body;

    const trip = dbService.getTrip(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Không tìm thấy chuyến đi.' });
    }

    // Permission check: strictly recipient (receiver)
    const list = dbService.getTripSettlements(tripId);
    const existing = list.find(s => s.id === settlementId);
    const actualToUserId = existing?.toUserId || toUserId;

    if (actualToUserId && String(actualToUserId) !== String(currentUserId)) {
      return res.status(403).json({ error: 'Chỉ người nhận tiền của khoản này mới có quyền xác nhận đã nhận tiền.' });
    }

    const updated = dbService.updateSettlementStatus(tripId, settlementId, 'CONFIRMED', {
      confirmedAt: new Date().toISOString()
    });

    if (!updated) {
      return res.status(404).json({ error: 'Không tìm thấy khoản thanh toán để xác nhận.' });
    }

    const payerUser = dbService.getUser(updated.fromUserId);
    const payerName = payerUser?.displayName || 'Người chuyển';
    const receiverName = req.user.displayName || 'Người nhận';
    const formattedAmount = (Math.round(Number(updated.amount) || 0)).toLocaleString('vi-VN') + 'đ';

    dbService.addTripActivity(tripId, {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'SETTLEMENT_CONFIRMED',
      action: 'SETTLE_CONFIRM',
      settlementId,
      amount: updated.amount,
      authorId: currentUserId,
      authorName: receiverName,
      authorPhotoURL: req.user.photoURL || '',
      timestamp: new Date().toISOString(),
      description: `${receiverName} đã xác nhận nhận đủ ${formattedAmount} từ ${payerName}`
    });

    // Notify the payer that payment was confirmed
    const payerId = updated.fromUserId;
    if (payerId && payerId !== currentUserId) {
      const receiverName = req.user.displayName || 'Người nhận';
      const formattedAmount = (Math.round(Number(updated.amount) || 0)).toLocaleString('vi-VN') + 'đ';
      dbService.addNotification(payerId, {
        type: 'PAYMENT_CONFIRMED',
        title: 'Thanh toán đã được xác nhận',
        message: `${receiverName} đã xác nhận đã nhận đủ ${formattedAmount} trong chuyến đi "${trip.name}".`,
        link: `/settlements`,
        actor: {
          uid: currentUserId,
          displayName: req.user.displayName,
          photoURL: req.user.photoURL,
        }
      });
    }

    try {
      realtimeService.broadcastToTrip(tripId, 'SETTLEMENT_UPDATED', {
        settlementId,
        status: 'CONFIRMED',
        settlement: updated,
        actor: {
          uid: currentUserId,
          displayName: req.user.displayName || 'Người nhận'
        }
      });
    } catch (e) {
      console.warn('[confirmPayment] Realtime broadcast error:', e.message);
    }

    return res.json({
      success: true,
      message: 'Xác nhận thanh toán thành công! Khoản nợ đã được tất toán hoàn tất.',
      settlement: updated
    });
  } catch (err) {
    console.error('[confirmPayment] Error:', err);
    return res.status(500).json({ error: 'Lỗi khi xác nhận thanh toán.' });
  }
}

export async function getSettlementHistory(req, res) {
  try {
    const { tripId } = req.params;
    const history = dbService.getTripSettlements(tripId);
    return res.json(history);
  } catch (err) {
    console.error('[getSettlementHistory] Error:', err);
    return res.status(500).json({ error: 'Lỗi khi lấy lịch sử thanh toán.' });
  }
}

export async function nudgeDebtor(req, res) {
  try {
    const { tripId, settlementId } = req.params;
    const currentUserId = req.user.uid;
    const { message, tone } = req.body || {};

    const trip = dbService.getTrip(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Không tìm thấy chuyến đi.' });
    }

    const members = dbService.getTripMembers(tripId);
    const expenses = dbService.getTripExpenses(tripId);
    const { memberTotals } = calculateMemberTotals(expenses, members);
    const optimized = optimizeSettlements(memberTotals);
    const existingSettlements = dbService.getTripSettlements(tripId);
    const memberMap = {};
    members.forEach(m => { memberMap[m.userId] = m; });
    const reconciled = reconcileSettlements(optimized, existingSettlements, memberMap);

    const settlement = existingSettlements.find(s => s.id === settlementId)
      || reconciled.find(s => s.id === settlementId)
      || reconciled.find(s => `${s.fromUserId}_${s.toUserId}` === settlementId);

    if (!settlement) {
      return res.status(404).json({ error: 'Không tìm thấy khoản công nợ này.' });
    }

    // Permission check: strictly recipient (toUser) or trip creator
    const isReceiver = String(settlement.toUserId) === String(currentUserId);
    const isCreator = String(trip.creatorId || trip.createdBy) === String(currentUserId);
    if (!isReceiver && !isCreator) {
      return res.status(403).json({ error: 'Chỉ người được nhận tiền hoặc trưởng nhóm mới có quyền nhắc chuyển khoản.' });
    }

    if (settlement.status === 'CONFIRMED') {
      return res.status(400).json({ error: 'Khoản nợ này đã được thanh toán và chốt sổ hoàn tất.' });
    }

    // Anti-spam debounce: minimum 20 seconds between nudges
    const now = Date.now();
    if (settlement.lastNudgedAt) {
      const elapsed = now - new Date(settlement.lastNudgedAt).getTime();
      if (elapsed < 20 * 1000) {
        const remainingSec = Math.ceil((20 * 1000 - elapsed) / 1000);
        return res.status(429).json({
          error: `Bạn vừa gửi lời nhắc. Vui lòng đợi ${remainingSec}s trước khi nhắc lại nhé!`
        });
      }
    }

    const debtorId = settlement.fromUserId;
    const creditorUser = dbService.getUser(currentUserId);
    const creditorName = creditorUser?.displayName || req.user.displayName || 'Bạn bè';
    const formattedAmount = (Math.round(Number(settlement.amount) || 0)).toLocaleString('vi-VN') + 'đ';

    const notifMessage = message && message.trim()
      ? message.trim()
      : `${creditorName} vừa gửi lời nhắc chuyển khoản ${formattedAmount} cho chuyến đi "${trip.name}". Mở Spliqo để thanh toán qua VietQR nhé!`;

    const updated = dbService.saveSettlement(tripId, {
      ...settlement,
      id: settlement.id || settlementId,
      lastNudgedAt: new Date().toISOString(),
      nudgeCount: (settlement.nudgeCount || 0) + 1
    });

    const notification = dbService.addNotification(debtorId, {
      type: 'PAYMENT_NUDGE',
      title: 'Nhắc chuyển khoản nhẹ nhàng 💸',
      message: notifMessage,
      link: `/settlements`,
      actor: {
        uid: currentUserId,
        displayName: creditorName,
        photoURL: creditorUser?.photoURL || req.user.photoURL || '',
      },
      metadata: {
        tripId,
        settlementId: updated.id,
        amount: settlement.amount,
        tone: tone || 'gentle'
      }
    });

    try {
      realtimeService.broadcastToTrip(tripId, 'SETTLEMENT_NUDGED', {
        settlementId: updated.id,
        debtorId,
        actor: {
          uid: currentUserId,
          displayName: creditorName
        },
        message: notifMessage
      });
    } catch (e) {
      console.warn('[nudgeDebtor] Realtime broadcast error:', e.message);
    }

    return res.json({
      success: true,
      message: 'Đã gửi lời nhắc chuyển khoản thành công!',
      settlement: updated,
      notification
    });
  } catch (err) {
    console.error('[nudgeDebtor] Error:', err);
    return res.status(500).json({ error: 'Lỗi khi gửi lời nhắc thanh toán.' });
  }
}

