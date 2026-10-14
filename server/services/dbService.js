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

// Empty default data schema
const DEFAULT_DATA = {
  users: {},
  trips: {},
  tripMembers: {},
  expenses: {},
  settlements: {},
  friends: {},
  friendRequests: [],
  notifications: {}
};

class DBService {
  constructor() {
    this.data = this.loadData();
    if (isFirebaseConfigured && db) {
      this.initFirestoreSync();
    }
  }

  async initFirestoreSync() {
    if (!isFirebaseConfigured || !db) return;
    await this.syncAllDataFromFirestore();
    await this.syncAllLocalDataToFirestore();
  }

  async syncAllDataFromFirestore() {
    if (!isFirebaseConfigured || !db) return;
    try {
      console.log('[Firestore Sync] Pulling latest data from Cloud Firestore into local store...');
      let loadedUsers = 0;

      // 1. Users
      const usersSnap = await db.collection('users').get();
      usersSnap.forEach(doc => {
        const u = doc.data();
        this.data.users[doc.id] = {
          ...(this.data.users[doc.id] || {}),
          ...u,
          uid: doc.id
        };
        loadedUsers++;
      });

      // 2. Trips
      const tripsSnap = await db.collection('trips').get();
      tripsSnap.forEach(doc => {
        const t = doc.data();
        this.data.trips[doc.id] = {
          ...(this.data.trips[doc.id] || {}),
          ...t,
          id: doc.id
        };
      });

      // 3. Trip Members
      const tmSnap = await db.collection('tripMembers').get();
      tmSnap.forEach(doc => {
        const d = doc.data();
        if (d && Array.isArray(d.members)) {
          this.data.tripMembers[doc.id] = d.members;
        }
      });

      // 4. Expenses
      const expSnap = await db.collection('expenses').get();
      expSnap.forEach(doc => {
        const d = doc.data();
        if (d && Array.isArray(d.expenses)) {
          this.data.expenses[doc.id] = d.expenses;
        }
      });

      // 5. Settlements
      const setSnap = await db.collection('settlements').get();
      setSnap.forEach(doc => {
        const d = doc.data();
        if (d && Array.isArray(d.settlements)) {
          this.data.settlements[doc.id] = d.settlements;
        }
      });

      // 6. Friends
      const friendsSnap = await db.collection('friends').get();
      friendsSnap.forEach(doc => {
        const d = doc.data();
        if (d && Array.isArray(d.friends)) {
          this.data.friends[doc.id] = d.friends;
        }
      });

      // 7. Friend Requests
      const reqSnap = await db.collection('friendRequests').get();
      const reqList = [];
      reqSnap.forEach(doc => {
        reqList.push({ ...doc.data(), id: doc.id });
      });
      if (reqList.length > 0) {
        this.data.friendRequests = reqList;
      }

      // 8. Notifications
      const notifSnap = await db.collection('notifications').get();
      notifSnap.forEach(doc => {
        const d = doc.data();
        if (d && Array.isArray(d.list)) {
          this.data.notifications[doc.id] = d.list;
        }
      });

      this.saveData();
      console.log(`[Firestore Sync] Successfully loaded ${loadedUsers} users & documents from Cloud Firestore!`);
    } catch (err) {
      console.error('[Firestore Sync] Pull from Firestore error:', err.message);
    }
  }

  async syncToFirestore(collectionName, docId, data, isDelete = false) {
    if (!isFirebaseConfigured || !db || !docId) return;
    try {
      const ref = db.collection(collectionName).doc(String(docId));
      if (isDelete) {
        await ref.delete();
      } else {
        await ref.set(data, { merge: true });
      }
    } catch (e) {
      console.warn(`[Firestore Sync] Error syncing ${collectionName}/${docId}:`, e.message);
    }
  }

  async syncAllLocalDataToFirestore() {
    if (!isFirebaseConfigured || !db) return;
    try {
      console.log('[Firestore Sync] Starting full synchronization from local store to Cloud Firestore...');
      let totalSynced = 0;

      // 1. Users
      const users = Object.entries(this.data.users || {});
      for (const [uid, user] of users) {
        await db.collection('users').doc(uid).set(user, { merge: true });
        totalSynced++;
      }

      // 2. Trips
      const trips = Object.entries(this.data.trips || {});
      for (const [tripId, trip] of trips) {
        await db.collection('trips').doc(tripId).set(trip, { merge: true });
        totalSynced++;
      }

      // 3. Trip Members
      const members = Object.entries(this.data.tripMembers || {});
      for (const [tripId, mList] of members) {
        await db.collection('tripMembers').doc(tripId).set({ members: mList }, { merge: true });
        totalSynced++;
      }

      // 4. Expenses
      const expenses = Object.entries(this.data.expenses || {});
      for (const [tripId, expList] of expenses) {
        await db.collection('expenses').doc(tripId).set({ expenses: expList }, { merge: true });
        totalSynced++;
      }

      // 5. Settlements
      const settlements = Object.entries(this.data.settlements || {});
      for (const [tripId, setList] of settlements) {
        await db.collection('settlements').doc(tripId).set({ settlements: setList }, { merge: true });
        totalSynced++;
      }

      // 6. Notifications
      const notifs = Object.entries(this.data.notifications || {});
      for (const [userId, nList] of notifs) {
        await db.collection('notifications').doc(userId).set({ list: nList }, { merge: true });
        totalSynced++;
      }

      // 7. Friends
      const friends = Object.entries(this.data.friends || {});
      for (const [userId, fList] of friends) {
        await db.collection('friends').doc(userId).set({ friends: fList }, { merge: true });
        totalSynced++;
      }

      console.log(`[Firestore Sync] Successfully synchronized ${totalSynced} items to Cloud Firestore!`);
    } catch (err) {
      console.error('[Firestore Sync] Full sync error:', err.message);
    }
  }

  loadData() {
    try {
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.users) parsed.users = {};
        if (!parsed.trips) parsed.trips = {};
        if (!parsed.tripMembers) parsed.tripMembers = {};
        if (!parsed.expenses) parsed.expenses = {};
        if (!parsed.settlements) parsed.settlements = {};
        if (!parsed.friends) parsed.friends = {};
        if (!parsed.friendRequests) parsed.friendRequests = [];
        if (!parsed.notifications) parsed.notifications = {};
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
    this.syncToFirestore('users', uid, this.data.users[uid]);
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
    this.syncToFirestore('trips', trip.id, trip);
    return trip;
  }

  updateTrip(tripId, updates) {
    if (!this.data.trips[tripId]) return null;
    this.data.trips[tripId] = {
      ...this.data.trips[tripId],
      ...updates
    };
    this.saveData();
    this.syncToFirestore('trips', tripId, this.data.trips[tripId]);
    return this.data.trips[tripId];
  }

  deleteTrip(tripId) {
    delete this.data.trips[tripId];
    delete this.data.tripMembers[tripId];
    delete this.data.expenses[tripId];
    delete this.data.settlements[tripId];
    this.saveData();
    this.syncToFirestore('trips', tripId, null, true);
    this.syncToFirestore('tripMembers', tripId, null, true);
    this.syncToFirestore('expenses', tripId, null, true);
    this.syncToFirestore('settlements', tripId, null, true);
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
      this.syncToFirestore('tripMembers', tripId, { members: this.data.tripMembers[tripId] });
    }
    return this.getTripMembers(tripId);
  }

  removeMemberFromTrip(tripId, userId) {
    if (!this.data.tripMembers[tripId]) return [];
    this.data.tripMembers[tripId] = this.data.tripMembers[tripId].filter(m => m.userId !== userId);
    this.saveData();
    this.syncToFirestore('tripMembers', tripId, { members: this.data.tripMembers[tripId] });
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
    this.syncToFirestore('expenses', tripId, { expenses: this.data.expenses[tripId] });
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
    this.syncToFirestore('expenses', tripId, { expenses: this.data.expenses[tripId] });
    return list[index];
  }

  deleteExpense(tripId, expenseId) {
    if (!this.data.expenses[tripId]) return false;
    const initialLen = this.data.expenses[tripId].length;
    this.data.expenses[tripId] = this.data.expenses[tripId].filter(e => e.id !== expenseId);
    this.saveData();
    this.syncToFirestore('expenses', tripId, { expenses: this.data.expenses[tripId] });
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
    this.syncToFirestore('settlements', tripId, { settlements: this.data.settlements[tripId] });
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
      this.syncToFirestore('settlements', tripId, { settlements: this.data.settlements[tripId] });
      return item;
    }
    return null;
  }

  // --- Friends & Social ---
  getFriends(userId) {
    if (!this.data.friends) this.data.friends = {};
    const friendIds = this.data.friends[userId] || [];
    return friendIds.map(fId => {
      const u = this.getUser(fId);
      if (!u) return null;
      return {
        ...u,
        bankAccountNumber: u.bankAccountNumber || u.accountNumber || '',
        bankAccountHolder: u.bankAccountHolder || u.accountHolder || ''
      };
    }).filter(Boolean);
  }

  getSuggestedUsers(userId) {
    if (!this.data.friends) this.data.friends = {};
    const friendIds = new Set(this.data.friends[userId] || []);
    friendIds.add(userId);
    return Object.values(this.data.users)
      .filter(u => !friendIds.has(u.uid))
      .map(u => ({
        uid: u.uid,
        displayName: u.displayName || '',
        email: u.email || '',
        photoURL: u.photoURL || '',
        phone: u.phone || '',
        bankName: u.bankName || '',
        bankAccountNumber: u.bankAccountNumber || u.accountNumber || '',
        bankAccountHolder: u.bankAccountHolder || u.accountHolder || ''
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
    this.syncToFirestore('friends', userId, { friends: this.data.friends[userId] });
    this.syncToFirestore('friends', targetUserId, { friends: this.data.friends[targetUserId] });
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
    this.syncToFirestore('friends', userId, { friends: this.data.friends[userId] });
    this.syncToFirestore('friends', targetUserId, { friends: this.data.friends[targetUserId] });
    return this.getFriends(userId);
  }

  getFriendRequests(userId) {
    if (!this.data.friendRequests) this.data.friendRequests = [];
    const incoming = this.data.friendRequests
      .filter(r => r.toUserId === userId && r.status === 'PENDING')
      .map(r => {
        const u = this.getUser(r.fromUserId);
        return {
          ...r,
          fromUser: u ? {
            ...u,
            bankAccountNumber: u.bankAccountNumber || u.accountNumber || '',
            bankAccountHolder: u.bankAccountHolder || u.accountHolder || ''
          } : null
        };
      });
    const outgoing = this.data.friendRequests
      .filter(r => r.fromUserId === userId && r.status === 'PENDING')
      .map(r => {
        const u = this.getUser(r.toUserId);
        return {
          ...r,
          toUser: u ? {
            ...u,
            bankAccountNumber: u.bankAccountNumber || u.accountNumber || '',
            bankAccountHolder: u.bankAccountHolder || u.accountHolder || ''
          } : null
        };
      });
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

  // --- Notifications ---
  getNotifications(userId) {
    if (!this.data.notifications) this.data.notifications = {};
    const userNotifs = this.data.notifications[userId] || [];
    return [...userNotifs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  addNotification(userId, notif) {
    if (!userId) return null;
    if (!this.data.notifications) this.data.notifications = {};
    if (!this.data.notifications[userId]) this.data.notifications[userId] = [];

    const newNotif = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      type: notif.type || 'SYSTEM',
      title: notif.title || 'Thông báo mới',
      message: notif.message || '',
      link: notif.link || '',
      actor: notif.actor || null,
      read: false,
      createdAt: new Date().toISOString()
    };

    this.data.notifications[userId].unshift(newNotif);
    // Keep max 100 notifications per user
    if (this.data.notifications[userId].length > 100) {
      this.data.notifications[userId] = this.data.notifications[userId].slice(0, 100);
    }

    this.saveData();
    this.syncToFirestore('notifications', userId, { list: this.data.notifications[userId] });
    return newNotif;
  }

  markNotificationAsRead(userId, notifId) {
    if (!this.data.notifications?.[userId]) return false;
    const notif = this.data.notifications[userId].find(n => n.id === notifId);
    if (notif) {
      notif.read = true;
      this.saveData();
      this.syncToFirestore('notifications', userId, { list: this.data.notifications[userId] });
      return true;
    }
    return false;
  }

  markAllNotificationsAsRead(userId) {
    if (!this.data.notifications?.[userId]) return 0;
    let count = 0;
    this.data.notifications[userId].forEach(n => {
      if (!n.read) {
        n.read = true;
        count++;
      }
    });
    if (count > 0) {
      this.saveData();
      this.syncToFirestore('notifications', userId, { list: this.data.notifications[userId] });
    }
    return count;
  }

  deleteNotification(userId, notifId) {
    if (!this.data.notifications?.[userId]) return false;
    const idx = this.data.notifications[userId].findIndex(n => n.id === notifId);
    if (idx >= 0) {
      this.data.notifications[userId].splice(idx, 1);
      this.saveData();
      this.syncToFirestore('notifications', userId, { list: this.data.notifications[userId] });
      return true;
    }
    return false;
  }

  clearNotifications(userId) {
    if (!this.data.notifications) this.data.notifications = {};
    this.data.notifications[userId] = [];
    this.saveData();
    this.syncToFirestore('notifications', userId, { list: this.data.notifications[userId] });
    return true;
  }
}

export const dbService = new DBService();
