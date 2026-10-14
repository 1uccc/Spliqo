import { dbService } from '../services/dbService.js';

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
