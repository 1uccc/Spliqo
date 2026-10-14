import { dbService } from '../services/dbService.js';
import { calculateMemberTotals, calculateBalances } from '../services/calculationService.js';
import { optimizeSettlements, reconcileSettlements } from '../services/settlementService.js';

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
    const { name, description = '', startDate = '', endDate = '' } = req.body;
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
    const { name, description, startDate, endDate, status } = req.body;

    const trip = dbService.getTrip(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Không tìm thấy chuyến đi.' });
    }

    if (trip.createdBy !== userId) {
      return res.status(403).json({ error: 'Chỉ người tạo chuyến đi mới có quyền chỉnh sửa thông tin.' });
    }

    const updated = dbService.updateTrip(tripId, {
      ...(name ? { name: name.trim() } : {}),
      ...(description !== undefined ? { description: description.trim() } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
      ...(status ? { status } : {}),
    });

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
      return res.status(400).json({ error: 'You are already a member of this trip. Bạn đã là thành viên của chuyến đi này.' });
    }

    dbService.addMemberToTrip(trip.id, userId, 'Member');

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

export async function completeTrip(req, res) {
  try {
    const { tripId } = req.params;
    const userId = req.user.uid;

    const trip = dbService.getTrip(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Không tìm thấy chuyến đi.' });
    }

    if (trip.createdBy !== userId) {
      return res.status(403).json({ error: 'Chỉ người tạo chuyến đi mới có thể đánh dấu hoàn thành.' });
    }

    const updated = dbService.updateTrip(tripId, { status: 'COMPLETED' });
    return res.json({
      success: true,
      message: 'Chuyến đi đã được đánh dấu hoàn thành. Đã chốt chi phí và chuyển sang giai đoạn thanh toán.',
      trip: updated
    });
  } catch (err) {
    console.error('[completeTrip] Error:', err);
    return res.status(500).json({ error: 'Lỗi khi hoàn thành chuyến đi.' });
  }
}
