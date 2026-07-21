import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { getStoredToken } from '../services/api.js';
import { notificationApi } from '../services/api.js';
import { resolveApiBaseUrl } from '../utils/apiBaseUrl.js';

const SocketContext = createContext(null);

const SOCKET_URL = resolveApiBaseUrl().replace(/\/api\/v1\/?$/, '');

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [orderUpdatedHandlers, setOrderUpdatedHandlers] = useState([]);

  const refreshNotifications = useCallback(async () => {
    try {
      const response = await notificationApi.getNotifications();
      setNotifications(response.data?.notifications || []);
      setUnreadCount(response.data?.unreadCount || 0);
    } catch {
      // ignore when logged out
    }
  }, []);

  const onOrderUpdated = useCallback((handler) => {
    setOrderUpdatedHandlers((prev) => [...prev, handler]);
    return () => {
      setOrderUpdatedHandlers((prev) => prev.filter((h) => h !== handler));
    };
  }, []);

  useEffect(() => {
    const token = getStoredToken();

    if (!token) {
      return undefined;
    }

    refreshNotifications();

    const socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('notification:new', (notification) => {
      setNotifications((current) => [notification, ...current].slice(0, 50));
      setUnreadCount((count) => count + 1);
    });

    socketInstance.on('order:created', () => {
      refreshNotifications();
    });

    socketInstance.on('order:updated', (order) => {
      orderUpdatedHandlers.forEach((handler) => handler(order));
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [refreshNotifications, orderUpdatedHandlers]);

  const markRead = async (id) => {
    await notificationApi.markRead(id);
    setNotifications((current) =>
      current.map((item) => (item._id === id ? { ...item, read: true } : item))
    );
    setUnreadCount((count) => Math.max(0, count - 1));
  };

  const markAllRead = async () => {
    await notificationApi.markAllRead();
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
  };

  return (
    <SocketContext.Provider
      value={{ socket, notifications, unreadCount, refreshNotifications, markRead, markAllRead, onOrderUpdated }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
