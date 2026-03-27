import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { setIO } from '../services/notificationService.js';

export const initSockets = (io) => {
  // Register io reference in notification service
  setIO(io);

  // Middleware: authenticate socket connections via JWT
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user || !user.isActive) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`🔌 Socket connected: ${user.name} [${user.role}] — ${socket.id}`);

    // Join personal room for direct notifications
    socket.join(`user:${user._id}`);

    // Join role rooms
    if (user.role === 'ngo') socket.join('ngos');
    if (user.role === 'admin') socket.join('admins');
    if (user.role === 'donor') socket.join('donors');

    // Client confirms delivery
    socket.on('delivery:confirm', async ({ assignmentId }) => {
      socket.broadcast.to('admins').emit('delivery:confirmed', { assignmentId, by: user.name });
    });

    // Client requests manual refresh ping
    socket.on('ping:refresh', () => {
      socket.emit('pong:refresh', { timestamp: new Date() });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${user.name} — ${socket.id}`);
    });
  });
};
