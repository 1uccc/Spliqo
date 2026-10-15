import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { createRealtimeStream } from '../services/realtime';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const prevNotifIdsRef = useRef(new Set());
  const initialLoadRef = useRef(true);

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!currentUser?.uid) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      if (!silent) setLoading(true);
      const data = await api.get('/notifications');
      const list = data?.notifications || [];
      const unread = data?.unreadCount ?? list.filter(n => !n.read).length;

      // Detect brand new notifications to show toast
      if (!initialLoadRef.current && list.length > 0) {
        const newUnread = list.filter(n => !n.read && !prevNotifIdsRef.current.has(n.id));
        if (newUnread.length > 0) {
          const newest = newUnread[0];
          showToast(`🔔 ${newest.title}: ${newest.message}`, 'info');
        }
      }

      prevNotifIdsRef.current = new Set(list.map(n => n.id));
      initialLoadRef.current = false;
      setNotifications(list);
      setUnreadCount(unread);
    } catch {
      // Quiet fail on polling error
    } finally {
      if (!silent) setLoading(false);
    }
  }, [currentUser?.uid, showToast]);

  // Real-time SSE connection replacing 12-second polling
  useEffect(() => {
    if (!currentUser?.uid) {
      setNotifications([]);
      setUnreadCount(0);
      prevNotifIdsRef.current = new Set();
      initialLoadRef.current = true;
      return;
    }

    // Initial fetch
    fetchNotifications();

    // Establish real-time SSE stream
    const eventSource = createRealtimeStream();

    if (eventSource) {
      eventSource.addEventListener('NOTIFICATION_NEW', (event) => {
        try {
          const newNotif = JSON.parse(event.data);
          if (newNotif && newNotif.id) {
            setNotifications(prev => {
              if (prev.some(n => n.id === newNotif.id)) return prev;
              return [newNotif, ...prev];
            });
            setUnreadCount(prev => prev + 1);
            showToast(`🔔 ${newNotif.title}: ${newNotif.message}`, 'info');
          }
        } catch (err) {
          console.warn('[Notification SSE] Parse error:', err);
        }
      });
    }

    // Re-sync quietly when user returns to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchNotifications, currentUser?.uid, showToast]);

  const markAsRead = async (notifId) => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      await api.put(`/notifications/${notifId}/read`);
    } catch {
      fetchNotifications(true);
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      await api.put('/notifications/read-all');
    } catch {
      fetchNotifications(true);
    }
  };

  const deleteNotification = async (notifId) => {
    try {
      const target = notifications.find(n => n.id === notifId);
      setNotifications(prev => prev.filter(n => n.id !== notifId));
      if (target && !target.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      await api.delete(`/notifications/${notifId}`);
    } catch {
      fetchNotifications(true);
    }
  };

  const clearAll = async () => {
    try {
      setNotifications([]);
      setUnreadCount(0);
      await api.delete('/notifications');
    } catch {
      fetchNotifications(true);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
