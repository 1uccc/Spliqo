import { dbService } from '../services/dbService.js';
import { calculateExpenseShares } from '../services/calculationService.js';

export async function addExpense(req, res) {
  try {
    const { tripId } = req.params;
    const currentUserId = req.user.uid;
    const {
      title,
      amount,
      paidBy,
      participants = [],
      splitType = 'equal',
      individualAmounts = {},
      billImageUrl = '',
      note = '',
      date = ''
    } = req.body;

    const trip = dbService.getTrip(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Không tìm thấy chuyến đi.' });
    }

    if (trip.status === 'ARCHIVED') {
      return res.status(400).json({ error: 'Chuyến đi đã lưu trữ, không thể thêm khoản chi.' });
    }

    const members = dbService.getTripMembers(tripId);
    const memberIds = members.map(m => m.userId);

    // Validate membership
    if (!memberIds.includes(currentUserId)) {
      return res.status(403).json({ error: 'Bạn không phải là thành viên của chuyến đi này.' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập tên khoản chi (Expense Name).' });
    }

    const numAmount = Math.round(Number(amount) || 0);
    if (numAmount <= 0) {
      return res.status(400).json({ error: 'Số tiền chi tiêu phải lớn hơn 0.' });
    }

    if (!paidBy || !memberIds.includes(paidBy)) {
      return res.status(400).json({ error: 'Người thanh toán (Paid by) phải là một thành viên hợp lệ trong nhóm.' });
    }

    if (!participants || participants.length === 0) {
      return res.status(400).json({ error: 'Vui lòng chọn ít nhất một người tham gia chịu khoản chi này.' });
    }

    // Verify all participants are trip members
    const invalidParticipants = participants.filter(p => !memberIds.includes(p));
    if (invalidParticipants.length > 0) {
      return res.status(400).json({ error: 'Có người tham gia không thuộc danh sách thành viên của chuyến đi.' });
    }

    // Validate split logic
    try {
      calculateExpenseShares({
        amount: numAmount,
        paidBy,
        participants,
        splitType,
        individualAmounts
      });
    } catch (calcError) {
      return res.status(400).json({ error: calcError.message });
    }

    const newExpense = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      amount: numAmount,
      paidBy,
      participants,
      splitType,
      individualAmounts: splitType === 'custom' ? individualAmounts : {},
      billImageUrl: billImageUrl || '',
      note: (note || '').trim(),
      date: date || new Date().toISOString().split('T')[0],
      createdBy: currentUserId,
      createdAt: new Date().toISOString()
    };

    dbService.addExpense(tripId, newExpense);

    return res.status(201).json(newExpense);
  } catch (err) {
    console.error('[addExpense] Error:', err);
    return res.status(500).json({ error: 'Lỗi khi thêm khoản chi mới.' });
  }
}

export async function getExpenses(req, res) {
  try {
    const { tripId } = req.params;
    const { search, payer, sortBy = 'date', sortOrder = 'desc' } = req.query;

    let list = dbService.getTripExpenses(tripId);

    // Search filter
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(e => 
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.note && e.note.toLowerCase().includes(q))
      );
    }

    // Payer filter
    if (payer && payer.trim()) {
      list = list.filter(e => e.paidBy === payer.trim());
    }

    // Sorting
    list = [...list].sort((a, b) => {
      if (sortBy === 'amount') {
        return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
      // default: by date then createdAt
      const dateA = new Date(a.date || a.createdAt).getTime();
      const dateB = new Date(b.date || b.createdAt).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return res.json(list);
  } catch (err) {
    console.error('[getExpenses] Error:', err);
    return res.status(500).json({ error: 'Lỗi khi lấy danh sách khoản chi.' });
  }
}

export async function getExpenseById(req, res) {
  try {
    const { tripId, expenseId } = req.params;
    const expense = dbService.getExpense(tripId, expenseId);
    if (!expense) {
      return res.status(404).json({ error: 'Không tìm thấy khoản chi.' });
    }

    const shares = calculateExpenseShares(expense);
    return res.json({
      ...expense,
      shares
    });
  } catch (err) {
    console.error('[getExpenseById] Error:', err);
    return res.status(500).json({ error: 'Lỗi khi lấy thông tin khoản chi.' });
  }
}

export async function updateExpense(req, res) {
  try {
    const { tripId, expenseId } = req.params;
    const currentUserId = req.user.uid;
    const {
      title,
      amount,
      paidBy,
      participants,
      splitType,
      individualAmounts,
      billImageUrl,
      note,
      date
    } = req.body;

    const trip = dbService.getTrip(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Không tìm thấy chuyến đi.' });
    }

    const existing = dbService.getExpense(tripId, expenseId);
    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy khoản chi.' });
    }

    const members = dbService.getTripMembers(tripId);
    const memberIds = members.map(m => m.userId);

    // Permission check: creator of trip, creator of expense, or payer
    if (trip.createdBy !== currentUserId && existing.createdBy !== currentUserId && existing.paidBy !== currentUserId) {
      return res.status(403).json({ error: 'Bạn không có quyền sửa khoản chi này.' });
    }

    const finalAmount = amount !== undefined ? Math.round(Number(amount) || 0) : existing.amount;
    const finalPayer = paidBy || existing.paidBy;
    const finalParticipants = participants || existing.participants;
    const finalSplitType = splitType || existing.splitType;
    const finalIndividualAmounts = individualAmounts !== undefined ? individualAmounts : existing.individualAmounts;

    if (finalAmount <= 0) {
      return res.status(400).json({ error: 'Số tiền chi tiêu phải lớn hơn 0.' });
    }

    if (!memberIds.includes(finalPayer)) {
      return res.status(400).json({ error: 'Người thanh toán không hợp lệ trong chuyến đi.' });
    }

    if (!finalParticipants || finalParticipants.length === 0) {
      return res.status(400).json({ error: 'Phải có ít nhất một người tham gia.' });
    }

    // Validate calculation shares
    try {
      calculateExpenseShares({
        amount: finalAmount,
        paidBy: finalPayer,
        participants: finalParticipants,
        splitType: finalSplitType,
        individualAmounts: finalIndividualAmounts
      });
    } catch (calcError) {
      return res.status(400).json({ error: calcError.message });
    }

    const updated = dbService.updateExpense(tripId, expenseId, {
      ...(title ? { title: title.trim() } : {}),
      amount: finalAmount,
      paidBy: finalPayer,
      participants: finalParticipants,
      splitType: finalSplitType,
      individualAmounts: finalSplitType === 'custom' ? finalIndividualAmounts : {},
      ...(billImageUrl !== undefined ? { billImageUrl } : {}),
      ...(note !== undefined ? { note: note.trim() } : {}),
      ...(date ? { date } : {})
    });

    return res.json(updated);
  } catch (err) {
    console.error('[updateExpense] Error:', err);
    return res.status(500).json({ error: 'Lỗi khi cập nhật khoản chi.' });
  }
}

export async function deleteExpense(req, res) {
  try {
    const { tripId, expenseId } = req.params;
    const currentUserId = req.user.uid;

    const trip = dbService.getTrip(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Không tìm thấy chuyến đi.' });
    }

    const existing = dbService.getExpense(tripId, expenseId);
    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy khoản chi.' });
    }

    if (trip.createdBy !== currentUserId && existing.createdBy !== currentUserId && existing.paidBy !== currentUserId) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa khoản chi này.' });
    }

    dbService.deleteExpense(tripId, expenseId);
    return res.json({ success: true, message: 'Đã xóa khoản chi thành công.' });
  } catch (err) {
    console.error('[deleteExpense] Error:', err);
    return res.status(500).json({ error: 'Lỗi khi xóa khoản chi.' });
  }
}
