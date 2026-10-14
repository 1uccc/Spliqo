import { dbService } from '../services/dbService.js';

export async function getFriendsData(req, res) {
  try {
    const userId = req.user.uid;
    // If local memory is empty or sparse, ensure we load all users and records from Cloud Firestore
    if (Object.keys(dbService.data.users || {}).length <= 1) {
      await dbService.syncAllDataFromFirestore();
    }

    const friends = dbService.getFriends(userId);
    const suggested = dbService.getSuggestedUsers(userId);
    const requests = dbService.getFriendRequests(userId);

    // Calculate mutual trips for each friend
    const userTrips = dbService.getTripsForUser(userId);
    const enrichedFriends = friends.map(f => {
      const mutualTrips = userTrips.filter(t => {
        const members = dbService.getTripMembers(t.id);
        return members.some(m => m.userId === f.uid);
      });

      return {
        ...f,
        mutualTripsCount: mutualTrips.length,
        mutualTrips: mutualTrips.map(t => ({ id: t.id, name: t.name, tripCode: t.tripCode }))
      };
    });

    return res.json({
      friends: enrichedFriends,
      suggested,
      requests
    });
  } catch (err) {
    console.error('[getFriendsData] Error:', err);
    return res.status(500).json({ error: 'Lỗi khi tải dữ liệu bạn bè.' });
  }
}

export async function addFriend(req, res) {
  try {
    const userId = req.user.uid;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'Thiếu ID người dùng cần kết bạn.' });
    }

    if (targetUserId === userId) {
      return res.status(400).json({ error: 'Không thể tự kết bạn với chính mình.' });
    }

    const targetUser = dbService.getUser(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng này trong hệ thống.' });
    }

    const updatedFriends = dbService.addFriend(userId, targetUserId);
    return res.json({
      success: true,
      message: `Đã kết bạn thành công với ${targetUser.displayName || 'thành viên'}!`,
      friends: updatedFriends
    });
  } catch (err) {
    console.error('[addFriend] Error:', err);
    return res.status(500).json({ error: err.message || 'Lỗi khi kết bạn.' });
  }
}

export async function removeFriend(req, res) {
  try {
    const userId = req.user.uid;
    const { friendId } = req.params;

    if (!friendId) {
      return res.status(400).json({ error: 'Thiếu ID bạn bè cần hủy kết bạn.' });
    }

    const updatedFriends = dbService.removeFriend(userId, friendId);
    return res.json({
      success: true,
      message: 'Đã hủy kết bạn.',
      friends: updatedFriends
    });
  } catch (err) {
    console.error('[removeFriend] Error:', err);
    return res.status(500).json({ error: 'Lỗi khi hủy kết bạn.' });
  }
}

export async function sendFriendRequest(req, res) {
  try {
    const userId = req.user.uid;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'Thiếu ID người dùng.' });
    }

    const result = dbService.sendFriendRequest(userId, targetUserId);

    try {
      dbService.addNotification(targetUserId, {
        type: 'FRIEND_REQUEST',
        title: 'Lời mời kết bạn mới',
        message: `${req.user.displayName || 'Một thành viên'} vừa gửi lời mời kết bạn cho bạn.`,
        link: '/friends',
        actor: {
          uid: userId,
          displayName: req.user.displayName,
          photoURL: req.user.photoURL,
        }
      });
    } catch (e) {
      console.warn('[sendFriendRequest] Notification error:', e.message);
    }

    return res.json({
      success: true,
      message: result.autoAccepted ? result.message : 'Đã gửi lời mời kết bạn!',
      data: result
    });
  } catch (err) {
    console.error('[sendFriendRequest] Error:', err);
    return res.status(400).json({ error: err.message || 'Lỗi khi gửi lời mời kết bạn.' });
  }
}

export async function acceptFriendRequest(req, res) {
  try {
    const userId = req.user.uid;
    const { fromUserId, requestId } = req.body;

    if (!fromUserId) {
      return res.status(400).json({ error: 'Thiếu thông tin người gửi lời mời.' });
    }

    dbService.addFriend(userId, fromUserId);
    if (requestId) {
      dbService.rejectFriendRequest(userId, requestId);
    }

    try {
      dbService.addNotification(fromUserId, {
        type: 'FRIEND_ACCEPTED',
        title: 'Lời mời kết bạn được chấp nhận',
        message: `${req.user.displayName || 'Một thành viên'} đã chấp nhận lời mời kết bạn của bạn.`,
        link: '/friends',
        actor: {
          uid: userId,
          displayName: req.user.displayName,
          photoURL: req.user.photoURL,
        }
      });
    } catch (e) {
      console.warn('[acceptFriendRequest] Notification error:', e.message);
    }

    return res.json({
      success: true,
      message: 'Đã chấp nhận lời mời kết bạn!'
    });
  } catch (err) {
    console.error('[acceptFriendRequest] Error:', err);
    return res.status(500).json({ error: 'Lỗi khi chấp nhận lời mời.' });
  }
}

export async function inviteFriendToTrip(req, res) {
  try {
    const currentUserId = req.user.uid;
    const { friendId, tripId } = req.body;

    if (!friendId || !tripId) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ friendId và tripId.' });
    }

    const trip = dbService.getTrip(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Không tìm thấy chuyến đi.' });
    }

    // Verify current user is a member of this trip
    const tripMembers = dbService.getTripMembers(tripId);
    const isMember = tripMembers.some(m => m.userId === currentUserId);
    if (!isMember) {
      return res.status(403).json({ error: 'Bạn không phải thành viên của chuyến đi này để có thể mời.' });
    }

    const friendUser = dbService.getUser(friendId);
    if (!friendUser) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin bạn bè.' });
    }

    // Check if already in trip
    const alreadyInTrip = tripMembers.some(m => m.userId === friendId);
    if (alreadyInTrip) {
      return res.status(400).json({ error: `${friendUser.displayName} đã tham gia chuyến đi này rồi.` });
    }

    // Add friend to trip
    dbService.addMemberToTrip(tripId, friendId, 'Member');

    try {
      dbService.addNotification(friendId, {
        type: 'TRIP_INVITE',
        title: 'Lời mời tham gia chuyến đi',
        message: `${req.user.displayName || 'Một người bạn'} đã thêm bạn vào chuyến đi "${trip.name}".`,
        link: `/trips/${tripId}`,
        actor: {
          uid: currentUserId,
          displayName: req.user.displayName,
          photoURL: req.user.photoURL,
        }
      });
    } catch (e) {
      console.warn('[inviteFriendToTrip] Notification error:', e.message);
    }

    return res.json({
      success: true,
      message: `Đã mời thành công ${friendUser.displayName} vào chuyến đi "${trip.name}"!`,
      trip
    });
  } catch (err) {
    console.error('[inviteFriendToTrip] Error:', err);
    return res.status(500).json({ error: err.message || 'Lỗi khi mời bạn vào chuyến đi.' });
  }
}
