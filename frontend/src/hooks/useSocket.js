import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

let socketInstance = null;

export const getSocket = () => socketInstance;

export const initSocket = () => {
  const token = localStorage.getItem('ct_token');
  if (!token) return null;
  if (socketInstance?.connected) return socketInstance;
  socketInstance = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
    auth: { token }, transports: ['websocket'], reconnection: true,
  });
  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) { socketInstance.disconnect(); socketInstance = null; }
};

export const useProjectSocket = (projectId, handlers = {}) => {
  const ref = useRef(handlers);
  ref.current = handlers;
  useEffect(() => {
    if (!projectId) return;
    const socket = initSocket();
    if (!socket) return;
    socket.emit('join:project', projectId);
    const events = ['task:created','task:updated','task:deleted','task:reordered','project:updated','project:member_added','project:member_removed'];
    events.forEach(evt => socket.on(evt, (data) => { if (ref.current[evt]) ref.current[evt](data); }));
    return () => { socket.emit('leave:project', projectId); events.forEach(evt => socket.off(evt)); };
  }, [projectId]);
};

export const useNotificationSocket = (onNotification) => {
  const ref = useRef(onNotification);
  ref.current = onNotification;
  useEffect(() => {
    const socket = initSocket();
    if (!socket) return;
    const handler = (data) => { if (ref.current) ref.current(data); };
    socket.on('notification:new', handler);
    return () => socket.off('notification:new', handler);
  }, []);
};
