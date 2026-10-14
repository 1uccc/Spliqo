import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const prevNotifIdsRef = useRef(new Set());
  const initialLoadRef = useRef(true);

  const fetchNotifications = async (silent = false) => {
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
    } catch (e) {
      // Quiet fail on polling error
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Initial fetch and polling every 12 seconds
  useEffect(() => {
    if (!currentUser?.uid) {
      setNotifications([]);
      setUnreadCount(0);
      prevNotifIdsRef.current = new Set();
      initialLoadRef.current = true;
      return;
    }

    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 12000);

    return () => clearInterval(interval);
  }, [currentUser?.uid]);

  const markAsRead = async (notifId) => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      await api.put(`/notifications/${notifId}/read`);
    } catch (e) {
      fetchNotifications(true);
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      await api.put('/notifications/read-all');
    } catch (e) {
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
    } catch (e) {
      fetchNotifications(true);
    }
  };

  const clearAll = async () => {
    try {
      setNotifications([]);
      setUnreadCount(0);
      await api.delete('/notifications');
    } catch (e) {
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
