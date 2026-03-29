import { io } from 'socket.io-client';
import { getAccessToken } from '../utils/sessionToken';

// Reuse a singleton socket instance across the app
let socket = null;

export const initSocket = (token) => {
  if (socket) return socket;

  const url = process.env.REACT_APP_API_SOCKET_URL || process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // parse token that might be stored as JSON string (support session-aware key)
  let parsedToken = token || getAccessToken() || null;
  try {
    if (typeof parsedToken === 'string' && parsedToken.startsWith('"')) parsedToken = JSON.parse(parsedToken);
  } catch (e) {
    // ignore
  }

  socket = io(url, {
    auth: {
      token: parsedToken,
    },
    transports: ['websocket', 'polling'],
    withCredentials: true,
  });

  socket.on('connect', () => {
    console.log('[socket] connected', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[socket] disconnected', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('[socket] connect_error', err?.message || err);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (!socket) return;
  socket.disconnect();
  socket = null;
};

// Admin namespace socket - separate connection for dashboard listeners
let adminSocket = null;
export const initAdminSocket = (token) => {
  if (adminSocket) return adminSocket;
  const url = process.env.REACT_APP_API_SOCKET_URL || process.env.REACT_APP_API_URL || 'http://localhost:3001';
  let parsedToken = token || getAccessToken() || null;
  try {
    if (typeof parsedToken === 'string' && parsedToken.startsWith('"')) parsedToken = JSON.parse(parsedToken);
  } catch (e) {
    // ignore
  }
  adminSocket = io(url + '/chat/admin', {
    auth: { token: parsedToken },
    transports: ['websocket', 'polling'],
    withCredentials: true,
  });

  adminSocket.on('connect', () => console.log('[admin socket] connected', adminSocket.id));
  adminSocket.on('disconnect', (reason) => console.log('[admin socket] disconnected', reason));
  adminSocket.on('connect_error', (err) => console.warn('[admin socket] connect_error', err?.message || err));
  return adminSocket;
};

export const getAdminSocket = () => adminSocket;
