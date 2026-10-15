import express from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware.js';
import {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  joinTrip,
  completeTrip,
  getTripInvitePreview
} from '../controllers/tripController.js';
import {
  getMembers,
  removeMember
} from '../controllers/memberController.js';
import {
  addExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense
} from '../controllers/expenseController.js';
import {
  getTripSummary,
  getTripBalances,
  getTripSettlements,
  getUserSettlementsOverview
} from '../controllers/calculationController.js';
import {
  markAsPaid,
  confirmPayment,
  getSettlementHistory,
  nudgeDebtor
} from '../controllers/paymentController.js';
import {
  getProfile,
  updateProfile,
  getAllUsers
} from '../controllers/userController.js';
import {
  getFriendsData,
  addFriend,
  removeFriend,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  inviteFriendToTrip
} from '../controllers/friendController.js';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications
} from '../controllers/notificationController.js';
import { uploadImage } from '../controllers/uploadController.js';
import { realtimeService } from '../services/realtimeService.js';
import { getExchangeRates } from '../controllers/currencyController.js';
import { strictActionLimiter, uploadLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public exchange rates endpoint
router.get('/currencies/rates', getExchangeRates);

// Public invite preview (allows unauthenticated guest preview with optional user context)
router.get('/trips/invite/:tripCode', optionalAuthMiddleware, getTripInvitePreview);

// Apply auth middleware to all protected API routes
router.use(authMiddleware);

// --- Real-time Server-Sent Events (SSE) ---
router.get('/realtime/stream', (req, res) => realtimeService.handleStream(req, res));
router.get('/trips/:tripId/stream', (req, res) => realtimeService.handleStream(req, res));

// --- Media & Cloudinary Upload (Rate-limited) ---
router.post('/upload', uploadLimiter, uploadImage);

// --- User Profile ---
router.get('/users/profile', getProfile);
router.put('/users/profile', updateProfile);
router.get('/users', getAllUsers);

// --- Friends & Social ---
router.get('/friends', getFriendsData);
router.post('/friends', addFriend);
router.delete('/friends/:friendId', removeFriend);
router.post('/friends/request', strictActionLimiter, sendFriendRequest);
router.post('/friends/accept', acceptFriendRequest);
router.post('/friends/reject', rejectFriendRequest);
router.post('/friends/cancel', cancelFriendRequest);
router.post('/friends/invite-trip', inviteFriendToTrip);

// --- Trips ---
router.post('/trips', createTrip);
router.get('/trips', getTrips);
router.post('/trips/join', strictActionLimiter, joinTrip);
router.get('/trips/:tripId', getTripById);
router.put('/trips/:tripId', updateTrip);
router.delete('/trips/:tripId', deleteTrip);
router.post('/trips/:tripId/complete', completeTrip);

// --- Members ---
router.get('/trips/:tripId/members', getMembers);
router.delete('/trips/:tripId/members/:userId', removeMember);

// --- Expenses ---
router.post('/trips/:tripId/expenses', addExpense);
router.get('/trips/:tripId/expenses', getExpenses);
router.get('/trips/:tripId/expenses/:expenseId', getExpenseById);
router.put('/trips/:tripId/expenses/:expenseId', updateExpense);
router.delete('/trips/:tripId/expenses/:expenseId', deleteExpense);

// --- Calculations & Invariants ---
router.get('/trips/:tripId/summary', getTripSummary);
router.get('/trips/:tripId/balances', getTripBalances);
router.get('/trips/:tripId/settlements', getTripSettlements);

// --- Payments & Settlements ---
router.get('/settlements/overview', getUserSettlementsOverview);
router.post('/trips/:tripId/settlements/:settlementId/pay', markAsPaid);
router.post('/trips/:tripId/settlements/:settlementId/confirm', confirmPayment);
router.post('/trips/:tripId/settlements/:settlementId/nudge', nudgeDebtor);
router.get('/trips/:tripId/settlements/history', getSettlementHistory);

// --- Notifications ---
router.get('/notifications', getNotifications);
router.put('/notifications/read-all', markAllAsRead);
router.put('/notifications/:notifId/read', markAsRead);
router.delete('/notifications/:notifId', deleteNotification);
router.delete('/notifications', clearAllNotifications);

export default router;
