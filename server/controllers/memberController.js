import { dbService } from '../services/dbService.js';
import { realtimeService } from '../services/realtimeService.js';

export async function getMembers(req, res) {
  try {
    const { tripId } = req.params;
    const currentUserId = req.user.uid;

    const trip = dbService.getTrip(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Không tìm thấy chuyến đi.' });
    }

    const members = dbService.getTripMembers(tripId);
    const isMember = members.some(m => m.userId === currentUserId);
    if (!isMember) {
      return res.status(403).json({ error: 'Bạn không có quyền xem danh sách thành viên của chuyến đi này.' });
    }

    return res.json(members);
  } catch (err) {
    console.error('[getMembers] Error:', err);
    return res.status(500).json({ error: 'Lỗi khi lấy danh sách thành viên.' });
  }
}

export async function removeMember(req, res) {
  try {
    const { tripId, userId: targetUserId } = req.params;
    const currentUserId = req.user.uid;

    const trip = dbService.getTrip(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Không tìm thấy chuyến đi.' });
    }

    if (trip.createdBy !== currentUserId && currentUserId !== targetUserId) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa thành viên này.' });
    }

    if (targetUserId === trip.createdBy) {
      return res.status(400).json({ error: 'Không thể xóa người tạo chuyến đi.' });
    }

    // Check if member has active expenses
    const expenses = dbService.getTripExpenses(tripId);
    const hasPayerExpense = expenses.some(e => e.paidBy === targetUserId);
    if (hasPayerExpense) {
      return res.status(400).json({
        error: 'Thành viên này đã từng thanh toán một số khoản chi trong chuyến đi. Không thể xóa để đảm bảo toàn vẹn dữ liệu sổ sách.'
      });
    }

    const targetUser = dbService.getUser(targetUserId);
    const updatedMembers = dbService.removeMemberFromTrip(tripId, targetUserId);

    dbService.addTripActivity(tripId, {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'MEMBER_REMOVED',
      action: 'REMOVE',
      targetUserId,
      targetUserName: targetUser?.displayName || 'Thành viên',
      authorId: currentUserId,
      authorName: req.user?.displayName || 'Thành viên',
      authorPhotoURL: req.user?.photoURL || '',
      timestamp: new Date().toISOString(),
      description: `Đã xóa thành viên "${targetUser?.displayName || 'Thành viên'}" khỏi chuyến đi`
    });

    try {
      realtimeService.broadcastToTrip(tripId, 'MEMBER_UPDATED', {
        tripId,
        action: 'REMOVED',
        userId: targetUserId
      });
    } catch (e) {
      console.warn('[removeMember] Realtime broadcast error:', e.message);
    }

    return res.json({ success: true, message: 'Đã xóa thành viên khỏi chuyến đi.', members: updatedMembers });
  } catch (err) {
    console.error('[removeMember] Error:', err);
    return res.status(500).json({ error: 'Lỗi khi xóa thành viên.' });
  }
}
