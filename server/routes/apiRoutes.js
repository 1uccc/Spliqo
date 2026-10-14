import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  joinTrip,
  completeTrip
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
  getTripSettlements
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

const router = express.Router();

// Apply auth middleware to all protected API routes
router.use(authMiddleware);

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
router.post('/trips/:tripId/settlements/:settlementId/pay', markAsPaid);
router.post('/trips/:tripId/settlements/:settlementId/confirm', confirmPayment);
router.get('/trips/:tripId/settlements/history', getSettlementHistory);

export default router;
