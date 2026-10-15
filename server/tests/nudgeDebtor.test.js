import { describe, it, expect, beforeEach } from 'vitest';
import { dbService } from '../services/dbService.js';
import { nudgeDebtor } from '../controllers/paymentController.js';

describe('Smart Nudge Debtor Tests', () => {
  const tripId = 'trip_nudge_test';
  const debtorId = 'user_debtor';
  const creditorId = 'user_creditor';
  const thirdPartyId = 'user_stranger';
  const settlementId = 'settle_debtor_creditor_1';

  beforeEach(() => {
    // Reset test data in dbService
    dbService.data.trips = {
      [tripId]: {
        id: tripId,
        name: 'Chuyến đi Đà Lạt',
        creatorId: creditorId,
        members: [creditorId, debtorId]
      }
    };
    dbService.data.users = {
      [creditorId]: {
        uid: creditorId,
        displayName: 'Minh Chủ Nợ',
        bankName: 'VCB',
        bankAccountNumber: '1234567890',
        bankAccountHolder: 'MINH CHU NO'
      },
      [debtorId]: {
        uid: debtorId,
        displayName: 'An Con Nợ'
      }
    };
    dbService.data.members = {
      [tripId]: [
        { userId: creditorId, displayName: 'Minh Chủ Nợ' },
        { userId: debtorId, displayName: 'An Con Nợ' }
      ]
    };
    dbService.data.expenses = {
      [tripId]: []
    };
    dbService.data.settlements = {
      [tripId]: [
        {
          id: settlementId,
          fromUserId: debtorId,
          toUserId: creditorId,
          amount: 250000,
          status: 'PENDING'
        }
      ]
    };
    dbService.data.notifications = {};
  });

  it('allows creditor to send a smart nudge and generates in-app notification', async () => {
    let responseStatus = 200;
    let responseBody = null;
    const req = {
      params: { tripId, settlementId },
      user: { uid: creditorId, displayName: 'Minh Chủ Nợ' },
      body: {
        message: 'Ting ting giúp mình 250k chuyến Đà Lạt nhé!',
        tone: 'gentle'
      }
    };
    const res = {
      status: (code) => {
        responseStatus = code;
        return res;
      },
      json: (data) => {
        responseBody = data;
        return data;
      }
    };

    await nudgeDebtor(req, res);

    expect(responseStatus).toBe(200);
    expect(responseBody.success).toBe(true);
    expect(responseBody.settlement.nudgeCount).toBe(1);
    expect(responseBody.settlement.lastNudgedAt).toBeDefined();

    // Verify debtor received notification in dbService
    const debtorNotifs = dbService.getNotifications(debtorId);
    expect(debtorNotifs.length).toBe(1);
    expect(debtorNotifs[0].type).toBe('PAYMENT_NUDGE');
    expect(debtorNotifs[0].message).toContain('250k');
    expect(debtorNotifs[0].actor.uid).toBe(creditorId);
  });

  it('blocks spamming nudges within debounce time with status 429', async () => {
    // Set settlement as just nudged 5 seconds ago
    dbService.data.settlements[tripId][0].lastNudgedAt = new Date().toISOString();

    let responseStatus = 200;
    let responseBody = null;
    const req = {
      params: { tripId, settlementId },
      user: { uid: creditorId, displayName: 'Minh Chủ Nợ' },
      body: {}
    };
    const res = {
      status: (code) => {
        responseStatus = code;
        return res;
      },
      json: (data) => {
        responseBody = data;
        return data;
      }
    };

    await nudgeDebtor(req, res);

    expect(responseStatus).toBe(429);
    expect(responseBody.error).toContain('Vui lòng đợi');
  });

  it('rejects nudges from unauthorized users with status 403', async () => {
    let responseStatus = 200;
    let responseBody = null;
    const req = {
      params: { tripId, settlementId },
      user: { uid: thirdPartyId, displayName: 'Người lạ' },
      body: {}
    };
    const res = {
      status: (code) => {
        responseStatus = code;
        return res;
      },
      json: (data) => {
        responseBody = data;
        return data;
      }
    };

    await nudgeDebtor(req, res);

    expect(responseStatus).toBe(403);
    expect(responseBody.error).toBeDefined();
  });

  it('rejects nudges on already CONFIRMED settlements with status 400', async () => {
    dbService.data.settlements[tripId][0].status = 'CONFIRMED';

    let responseStatus = 200;
    let responseBody = null;
    const req = {
      params: { tripId, settlementId },
      user: { uid: creditorId, displayName: 'Minh Chủ Nợ' },
      body: {}
    };
    const res = {
      status: (code) => {
        responseStatus = code;
        return res;
      },
      json: (data) => {
        responseBody = data;
        return data;
      }
    };

    await nudgeDebtor(req, res);

    expect(responseStatus).toBe(400);
    expect(responseBody.error).toContain('đã được thanh toán');
  });
});
