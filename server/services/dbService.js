import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, isFirebaseConfigured } from '../config/firebase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial seed data matching user prompt example: "Đà Lạt 3 ngày 2 đêm"
const DEFAULT_DATA = {
  users: {
    "user_a": {
      uid: "user_a",
      email: "nguyenvana@gmail.com",
      displayName: "Nguyễn Văn A",
      photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
      phone: "0901234567",
      bankName: "VCB",
      bankAccountNumber: "0071001234567",
      bankAccountHolder: "NGUYEN VAN A",
      paymentQrUrl: "",
      createdAt: new Date().toISOString()
    },
    "user_b": {
      uid: "user_b",
      email: "tranthib@gmail.com",
      displayName: "Trần Thị B",
      photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
      phone: "0912345678",
      bankName: "MB",
      bankAccountNumber: "0912345678",
      bankAccountHolder: "TRAN THI B",
      paymentQrUrl: "",
      createdAt: new Date().toISOString()
    },
    "user_c": {
      uid: "user_c",
      email: "levanc@gmail.com",
      displayName: "Lê Văn C",
      photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander",
      phone: "0923456789",
      bankName: "TCB",
      bankAccountNumber: "19034567890123",
      bankAccountHolder: "LE VAN C",
      paymentQrUrl: "",
      createdAt: new Date().toISOString()
    },
    "user_d": {
      uid: "user_d",
      email: "phamminhd@gmail.com",
      displayName: "Phạm Minh D",
      photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack",
      phone: "0934567890",
      bankName: "ACB",
      bankAccountNumber: "88889999123",
      bankAccountHolder: "PHAM MINH D",
      paymentQrUrl: "",
      createdAt: new Date().toISOString()
    },
    "user_e": {
      uid: "user_e",
      email: "hoangthie@gmail.com",
      displayName: "Hoàng Thị E",
      photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Molly",
      phone: "0945678901",
      bankName: "VPB",
      bankAccountNumber: "1234567890",
      bankAccountHolder: "HOANG THI E",
      paymentQrUrl: "",
      createdAt: new Date().toISOString()
    }
  },
  trips: {
    "trip_dalat_2026": {
      id: "trip_dalat_2026",
      name: "Đà Lạt 3 ngày 2 đêm",
      description: "Chuyến du lịch khám phá Đà Lạt mộng mơ, săn mây và thưởng thức ẩm thực",
      tripCode: "DL26A8",
      createdBy: "user_a",
      startDate: "2026-09-20",
      endDate: "2026-09-22",
      status: "ACTIVE", // ACTIVE | COMPLETED | ARCHIVED
      createdAt: new Date().toISOString()
    }
  },
  tripMembers: {
    "trip_dalat_2026": [
      { userId: "user_a", role: "Creator", joinedAt: new Date().toISOString() },
      { userId: "user_b", role: "Member", joinedAt: new Date().toISOString() },
      { userId: "user_c", role: "Member", joinedAt: new Date().toISOString() },
      { userId: "user_d", role: "Member", joinedAt: new Date().toISOString() },
      { userId: "user_e", role: "Member", joinedAt: new Date().toISOString() }
    ]
  },
  expenses: {
    "trip_dalat_2026": [
      {
        id: "exp_1",
        title: "Tiền xe khứ hồi",
        amount: 1000000,
        paidBy: "user_a",
        participants: ["user_a", "user_b", "user_c", "user_d", "user_e"],
        splitType: "equal",
        individualAmounts: {},
        billImageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80",
        note: "Xe Limousine 9 chỗ đưa đón tận nơi",
        date: "2026-09-20",
        createdBy: "user_a",
        createdAt: "2026-09-20T08:00:00.000Z"
      },
      {
        id: "exp_2",
        title: "Khách sạn 2 đêm",
        amount: 2500000,
        paidBy: "user_b",
        participants: ["user_a", "user_b", "user_c", "user_d", "user_e"],
        splitType: "equal",
        individualAmounts: {},
        billImageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
        note: "Villa view đồi thông gần trung tâm",
        date: "2026-09-20",
        createdBy: "user_b",
        createdAt: "2026-09-20T14:00:00.000Z"
      },
      {
        id: "exp_3",
        title: "Ăn trưa lẩu gà lá é",
        amount: 600000,
        paidBy: "user_c",
        participants: ["user_a", "user_b", "user_c", "user_d"], // E không ăn
        splitType: "equal",
        individualAmounts: {},
        billImageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
        note: "Quán Tao Ngộ - E bị mệt nên về phòng nghỉ, không ăn trưa",
        date: "2026-09-21",
        createdBy: "user_c",
        createdAt: "2026-09-21T12:30:00.000Z"
      },
      {
        id: "exp_4",
        title: "Cà phê săn mây",
        amount: 250000,
        paidBy: "user_d",
        participants: ["user_a", "user_b", "user_c", "user_d", "user_e"],
        splitType: "equal",
        individualAmounts: {},
        billImageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80",
        note: "Cà phê đồi chè Cầu Đất",
        date: "2026-09-21",
        createdBy: "user_d",
        createdAt: "2026-09-21T16:00:00.000Z"
      },
      {
        id: "exp_5",
        title: "Vé tham quan Fresh Garden",
        amount: 750000,
        paidBy: "user_e",
        participants: ["user_a", "user_b", "user_c", "user_d", "user_e"],
        splitType: "equal",
        individualAmounts: {},
        billImageUrl: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=600&q=80",
        note: "Vé combo người lớn 150.000đ/vé",
        date: "2026-09-22",
        createdBy: "user_e",
        createdAt: "2026-09-22T09:30:00.000Z"
      }
    ]
  },
  settlements: {
    "trip_dalat_2026": []
  },
  friends: {
    "user_a": ["user_b", "user_c"],
    "user_b": ["user_a", "user_c"],
    "user_c": ["user_a", "user_b"],
    "user_d": ["user_e"],
    "user_e": ["user_d"]
  },
  friendRequests: []
};

class DBService {
  constructor() {
    this.data = this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.friends) {
          parsed.friends = {
            "user_a": ["user_b", "user_c"],
            "user_b": ["user_a", "user_c"],
            "user_c": ["user_a", "user_b"],
            "user_d": ["user_e"],
            "user_e": ["user_d"]
          };
        }
        if (!parsed.friendRequests) {
          parsed.friendRequests = [];
        }
        return parsed;
      }
    } catch (e) {
      console.warn('[DBService] Error reading store.json, using defaults:', e.message);
    }
    this.saveData(DEFAULT_DATA);
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }

  saveData(data) {
    try {
      fs.writeFileSync(STORE_FILE, JSON.stringify(data || this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('[DBService] Error saving store.json:', e.message);
    }
  }

  // --- Users ---
  getUser(userId) {
    return this.data.users[userId] || null;
  }

  saveUser(user) {
    const uid = user.uid || user.userId;
    this.data.users[uid] = {
      ...(this.data.users[uid] || {}),
      ...user,
      uid
    };
    this.saveData();
    return this.data.users[uid];
  }

  getAllUsers() {
    return Object.values(this.data.users);
  }

  // --- Trips ---
  getTripsForUser(userId) {
    const userTripIds = [];
    for (const [tripId, members] of Object.entries(this.data.tripMembers)) {
      if (members.some(m => m.userId === userId)) {
        userTripIds.push(tripId);
      }
    }
    return userTripIds.map(id => this.getTrip(id)).filter(Boolean);
  }

  getTrip(tripId) {
    return this.data.trips[tripId] || null;
  }

  getTripByCode(code) {
    const upper = code.trim().toUpperCase();
    return Object.values(this.data.trips).find(t => (t.tripCode || '').toUpperCase() === upper) || null;
  }

  createTrip(trip) {
    this.data.trips[trip.id] = trip;
    if (!this.data.tripMembers[trip.id]) {
      this.data.tripMembers[trip.id] = [];
    }
    if (!this.data.expenses[trip.id]) {
      this.data.expenses[trip.id] = [];
    }
    if (!this.data.settlements[trip.id]) {
      this.data.settlements[trip.id] = [];
    }
    this.saveData();
    return trip;
  }

  updateTrip(tripId, updates) {
    if (!this.data.trips[tripId]) return null;
    this.data.trips[tripId] = {
      ...this.data.trips[tripId],
      ...updates
    };
    this.saveData();
    return this.data.trips[tripId];
  }

  deleteTrip(tripId) {
    delete this.data.trips[tripId];
    delete this.data.tripMembers[tripId];
    delete this.data.expenses[tripId];
    delete this.data.settlements[tripId];
    this.saveData();
    return true;
  }

  // --- Members ---
  getTripMembers(tripId) {
    const list = this.data.tripMembers[tripId] || [];
    return list.map(m => {
      const user = this.getUser(m.userId) || {};
      return {
        ...user,
        userId: m.userId,
        role: m.role || 'Member',
        joinedAt: m.joinedAt || new Date().toISOString()
      };
    });
  }

  addMemberToTrip(tripId, userId, role = 'Member') {
    if (!this.data.tripMembers[tripId]) {
      this.data.tripMembers[tripId] = [];
    }
    const exists = this.data.tripMembers[tripId].some(m => m.userId === userId);
    if (!exists) {
      this.data.tripMembers[tripId].push({
        userId,
        role,
        joinedAt: new Date().toISOString()
      });
      this.saveData();
    }
    return this.getTripMembers(tripId);
  }

  removeMemberFromTrip(tripId, userId) {
    if (!this.data.tripMembers[tripId]) return [];
    this.data.tripMembers[tripId] = this.data.tripMembers[tripId].filter(m => m.userId !== userId);
    this.saveData();
    return this.getTripMembers(tripId);
  }

  // --- Expenses ---
  getTripExpenses(tripId) {
    return this.data.expenses[tripId] || [];
  }

  getExpense(tripId, expenseId) {
    const list = this.data.expenses[tripId] || [];
    return list.find(e => e.id === expenseId) || null;
  }

  addExpense(tripId, expense) {
    if (!this.data.expenses[tripId]) {
      this.data.expenses[tripId] = [];
    }
    this.data.expenses[tripId].push(expense);
    this.saveData();
    return expense;
  }

  updateExpense(tripId, expenseId, updates) {
    const list = this.data.expenses[tripId] || [];
    const index = list.findIndex(e => e.id === expenseId);
    if (index === -1) return null;
    list[index] = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.saveData();
    return list[index];
  }

  deleteExpense(tripId, expenseId) {
    if (!this.data.expenses[tripId]) return false;
    const initialLen = this.data.expenses[tripId].length;
    this.data.expenses[tripId] = this.data.expenses[tripId].filter(e => e.id !== expenseId);
    this.saveData();
    return this.data.expenses[tripId].length < initialLen;
  }

  // --- Settlements ---
  getTripSettlements(tripId) {
    return this.data.settlements[tripId] || [];
  }

  saveSettlement(tripId, settlement) {
    if (!this.data.settlements[tripId]) {
      this.data.settlements[tripId] = [];
    }
    const list = this.data.settlements[tripId];
    const index = list.findIndex(s => s.id === settlement.id || (s.fromUserId === settlement.fromUserId && s.toUserId === settlement.toUserId));
    if (index >= 0) {
      list[index] = { ...list[index], ...settlement };
    } else {
      list.push(settlement);
    }
    this.saveData();
    return settlement;
  }

  updateSettlementStatus(tripId, settlementId, status, extraFields = {}) {
    if (!this.data.settlements[tripId]) return null;
    const list = this.data.settlements[tripId];
    const item = list.find(s => s.id === settlementId);
    if (item) {
      item.status = status;
      Object.assign(item, extraFields);
      this.saveData();
      return item;
    }
    return null;
  }

  // --- Friends & Social ---
  getFriends(userId) {
    if (!this.data.friends) this.data.friends = {};
    const friendIds = this.data.friends[userId] || [];
    return friendIds.map(fId => this.getUser(fId)).filter(Boolean);
  }

  getSuggestedUsers(userId) {
    if (!this.data.friends) this.data.friends = {};
    const friendIds = new Set(this.data.friends[userId] || []);
    friendIds.add(userId);
    return Object.values(this.data.users)
      .filter(u => !friendIds.has(u.uid))
      .map(u => ({
        uid: u.uid,
        displayName: u.displayName,
        email: u.email,
        photoURL: u.photoURL,
        phone: u.phone,
        bankName: u.bankName,
        bankAccountNumber: u.bankAccountNumber
      }));
  }

  addFriend(userId, targetUserId) {
    if (!this.data.friends) this.data.friends = {};
    if (!this.data.friends[userId]) this.data.friends[userId] = [];
    if (!this.data.friends[targetUserId]) this.data.friends[targetUserId] = [];

    if (!this.data.friends[userId].includes(targetUserId)) {
      this.data.friends[userId].push(targetUserId);
    }
    if (!this.data.friends[targetUserId].includes(userId)) {
      this.data.friends[targetUserId].push(userId);
    }

    // Clear any pending friend requests between them
    if (this.data.friendRequests) {
      this.data.friendRequests = this.data.friendRequests.filter(
        r => !(
          (r.fromUserId === userId && r.toUserId === targetUserId) ||
          (r.fromUserId === targetUserId && r.toUserId === userId)
        )
      );
    }

    this.saveData();
    return this.getFriends(userId);
  }

  removeFriend(userId, targetUserId) {
    if (!this.data.friends) this.data.friends = {};
    if (this.data.friends[userId]) {
      this.data.friends[userId] = this.data.friends[userId].filter(id => id !== targetUserId);
    }
    if (this.data.friends[targetUserId]) {
      this.data.friends[targetUserId] = this.data.friends[targetUserId].filter(id => id !== userId);
    }
    this.saveData();
    return this.getFriends(userId);
  }

  getFriendRequests(userId) {
    if (!this.data.friendRequests) this.data.friendRequests = [];
    const incoming = this.data.friendRequests
      .filter(r => r.toUserId === userId && r.status === 'PENDING')
      .map(r => ({
        ...r,
        fromUser: this.getUser(r.fromUserId)
      }));
    const outgoing = this.data.friendRequests
      .filter(r => r.fromUserId === userId && r.status === 'PENDING')
      .map(r => ({
        ...r,
        toUser: this.getUser(r.toUserId)
      }));
    return { incoming, outgoing };
  }

  sendFriendRequest(fromUserId, toUserId) {
    if (!this.data.friendRequests) this.data.friendRequests = [];
    if (fromUserId === toUserId) throw new Error('Không thể tự kết bạn với chính mình.');
    
    // Check if already friends
    if (this.data.friends?.[fromUserId]?.includes(toUserId)) {
      throw new Error('Hai bạn đã là bạn bè của nhau rồi.');
    }

    // Check if pending request exists
    const existing = this.data.friendRequests.find(
      r => r.fromUserId === fromUserId && r.toUserId === toUserId && r.status === 'PENDING'
    );
    if (existing) return existing;

    // Check if reverse request exists -> Auto accept!
    const reverse = this.data.friendRequests.find(
      r => r.fromUserId === toUserId && r.toUserId === fromUserId && r.status === 'PENDING'
    );
    if (reverse) {
      this.addFriend(fromUserId, toUserId);
      return { autoAccepted: true, message: 'Đã chấp nhận lời mời và trở thành bạn bè!' };
    }

    const request = {
      id: `freq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fromUserId,
      toUserId,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };
    this.data.friendRequests.push(request);
    this.saveData();
    return request;
  }

  rejectFriendRequest(userId, requestId) {
    if (!this.data.friendRequests) return false;
    const reqIndex = this.data.friendRequests.findIndex(
      r => (r.id === requestId || r.fromUserId === requestId) && r.toUserId === userId
    );
    if (reqIndex >= 0) {
      this.data.friendRequests.splice(reqIndex, 1);
      this.saveData();
      return true;
    }
    return false;
  }
}

export const dbService = new DBService();
