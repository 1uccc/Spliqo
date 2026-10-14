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

    // Permission check: only the debtor (payer) can mark as paid
    if (fromUserId && fromUserId !== currentUserId) {
      return res.status(403).json({ error: 'Chỉ người chuyển tiền mới có thể đánh dấu đã thanh toán (Mark as Paid).' });
    }

    const updated = dbService.saveSettlement(tripId, {
      id: settlementId,
      fromUserId,
      toUserId,
      amount: Math.round(Number(amount) || 0),
      status: 'PAID',
      paidAt: new Date().toISOString(),
      proofImageUrl: proofImageUrl || '',
      note: note || '',
    });

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

    // Permission check: only the recipient can confirm they received money!
    if (toUserId && toUserId !== currentUserId) {
      return res.status(403).json({ error: 'Chỉ người nhận tiền mới có quyền xác nhận đã nhận được tiền (Confirm Payment).' });
    }

    const updated = dbService.updateSettlementStatus(tripId, settlementId, 'CONFIRMED', {
      confirmedAt: new Date().toISOString()
    });

    if (!updated) {
      return res.status(404).json({ error: 'Không tìm thấy khoản thanh toán để xác nhận.' });
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
