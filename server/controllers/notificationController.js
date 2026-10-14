import { dbService } from '../services/dbService.js';

export async function getNotifications(req, res) {
  try {
    const userId = req.user.uid;
    let list = dbService.getNotifications(userId);

    // If user has 0 notifications, seed a friendly welcome notification
    if (list.length === 0) {
      dbService.addNotification(userId, {
        type: 'SYSTEM',
        title: 'Chào mừng bạn đến với Spliqo! 🎉',
        message: 'Tạo chuyến đi, thêm chi phí và chia tiền công bằng. Hệ thống sẽ tự động tối ưu giao dịch chuyển khoản VietQR cho bạn.',
        link: '/trips',
        actor: null
      });
      list = dbService.getNotifications(userId);
    }

    const unreadCount = list.filter(n => !n.read).length;
    return res.json({
      notifications: list,
      unreadCount
    });
  } catch (err) {
    console.error('[getNotifications] Error:', err);
    return res.status(500).json({ error: 'Lỗi khi tải thông báo.' });
  }
}

export async function markAsRead(req, res) {
  try {
    const userId = req.user.uid;
    const { notifId } = req.params;
    const success = dbService.markNotificationAsRead(userId, notifId);
    return res.json({ success });
  } catch (err) {
    console.error('[markAsRead] Error:', err);
    return res.status(500).json({ error: 'Lỗi khi cập nhật trạng thái thông báo.' });
  }
}

export async function markAllAsRead(req, res) {
  try {
    const userId = req.user.uid;
    const count = dbService.markAllNotificationsAsRead(userId);
    return res.json({ success: true, count });
  } catch (err) {
    console.error('[markAllAsRead] Error:', err);
    return res.status(500).json({ error: 'Lỗi khi đánh dấu tất cả thông báo.' });
  }
}

export async function deleteNotification(req, res) {
  try {
    const userId = req.user.uid;
    const { notifId } = req.params;
    const success = dbService.deleteNotification(userId, notifId);
    return res.json({ success });
  } catch (err) {
    console.error('[deleteNotification] Error:', err);
    return res.status(500).json({ error: 'Lỗi khi xóa thông báo.' });
  }
}

export async function clearAllNotifications(req, res) {
  try {
    const userId = req.user.uid;
    dbService.clearNotifications(userId);
    return res.json({ success: true, message: 'Đã xóa tất cả thông báo.' });
  } catch (err) {
    console.error('[clearAllNotifications] Error:', err);
    return res.status(500).json({ error: 'Lỗi khi xóa danh sách thông báo.' });
  }
}
