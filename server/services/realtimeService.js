/**
 * Real-time SSE (Server-Sent Events) Service for Spliqo
 * Manages push subscriptions for trip updates (expenses, settlements, members)
 * and user notifications, eliminating aggressive polling.
 */

class RealtimeService {
  constructor() {
    // Map<tripId, Set<{ res: Response, userId: string }>>
    this.tripSubscribers = new Map();
    // Map<userId, Set<Response>>
    this.userSubscribers = new Map();

    // Heartbeat every 25 seconds to keep connections alive and prevent proxy timeouts
    this._heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 25000);

    // Unref heartbeat timer so it does not hold the Node process open in test runners
    if (this._heartbeatInterval.unref) {
      this._heartbeatInterval.unref();
    }
  }

  /**
   * Sends SSE comment heartbeat to all connected clients
   */
  sendHeartbeat() {
    const comment = ': keep-alive\n\n';
    for (const [, clients] of this.userSubscribers) {
      for (const res of clients) {
        try {
          res.write(comment);
        } catch {
          // Closed sockets will be cleaned up on 'close' event
        }
      }
    }
  }

  /**
   * Handles an incoming SSE connection request
   */
  handleStream(req, res) {
    const userId = req.user?.uid;
    const tripId = req.params?.tripId || req.query?.tripId || null;

    // Set standard SSE response headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable proxy buffering (Nginx/Render)
      'Access-Control-Allow-Origin': '*'
    });

    // Suggest client reconnect in 3s if disconnected
    res.write('retry: 3000\n\n');

    // Send initial connection handshake
    const handshake = {
      status: 'connected',
      userId: userId || null,
      tripId: tripId || null,
      timestamp: new Date().toISOString()
    };
    res.write(`event: connected\ndata: ${JSON.stringify(handshake)}\n\n`);

    // Subscribe to user notification channel
    if (userId) {
      if (!this.userSubscribers.has(userId)) {
        this.userSubscribers.set(userId, new Set());
      }
      this.userSubscribers.get(userId).add(res);
    }

    // Subscribe to trip channel if requested
    const tripClient = { res, userId };
    if (tripId) {
      if (!this.tripSubscribers.has(tripId)) {
        this.tripSubscribers.set(tripId, new Set());
      }
      this.tripSubscribers.get(tripId).add(tripClient);
    }

    // Cleanup resources on disconnect
    req.on('close', () => {
      if (userId && this.userSubscribers.has(userId)) {
        this.userSubscribers.get(userId).delete(res);
        if (this.userSubscribers.get(userId).size === 0) {
          this.userSubscribers.delete(userId);
        }
      }

      if (tripId && this.tripSubscribers.has(tripId)) {
        this.tripSubscribers.get(tripId).delete(tripClient);
        if (this.tripSubscribers.get(tripId).size === 0) {
          this.tripSubscribers.delete(tripId);
        }
      }
    });
  }

  /**
   * Broadcasts an event to all users actively viewing a specific trip
   * @param {string} tripId
   * @param {string} eventType ('EXPENSE_ADDED' | 'EXPENSE_UPDATED' | 'EXPENSE_DELETED' | 'SETTLEMENT_UPDATED' | 'MEMBER_UPDATED' | 'TRIP_UPDATED')
   * @param {Object} data
   */
  broadcastToTrip(tripId, eventType, data = {}) {
    if (!tripId || !this.tripSubscribers.has(tripId)) return 0;
    const clients = this.tripSubscribers.get(tripId);
    if (!clients || clients.size === 0) return 0;

    const payload = `event: ${eventType}\ndata: ${JSON.stringify({
      ...data,
      tripId,
      timestamp: new Date().toISOString()
    })}\n\n`;

    let sentCount = 0;
    for (const client of clients) {
      try {
        client.res.write(payload);
        sentCount++;
      } catch (err) {
        console.warn(`[RealtimeService] Error broadcasting event to trip ${tripId}:`, err.message);
      }
    }
    return sentCount;
  }

  /**
   * Pushes a real-time event/notification to a specific user across all their open tabs
   * @param {string} userId
   * @param {string} eventType ('NOTIFICATION_NEW')
   * @param {Object} data
   */
  sendToUser(userId, eventType, data = {}) {
    if (!userId || !this.userSubscribers.has(userId)) return 0;
    const clients = this.userSubscribers.get(userId);
    if (!clients || clients.size === 0) return 0;

    const payload = `event: ${eventType}\ndata: ${JSON.stringify({
      ...data,
      timestamp: new Date().toISOString()
    })}\n\n`;

    let sentCount = 0;
    for (const res of clients) {
      try {
        res.write(payload);
        sentCount++;
      } catch (err) {
        console.warn(`[RealtimeService] Error sending event to user ${userId}:`, err.message);
      }
    }
    return sentCount;
  }

  /**
   * Clean up timer resources (useful during tests)
   */
  destroy() {
    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
      this._heartbeatInterval = null;
    }
  }
}

export const realtimeService = new RealtimeService();
