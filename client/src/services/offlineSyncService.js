import api from './api';

const QUEUE_STORAGE_KEY = 'spliqo_offline_expense_queue';
const CACHE_PREFIX = 'spliqo_cached_trip_';

class OfflineSyncService {
  constructor() {
    this.isSyncing = false;

    // Listen for connection restored event
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[OfflineSync] Connection restored! Triggering auto-sync...');
        this.syncOfflineQueue();
      });

      // Try auto-sync on initialization if network is already online
      setTimeout(() => {
        if (navigator.onLine && this.getQueueCount() > 0) {
          this.syncOfflineQueue();
        }
      }, 2000);
    }
  }

  /**
   * Retrieves all offline queued expenses awaiting sync
   * @returns {Array<{ queueId: string, tripId: string, expensePayload: Object, createdAt: string }>}
   */
  getOfflineQueue() {
    try {
      const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('[OfflineSync] Failed to read queue from localStorage:', e);
      return [];
    }
  }

  /**
   * Returns current count of pending offline items
   */
  getQueueCount() {
    return this.getOfflineQueue().length;
  }

  /**
   * Enqueues a new expense created while offline
   * @param {string} tripId
   * @param {Object} expensePayload
   * @returns {string} unique queue ID
   */
  enqueueExpense(tripId, expensePayload) {
    const queue = this.getOfflineQueue();
    const queueId = `offline_queue_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newItem = {
      queueId,
      tripId,
      expensePayload,
      createdAt: new Date().toISOString()
    };

    queue.push(newItem);
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
      this._emitQueueChanged(queue.length);
    } catch (e) {
      console.error('[OfflineSync] Failed to save queued expense:', e);
    }

    return queueId;
  }

  /**
   * Removes a successfully synced item from the queue
   * @param {string} queueId
   */
  removeQueueItem(queueId) {
    let queue = this.getOfflineQueue();
    queue = queue.filter(item => item.queueId !== queueId);
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
      this._emitQueueChanged(queue.length);
    } catch (e) {
      console.error('[OfflineSync] Failed to update queue:', e);
    }
  }

  /**
   * Caches a complete trip snapshot locally for offline viewing in remote areas
   * @param {string} tripId
   * @param {Object} tripData
   */
  cacheTrip(tripId, tripData) {
    if (!tripId || !tripData) return;
    try {
      const key = `${CACHE_PREFIX}${tripId}`;
      const payload = {
        trip: tripData,
        cachedAt: new Date().toISOString()
      };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
      console.warn(`[OfflineSync] Cache quota exceeded for trip ${tripId}:`, e);
    }
  }

  /**
   * Retrieves locally cached trip snapshot
   * @param {string} tripId
   * @returns {Object | null}
   */
  getCachedTrip(tripId) {
    if (!tripId) return null;
    try {
      const key = `${CACHE_PREFIX}${tripId}`;
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed.trip || null;
    } catch {
      return null;
    }
  }

  /**
   * Synchronizes all queued expenses with backend server
   * @returns {Promise<{ syncedCount: number, remaining: number }>}
   */
  async syncOfflineQueue() {
    if (this.isSyncing || !navigator.onLine) {
      return { syncedCount: 0, remaining: this.getQueueCount() };
    }

    const queue = this.getOfflineQueue();
    if (queue.length === 0) {
      return { syncedCount: 0, remaining: 0 };
    }

    this.isSyncing = true;
    let syncedCount = 0;

    console.log(`[OfflineSync] Starting sync for ${queue.length} offline expenses...`);

    for (const item of queue) {
      try {
        await api.post(`/trips/${item.tripId}/expenses`, item.expensePayload);
        this.removeQueueItem(item.queueId);
        syncedCount++;
      } catch (err) {
        console.warn(`[OfflineSync] Error syncing item ${item.queueId}:`, err.message);
        // If it's a network disconnect error, stop loop and wait for next online event
        if (!navigator.onLine || err.message?.includes('Network Error') || err.message?.includes('Failed to fetch')) {
          break;
        }
        // If it's a 400 validation error (e.g. invalid members), remove or keep based on policy
        if (err.message && (err.message.includes('không tìm thấy') || err.message.includes('không hợp lệ'))) {
          this.removeQueueItem(item.queueId);
        }
      }
    }

    this.isSyncing = false;
    const remaining = this.getQueueCount();

    if (syncedCount > 0 && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('spliqo:offline-sync-completed', {
          detail: { syncedCount, remaining }
        })
      );
    }

    return { syncedCount, remaining };
  }

  _emitQueueChanged(count) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('spliqo:offline-queue-changed', {
          detail: { count }
        })
      );
    }
  }
}

export const offlineSyncService = new OfflineSyncService();
