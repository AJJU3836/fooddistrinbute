import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      setConnected(false);
      return;
    }

    const token = localStorage.getItem('token');
    const socket = io('/', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      console.log('🟢 Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('🔴 Socket disconnected');
    });

    // Food events
    socket.on('food:new', (data) => {
      toast.success(`🍽️ ${data.message}`, { duration: 5000 });
      addNotification({ type: 'food:new', ...data });
    });

    socket.on('food:claimed', (data) => {
      toast.success(`✅ ${data.message}`, { duration: 5000 });
      addNotification({ type: 'food:claimed', ...data });
    });

    socket.on('food:status', (data) => {
      const emoji = data.status === 'delivered' ? '🎉' : data.status === 'in-transit' ? '🚚' : '📋';
      toast(`${emoji} Food status: ${data.foodType} → ${data.status.toUpperCase()}`, {
        duration: 4000,
        style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' },
      });
      addNotification({ type: 'food:status', ...data });
    });

    socket.on('analytics:update', (data) => {
      addNotification({ type: 'analytics', ...data });
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const addNotification = (notif) => {
    setNotifications(prev => [{ id: Date.now(), ...notif }, ...prev].slice(0, 50));
  };

  const clearNotifications = () => setNotifications([]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, notifications, clearNotifications }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
