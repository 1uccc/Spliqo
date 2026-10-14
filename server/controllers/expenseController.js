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

    const payerUser = dbService.getUser(paidBy);
    const creatorUser = dbService.getUser(currentUserId);
    const payerName = payerUser?.displayName || 'Thành viên';
    const creatorName = creatorUser?.displayName || req.user.displayName || 'Thành viên';
    const splitLabel = splitType === 'custom' ? 'Chia tùy chỉnh' : 'Chia đều';

    const initialDetails = [
      { field: 'amount', label: 'Số tiền chi', value: new Intl.NumberFormat('vi-VN').format(numAmount) + 'đ' },
      { field: 'paidBy', label: 'Người thanh toán', value: payerName },
      { field: 'splitType', label: 'Phương thức chia', value: splitLabel },
      { field: 'participants', label: 'Người tham gia', value: `${participants.length} thành viên` },
      { field: 'date', label: 'Ngày ghi nhận', value: date || new Date().toISOString().split('T')[0] }
    ];
    if (note && note.trim()) {
      initialDetails.push({ field: 'note', label: 'Ghi chú', value: note.trim() });
    }
    if (billImageUrl) {
      initialDetails.push({ field: 'bill', label: 'Hóa đơn', value: 'Đã đính kèm ảnh' });
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
      createdAt: new Date().toISOString(),
      history: [
        {
          id: `hist_${Date.now()}_init`,
          action: 'CREATE',
          authorId: currentUserId,
          authorName: creatorName,
          authorPhotoURL: creatorUser?.photoURL || '',
          timestamp: new Date().toISOString(),
          description: `Khởi tạo khoản chi ban đầu "${title.trim()}"`,
          changes: [
            `Số tiền: ${new Intl.NumberFormat('vi-VN').format(numAmount)}đ`,
            `Người trả: ${payerName}`,
            `Cách chia: ${splitLabel} (${participants.length} người)`,
            `Ngày chi: ${date || new Date().toISOString().split('T')[0]}`,
            ...(note && note.trim() ? [`Ghi chú: "${note.trim()}"`] : []),
            ...(billImageUrl ? ['Đã đính kèm hóa đơn'] : [])
          ],
          details: initialDetails,
          snapshot: {
            title: title.trim(),
            amount: numAmount,
            amountFormatted: new Intl.NumberFormat('vi-VN').format(numAmount) + 'đ',
            paidBy: payerName,
            splitType: splitLabel,
            participantCount: participants.length,
            date: date || new Date().toISOString().split('T')[0],
            note: (note || '').trim(),
            hasBill: !!billImageUrl
          }
        }
      ]
    };

    dbService.addExpense(tripId, newExpense);

    // Notify other trip members about the new expense
    try {
      const otherMembers = members.filter(m => m.userId !== currentUserId);
      const formattedAmount = (new Intl.NumberFormat('vi-VN').format(numAmount)) + 'đ';
      for (const m of otherMembers) {
        dbService.addNotification(m.userId, {
          type: 'EXPENSE_ADDED',
          title: `Khoản chi mới trong "${trip.name}"`,
          message: `${creatorName} vừa tạo khoản chi "${title.trim()}" (${formattedAmount}).`,
          link: `/trips/${tripId}`,
          actor: {
            uid: currentUserId,
            displayName: creatorName,
            photoURL: creatorUser?.photoURL || '',
          }
        });
      }
    } catch (e) {
      console.warn('[addExpense] Notification error:', e.message);
    }

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
    const creatorUser = dbService.getUser(expense.createdBy);
    const payerUser = dbService.getUser(expense.paidBy);
    const payerName = payerUser?.displayName || 'Thành viên';
    const splitLabel = expense.splitType === 'custom' ? 'Chia tùy chỉnh' : 'Chia đều';

    const history = Array.isArray(expense.history) && expense.history.length > 0
      ? expense.history
      : [
          {
            id: `hist_init_${expense.id}`,
            action: 'CREATE',
            authorId: expense.createdBy || 'unknown',
            authorName: creatorUser?.displayName || 'Thành viên',
            authorPhotoURL: creatorUser?.photoURL || '',
            timestamp: expense.createdAt || new Date().toISOString(),
            description: `Khởi tạo khoản chi: ${new Intl.NumberFormat('vi-VN').format(expense.amount)}đ`,
            changes: [
              `Số tiền: ${new Intl.NumberFormat('vi-VN').format(expense.amount)}đ`,
              `Người trả: ${payerName}`,
              `Cách chia: ${splitLabel} (${expense.participants?.length || 0} người)`,
              `Ngày chi: ${expense.date || new Date().toISOString().split('T')[0]}`,
              ...(expense.note ? [`Ghi chú: "${expense.note}"`] : []),
              ...(expense.billImageUrl ? ['Đã đính kèm ảnh hóa đơn'] : [])
            ],
            details: [
              { field: 'amount', label: 'Số tiền chi', value: new Intl.NumberFormat('vi-VN').format(expense.amount) + 'đ' },
              { field: 'paidBy', label: 'Người thanh toán', value: payerName },
              { field: 'splitType', label: 'Phương thức chia', value: splitLabel },
              { field: 'participants', label: 'Người tham gia', value: `${expense.participants?.length || 0} thành viên` },
              { field: 'date', label: 'Ngày ghi nhận', value: expense.date || new Date().toISOString().split('T')[0] }
            ],
            snapshot: {
              title: expense.title,
              amount: expense.amount,
              amountFormatted: new Intl.NumberFormat('vi-VN').format(expense.amount) + 'đ',
              paidBy: payerName,
              splitType: splitLabel,
              participantCount: expense.participants?.length || 0,
              date: expense.date || new Date().toISOString().split('T')[0],
              note: expense.note || '',
              hasBill: !!expense.billImageUrl
            }
          }
        ];

    return res.json({
      ...expense,
      shares,
      history
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

    // Track detailed changes for Audit / History log
    const changes = [];
    const diffs = [];
    const fmt = (v) => new Intl.NumberFormat('vi-VN').format(v) + 'đ';

    if (title && title.trim() !== existing.title) {
      changes.push(`Đổi tên: "${existing.title}" → "${title.trim()}"`);
      diffs.push({
        field: 'title',
        label: 'Tên khoản chi',
        oldValue: existing.title,
        newValue: title.trim()
      });
    }

    if (finalAmount !== existing.amount) {
      const diff = finalAmount - existing.amount;
      const diffStr = diff > 0 ? `+${fmt(diff)}` : `-${fmt(Math.abs(diff))}`;
      changes.push(`Đổi số tiền: ${fmt(existing.amount)} → ${fmt(finalAmount)} (${diffStr})`);
      diffs.push({
        field: 'amount',
        label: 'Số tiền chi',
        oldValue: fmt(existing.amount),
        newValue: fmt(finalAmount),
        diff,
        diffFormatted: diffStr,
        isIncrease: diff > 0
      });
    }

    if (finalPayer !== existing.paidBy) {
      const oldPayerUser = dbService.getUser(existing.paidBy);
      const newPayerUser = dbService.getUser(finalPayer);
      const oldName = oldPayerUser?.displayName || existing.paidBy;
      const newName = newPayerUser?.displayName || finalPayer;
      changes.push(`Đổi người trả: ${oldName} → ${newName}`);
      diffs.push({
        field: 'paidBy',
        label: 'Người thanh toán',
        oldValue: oldName,
        newValue: newName
      });
    }

    // Participants difference
    const oldP = existing.participants || [];
    const newP = finalParticipants || [];
    const addedP = newP.filter(id => !oldP.includes(id));
    const removedP = oldP.filter(id => !newP.includes(id));

    if (addedP.length > 0 || removedP.length > 0) {
      const addedNames = addedP.map(id => dbService.getUser(id)?.displayName || id);
      const removedNames = removedP.map(id => dbService.getUser(id)?.displayName || id);
      let pSummary = `Thay đổi người tham gia (${newP.length} người)`;
      if (addedNames.length > 0) pSummary += ` [Thêm: ${addedNames.join(', ')}]`;
      if (removedNames.length > 0) pSummary += ` [Bỏ: ${removedNames.join(', ')}]`;
      changes.push(pSummary);
      diffs.push({
        field: 'participants',
        label: 'Người tham gia',
        oldCount: oldP.length,
        newCount: newP.length,
        added: addedNames,
        removed: removedNames
      });
    }

    if (finalSplitType !== existing.splitType) {
      const stName = (t) => t === 'custom' ? 'Chia tùy chỉnh' : 'Chia đều';
      changes.push(`Đổi cách chia: ${stName(existing.splitType)} → ${stName(finalSplitType)}`);
      diffs.push({
        field: 'splitType',
        label: 'Cách chia tiền',
        oldValue: stName(existing.splitType),
        newValue: stName(finalSplitType)
      });
    } else if (finalSplitType === 'custom') {
      const oldInd = existing.individualAmounts || {};
      const newInd = finalIndividualAmounts || {};
      const allP = Array.from(new Set([...Object.keys(oldInd), ...Object.keys(newInd), ...finalParticipants]));
      const shareChanges = [];
      for (const pId of allP) {
        const oldV = Number(oldInd[pId]) || 0;
        const newV = Number(newInd[pId]) || 0;
        if (oldV !== newV) {
          const pUser = dbService.getUser(pId);
          const pName = pUser?.displayName || pId;
          const diffVal = newV - oldV;
          const diffFmt = diffVal > 0 ? `+${fmt(diffVal)}` : `-${fmt(Math.abs(diffVal))}`;
          shareChanges.push({
            userId: pId,
            name: pName,
            oldShare: fmt(oldV),
            newShare: fmt(newV),
            diff: diffVal,
            diffFormatted: diffFmt,
            isIncrease: diffVal > 0
          });
        }
      }
      if (shareChanges.length > 0) {
        changes.push(`Điều chỉnh phần tiền chia riêng (${shareChanges.length} người)`);
        diffs.push({
          field: 'customShares',
          label: 'Phần tiền chia riêng',
          shareChanges
        });
      }
    }

    if (date && date !== existing.date) {
      changes.push(`Đổi ngày chi: ${existing.date} → ${date}`);
      diffs.push({
        field: 'date',
        label: 'Ngày chi',
        oldValue: existing.date,
        newValue: date
      });
    }

    if (note !== undefined && note.trim() !== (existing.note || '')) {
      const oldNote = existing.note ? `"${existing.note}"` : '(Trống)';
      const newNote = note.trim() ? `"${note.trim()}"` : '(Trống)';
      changes.push(`Đổi ghi chú: ${oldNote} → ${newNote}`);
      diffs.push({
        field: 'note',
        label: 'Ghi chú',
        oldValue: existing.note || '(Trống)',
        newValue: note.trim() || '(Trống)'
      });
    }

    if (billImageUrl !== undefined && billImageUrl !== (existing.billImageUrl || '')) {
      let billChangeText = 'Cập nhật ảnh hóa đơn';
      if (!existing.billImageUrl && billImageUrl) billChangeText = 'Đính kèm ảnh hóa đơn mới';
      else if (existing.billImageUrl && !billImageUrl) billChangeText = 'Đã xóa ảnh hóa đơn';
      changes.push(billChangeText);
      diffs.push({
        field: 'billImageUrl',
        label: 'Hóa đơn thanh toán',
        oldValue: existing.billImageUrl ? 'Có ảnh hóa đơn' : 'Chưa có ảnh',
        newValue: billImageUrl ? 'Có ảnh hóa đơn' : 'Đã xóa ảnh',
        action: billChangeText
      });
    }

    const updaterUser = dbService.getUser(currentUserId);
    const historyEntry = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      action: 'UPDATE',
      authorId: currentUserId,
      authorName: updaterUser?.displayName || req.user.displayName || 'Thành viên',
      authorPhotoURL: updaterUser?.photoURL || '',
      timestamp: new Date().toISOString(),
      description: changes.length > 0 ? changes.join(' • ') : 'Cập nhật thông tin khoản chi',
      changes,
      diffs
    };

    const creatorUser = dbService.getUser(existing.createdBy);
    const payerUser = dbService.getUser(existing.paidBy);
    const payerName = payerUser?.displayName || 'Thành viên';
    const splitLabel = existing.splitType === 'custom' ? 'Chia tùy chỉnh' : 'Chia đều';

    const prevHistory = Array.isArray(existing.history) && existing.history.length > 0
      ? existing.history
      : [
          {
            id: `hist_init_${existing.id}`,
            action: 'CREATE',
            authorId: existing.createdBy || 'unknown',
            authorName: creatorUser?.displayName || 'Người tạo',
            authorPhotoURL: creatorUser?.photoURL || '',
            timestamp: existing.createdAt || new Date().toISOString(),
            description: `Khởi tạo khoản chi: ${fmt(existing.amount)}`,
            changes: [
              `Số tiền: ${fmt(existing.amount)}`,
              `Người trả: ${payerName}`,
              `Cách chia: ${splitLabel} (${existing.participants?.length || 0} người)`,
              `Ngày chi: ${existing.date || new Date().toISOString().split('T')[0]}`
            ],
            snapshot: {
              title: existing.title,
              amount: existing.amount,
              amountFormatted: fmt(existing.amount),
              paidBy: payerName,
              splitType: splitLabel,
              participantCount: existing.participants?.length || 0,
              date: existing.date,
              note: existing.note || '',
              hasBill: !!existing.billImageUrl
            }
          }
        ];

    const updatedHistory = [historyEntry, ...prevHistory];

    const updated = dbService.updateExpense(tripId, expenseId, {
      ...(title ? { title: title.trim() } : {}),
      amount: finalAmount,
      paidBy: finalPayer,
      participants: finalParticipants,
      splitType: finalSplitType,
      individualAmounts: finalSplitType === 'custom' ? finalIndividualAmounts : {},
      ...(billImageUrl !== undefined ? { billImageUrl } : {}),
      ...(note !== undefined ? { note: note.trim() } : {}),
      ...(date ? { date } : {}),
      history: updatedHistory
    });

    // Notify other members about the expense modification
    try {
      const members = dbService.getTripMembers(tripId);
      const otherMembers = members.filter(m => m.userId !== currentUserId);
      const updaterName = updaterUser?.displayName || req.user.displayName || 'Một thành viên';
      for (const m of otherMembers) {
        dbService.addNotification(m.userId, {
          type: 'EXPENSE_UPDATED',
          title: `Cập nhật chi tiêu trong "${trip.name}"`,
          message: `${updaterName} vừa cập nhật khoản chi "${updated.title}".`,
          link: `/trips/${tripId}`,
          actor: {
            uid: currentUserId,
            displayName: updaterName,
            photoURL: updaterUser?.photoURL || '',
          }
        });
      }
    } catch (e) {
      console.warn('[updateExpense] Notification error:', e.message);
    }

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
