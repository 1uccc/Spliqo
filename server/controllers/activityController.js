import { dbService } from '../services/dbService.js';

export async function getTripActivities(req, res) {
  try {
    const { tripId } = req.params;
    const currentUserId = req.user.uid;
    const { filter, search } = req.query;

    const trip = dbService.getTrip(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Không tìm thấy chuyến đi.' });
    }

    const members = dbService.getTripMembers(tripId);
    const isMember = members.some(m => (m.userId || m.uid || m.id) === currentUserId) || trip.createdBy === currentUserId;
    if (!isMember) {
      return res.status(403).json({ error: 'Bạn không có quyền xem lịch sử của chuyến đi này.' });
    }

    // 1. Get explicitly recorded activities
    const storedActivities = dbService.getTripActivities(tripId) || [];

    // 2. Synthesize activities from existing expenses for backwards compatibility
    const synthesized = [];
    const expenses = dbService.getTripExpenses(tripId) || [];

    for (const exp of expenses) {
      const creatorUser = dbService.getUser(exp.createdBy);
      const payerUser = dbService.getUser(exp.paidBy);
      const payerName = payerUser?.displayName || 'Thành viên';
      const creatorName = creatorUser?.displayName || 'Thành viên';

      // Check if create is already recorded
      const alreadyHasCreate = storedActivities.some(
        a => a.expenseId === exp.id && (a.type === 'EXPENSE_CREATED' || a.action === 'CREATE')
      );

      if (!alreadyHasCreate) {
        synthesized.push({
          id: `act_exp_create_${exp.id}`,
          type: 'EXPENSE_CREATED',
          action: 'CREATE',
          expenseId: exp.id,
          title: exp.title,
          amount: exp.amount,
          currency: exp.currency || 'VND',
          paidBy: exp.paidBy,
          paidByName: payerName,
          splitType: exp.splitType || 'equal',
          participantCount: exp.participants?.length || 0,
          authorId: exp.createdBy || 'unknown',
          authorName: creatorName,
          authorPhotoURL: creatorUser?.photoURL || '',
          timestamp: exp.createdAt || exp.date || trip.createdAt,
          description: `Đã thêm khoản chi "${exp.title}" (${new Intl.NumberFormat('vi-VN').format(exp.amount)}đ)`
        });
      }

      // Check expense edit history
      if (Array.isArray(exp.history)) {
        for (const h of exp.history) {
          if (h.action === 'CREATE') continue; // already handled
          const alreadyHasEdit = storedActivities.some(a => a.id === h.id);
          if (!alreadyHasEdit) {
            synthesized.push({
              id: h.id || `act_hist_${exp.id}_${h.timestamp}`,
              type: 'EXPENSE_UPDATED',
              action: 'UPDATE',
              expenseId: exp.id,
              title: exp.title,
              amount: exp.amount,
              authorId: h.authorId,
              authorName: h.authorName || 'Thành viên',
              authorPhotoURL: h.authorPhotoURL || '',
              timestamp: h.timestamp,
              description: h.description || `Đã cập nhật khoản chi "${exp.title}"`,
              changes: h.changes || [],
              diffs: h.diffs || []
            });
          }
        }
      }
    }

    // Combine and deduplicate by id
    const combinedMap = new Map();
    [...storedActivities, ...synthesized].forEach(item => {
      if (!combinedMap.has(item.id)) {
        combinedMap.set(item.id, item);
      }
    });

    let list = Array.from(combinedMap.values());

    // Filter by type if requested
    if (filter && filter !== 'ALL') {
      if (filter === 'EXPENSE') {
        list = list.filter(a => a.type?.startsWith('EXPENSE_'));
      } else if (filter === 'MEMBER') {
        list = list.filter(a => a.type?.startsWith('MEMBER_'));
      } else if (filter === 'SETTLEMENT') {
        list = list.filter(a => a.type?.startsWith('SETTLEMENT_'));
      } else {
        list = list.filter(a => a.type === filter || a.action === filter);
      }
    }

    // Search query
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(a => 
        (a.title && a.title.toLowerCase().includes(q)) ||
        (a.description && a.description.toLowerCase().includes(q)) ||
        (a.authorName && a.authorName.toLowerCase().includes(q)) ||
        (Array.isArray(a.changes) && a.changes.some(c => c.toLowerCase().includes(q)))
      );
    }

    // Sort by timestamp descending (newest first)
    list.sort((a, b) => {
      const timeA = new Date(a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp || 0).getTime();
      return timeB - timeA;
    });

    return res.json({
      tripId,
      totalCount: list.length,
      activities: list
    });
  } catch (err) {
    console.error('[getTripActivities] Error:', err);
    return res.status(500).json({ error: 'Lỗi khi tải lịch sử chỉnh sửa của chuyến đi.' });
  }
}
