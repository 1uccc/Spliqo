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
  getSettlementHistory
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

const router = express.Router();

// Public invite preview (allows unauthenticated guest preview with optional user context)
router.get('/trips/invite/:tripCode', optionalAuthMiddleware, getTripInvitePreview);

// Apply auth middleware to all protected API routes
router.use(authMiddleware);

// --- Media & Cloudinary Upload ---
router.post('/upload', uploadImage);

// --- User Profile ---
router.get('/users/profile', getProfile);
router.put('/users/profile', updateProfile);
router.get('/users', getAllUsers);

// --- Friends & Social ---
router.get('/friends', getFriendsData);
router.post('/friends', addFriend);
router.delete('/friends/:friendId', removeFriend);
router.post('/friends/request', sendFriendRequest);
router.post('/friends/accept', acceptFriendRequest);
router.post('/friends/invite-trip', inviteFriendToTrip);

// --- Trips ---
router.post('/trips', createTrip);
router.get('/trips', getTrips);
router.post('/trips/join', joinTrip);
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
router.get('/trips/:tripId/settlements/history', getSettlementHistory);

// --- Notifications ---
router.get('/notifications', getNotifications);
router.put('/notifications/read-all', markAllAsRead);
router.put('/notifications/:notifId/read', markAsRead);
router.delete('/notifications/:notifId', deleteNotification);
router.delete('/notifications', clearAllNotifications);

export default router;
