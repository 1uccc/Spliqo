import { API_BASE_URL } from './api';

/**
 * Creates a Server-Sent Events (SSE) connection to Spliqo backend.
 * Automatically attaches auth token or mock user ID from localStorage.
 * 
 * @param {Object} options
 * @param {string} [options.tripId] Optional tripId to subscribe to trip-specific events
 * @returns {EventSource | null}
 */
export function createRealtimeStream({ tripId } = {}) {
  try {
    const token = localStorage.getItem('spliqo_token');
    const userId = localStorage.getItem('spliqo_user_id');

    if (!token && !userId) {
      return null;
    }

    const query = new URLSearchParams();
    if (token) {
      query.set('token', token);
    } else if (userId) {
      query.set('token', `mock_${userId}`);
    }

    if (userId) {
      query.set('userId', userId);
    }

    if (tripId) {
      query.set('tripId', tripId);
    }

    const streamUrl = `${API_BASE_URL}/realtime/stream?${query.toString()}`;
    const eventSource = new EventSource(streamUrl);

    return eventSource;
  } catch (err) {
    console.warn('[RealtimeStream] Failed to initialize EventSource:', err);
    return null;
  }
}
