import { dbService } from '../services/dbService.js';
import { calculateMemberTotals, calculateBalances } from '../services/calculationService.js';
import { optimizeSettlements, reconcileSettlements } from '../services/settlementService.js';
import { realtimeService } from '../services/realtimeService.js';

function generateTripCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createTrip(req, res) {
  try {
    const { name, description = '', startDate = '', endDate = '', budget = null } = req.body;
    const userId = req.user.uid;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Tên chuyến đi/nhóm (Trip Name) không được để trống.' });
    }

    const tripId = `trip_${Date.now()}`;
    const tripCode = generateTripCode();

    const newTrip = {
      id: tripId,
      name: name.trim(),
      description: description.trim(),
      tripCode,
      createdBy: userId,
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      budget: budget || null,
      createdAt: new Date().toISOString()
    };

    dbService.createTrip(newTrip);
    dbService.addMemberToTrip(tripId, userId, 'Creator');

    return res.status(201).json(newTrip);
  } catch (err) {
    console.error('[createTrip] Error:', err);
    return res.status(500).json({ error: 'Không thể tạo chuyến đi mới.' });
  }
}

export async function getTrips(req, res) {
  try {
    const userId = req.user.uid;
    const trips = dbService.getTripsForUser(userId);

    // Enrich trips with counts and totals
    const enrichedTrips = trips.map(trip => {
      const members = dbService.getTripMembers(trip.id);
      const expenses = dbService.getTripExpenses(trip.id);
      let totalAmount = 0;
      expenses.forEach(e => {
        totalAmount += Math.round(Number(e.amount) || 0);
      });

      return {
        ...trip,
        memberCount: members.length,
        expenseCount: expenses.length,
        totalExpense: totalAmount
      };
    });

    return res.json(enrichedTrips);
  } catch (err) {
    console.error('[getTrips] Error:', err);
    return res.status(500).json({ error: 'Lỗi khi lấy danh sách chuyến đi.' });
  }
}

export async function getTripById(req, res) {
  try {
    const { tripId } = req.params;
    const userId = req.user.uid;

    const trip = dbService.getTrip(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Không tìm thấy chuyến đi.' });
    }

    const members = dbService.getTripMembers(tripId);
    const isMember = members.some(m => m.userId === userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập chuyến đi này.' });
    }

    const expenses = dbService.getTripExpenses(tripId);
    let calc = { totalExpense: 0, memberTotals: {}, invariantsSatisfied: true };
    try {
      calc = calculateMemberTotals(expenses, members);
    } catch (e) {
      console.warn('[getTripById] Calc notice:', e.message);
    }

    return res.json({
      ...trip,
      members,
      expenses,
      summary: calc
    });
  } catch (err) {
    console.error('[getTripById] Error:', err);
    return res.status(500).json({ error: 'Lỗi khi tải chi tiết chuyến đi.' });
  }
}

export async function updateTrip(req, res) {
  try {
    const { tripId } = req.params;
    const userId = req.user.uid;
    const { name, description, startDate, endDate, status, budget } = req.body;

    const trip = dbService.getTrip(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Không tìm thấy chuyến đi.' });
    }

    const members = dbService.getTripMembers(tripId);
    const isMember = members.some(m => (m.userId || m.uid || m.id) === userId) || trip.createdBy === userId;
    if (!isMember) {
      return res.status(403).json({ error: 'Bạn không phải là thành viên của chuyến đi này.' });
    }

    // Only creator can complete or change trip status
    if (status && trip.createdBy !== userId) {
      return res.status(403).json({ error: 'Chỉ người tạo chuyến đi mới có quyền chốt sổ chuyến đi.' });
    }

    if (status === 'COMPLETED') {
      const unsettledDebts = getUnsettledDebts(tripId);
      if (unsettledDebts.length > 0) {
        return res.status(400).json({
          error: `Chưa thể chốt sổ: Vẫn còn ${unsettledDebts.length} khoản công nợ chưa được thanh toán hoặc xác nhận.`
        });
      }
    }

    const updated = dbService.updateTrip(tripId, {
      ...(name ? { name: name.trim() } : {}),
      ...(description !== undefined ? { description: description.trim() } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
      ...(status ? { status } : {}),
      ...(budget !== undefined ? { budget } : {}),
    });

    try {
      realtimeService.broadcastToTrip(tripId, 'TRIP_UPDATED', {
        tripId,
        trip: updated
      });
    } catch (e) {
      console.warn('[updateTrip] Realtime broadcast error:', e.message);
    }

    return res.json(updated);
  } catch (err) {
    console.error('[updateTrip] Error:', err);
    return res.status(500).json({ error: 'Lỗi khi cập nhật chuyến đi.' });
  }
}

export async function deleteTrip(req, res) {
  try {
    const { tripId } = req.params;
    const userId = req.user.uid;

    const trip = dbService.getTrip(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Không tìm thấy chuyến đi.' });
    }

    if (trip.createdBy !== userId) {
      return res.status(403).json({ error: 'Chỉ người tạo chuyến đi mới có quyền xóa chuyến đi.' });
    }

    dbService.deleteTrip(tripId);
    return res.json({ success: true, message: 'Đã xóa chuyến đi thành công.' });
  } catch (err) {
    console.error('[deleteTrip] Error:', err);
    return res.status(500).json({ error: 'Lỗi khi xóa chuyến đi.' });
  }
}

export async function getTripInvitePreview(req, res) {
  try {
    const { tripCode } = req.params;
    if (!tripCode || !tripCode.trim()) {
      return res.status(400).json({ error: 'Mã chuyến đi không hợp lệ.' });
    }

    const trip = dbService.getTripByCode(tripCode);
    if (!trip) {
      return res.status(404).json({ error: 'Không tìm thấy chuyến đi tương ứng với mã mời này.' });
    }

    const creatorUser = dbService.getUser(trip.createdBy);
    const members = dbService.getTripMembers(trip.id);
    const currentUserId = req.user?.uid;
    const isMember = currentUserId ? members.some(m => m.userId === currentUserId) : false;

    return res.json({
      trip: {
        id: trip.id,
        name: trip.name,
        description: trip.description || '',
        startDate: trip.startDate,
        endDate: trip.endDate,
        status: trip.status || 'ACTIVE',
        tripCode: trip.tripCode,
        createdAt: trip.createdAt
      },
      creator: {
        displayName: creatorUser?.displayName || 'Trưởng nhóm',
        photoURL: creatorUser?.photoURL || ''
      },
      memberCount: members.length,
      membersPreview: members.slice(0, 5).map(m => ({
        displayName: m.displayName || 'Thành viên',
        photoURL: m.photoURL || ''
      })),
      isMember
    });
  } catch (err) {
    console.error('[getTripInvitePreview] Error:', err);
    return res.status(500).json({ error: 'Lỗi khi lấy thông tin lời mời tham gia.' });
  }
}

export async function joinTrip(req, res) {
  try {
    const { tripCode } = req.body;
    const userId = req.user.uid;

    if (!tripCode || !tripCode.trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập mã chuyến đi (Trip Code).' });
    }

    const trip = dbService.getTripByCode(tripCode);
    if (!trip) {
      return res.status(404).json({ error: 'Trip code not found. Không tìm thấy chuyến đi với mã này.' });
    }

    const members = dbService.getTripMembers(trip.id);
    const alreadyMember = members.some(m => m.userId === userId);
    if (alreadyMember) {
      return res.json({
        success: true,
        alreadyMember: true,
        message: `Bạn đã là thành viên của chuyến đi ${trip.name}.`,
        trip
      });
    }

    dbService.addMemberToTrip(trip.id, userId, 'Member');

    dbService.addTripActivity(trip.id, {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'MEMBER_JOINED',
      action: 'JOIN',
      authorId: userId,
      authorName: req.user.displayName || 'Thành viên mới',
      authorPhotoURL: req.user.photoURL || '',
      timestamp: new Date().toISOString(),
      description: `"${req.user.displayName || 'Thành viên mới'}" đã tham gia chuyến đi`
    });

    try {
      if (trip.createdBy && trip.createdBy !== userId) {
        dbService.addNotification(trip.createdBy, {
          type: 'TRIP_INVITE',
          title: 'Thành viên mới tham gia',
          message: `${req.user.displayName || 'Một thành viên'} vừa tham gia chuyến đi "${trip.name}" của bạn.`,
          link: `/trips/${trip.id}`,
          actor: {
            uid: userId,
            displayName: req.user.displayName,
            photoURL: req.user.photoURL,
          }
        });
      }
    } catch (e) {
      console.warn('[joinTrip] Notification error:', e.message);
    }

    try {
      realtimeService.broadcastToTrip(trip.id, 'MEMBER_UPDATED', {
        tripId: trip.id,
        action: 'JOINED',
        user: {
          uid: userId,
          displayName: req.user.displayName,
          photoURL: req.user.photoURL
        }
      });
    } catch (e) {
      console.warn('[joinTrip] Realtime broadcast error:', e.message);
    }

    return res.json({
      success: true,
      message: `You joined ${trip.name}. Tham gia thành công!`,
      trip
    });
  } catch (err) {
    console.error('[joinTrip] Error:', err);
    return res.status(500).json({ error: 'Lỗi khi tham gia chuyến đi.' });
  }
}

function getUnsettledDebts(tripId) {
  const members = dbService.getTripMembers(tripId);
  const expenses = dbService.getTripExpenses(tripId);
  const { memberTotals } = calculateMemberTotals(expenses, members);
  const optimized = optimizeSettlements(memberTotals);
  const existingSettlements = dbService.getTripSettlements(tripId);

  const memberMap = {};
  members.forEach(m => {
    memberMap[m.userId] = m;
  });

  const reconciled = reconcileSettlements(optimized, existingSettlements, memberMap);
  return reconciled.filter(s => s.status !== 'CONFIRMED');
}

export async function completeTrip(req, res) {
  try {
    const { tripId } = req.params;
    const userId = req.user.uid;

    const trip = dbService.getTrip(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Không tìm thấy chuyến đi.' });
    }

    if (trip.createdBy !== userId) {
      return res.status(403).json({ error: 'Chỉ người tạo chuyến đi mới có quyền chốt sổ hoàn thành.' });
    }

    if (trip.status === 'COMPLETED') {
      return res.json({
        success: true,
        message: 'Chuyến đi đã được chốt sổ hoàn tất.',
        trip
      });
    }

    // Condition: All debts must be settled and confirmed
    const unsettledDebts = getUnsettledDebts(tripId);
    if (unsettledDebts.length > 0) {
      return res.status(400).json({
        error: `Chưa thể chốt sổ chuyến đi: Vẫn còn ${unsettledDebts.length} khoản công nợ chưa được thanh toán hoặc xác nhận. Tất cả thành viên phải hoàn tất thanh toán trước khi chốt sổ.`,
        unsettledCount: unsettledDebts.length,
        unsettledDebts: unsettledDebts.map(s => ({
          id: s.id,
          fromUserId: s.fromUserId,
          fromUserName: s.fromUser?.displayName || 'Thành viên',
          toUserId: s.toUserId,
          toUserName: s.toUser?.displayName || 'Thành viên',
          amount: s.amount,
          status: s.status
        }))
      });
    }

    const updated = dbService.updateTrip(tripId, { status: 'COMPLETED' });

    dbService.addTripActivity(tripId, {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'TRIP_COMPLETED',
      action: 'COMPLETE',
      authorId: userId,
      authorName: req.user?.displayName || 'Trưởng nhóm',
      authorPhotoURL: req.user?.photoURL || '',
      timestamp: new Date().toISOString(),
      description: 'Chuyến đi đã được chốt sổ thành công. Toàn bộ công nợ đã được tất toán!'
    });

    try {
      realtimeService.broadcastToTrip(tripId, 'TRIP_UPDATED', {
        tripId,
        status: 'COMPLETED',
        trip: updated
      });
    } catch (e) {
      console.warn('[completeTrip] Realtime broadcast error:', e.message);
    }

    return res.json({
      success: true,
      message: 'Chúc mừng! Chuyến đi đã chốt sổ thành công. Toàn bộ công nợ đã được tất toán.',
      trip: updated
    });
  } catch (err) {
    console.error('[completeTrip] Error:', err);
    return res.status(500).json({ error: 'Lỗi khi hoàn thành chuyến đi.' });
  }
}
