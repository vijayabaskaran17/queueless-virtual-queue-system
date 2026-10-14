import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let socketInstance = null;

    if (isAuthenticated && token) {
      let socketTarget = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.trim() : '/';
      if (socketTarget && socketTarget !== '/' && !socketTarget.startsWith('http://') && !socketTarget.startsWith('https://')) {
        socketTarget = `https://${socketTarget}`;
      }
      socketInstance = io(socketTarget, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      socketInstance.on('connect', () => {
        setIsConnected(true);
      });

      socketInstance.on('disconnect', () => {
        setIsConnected(false);
      });

      socketInstance.on('connect_error', (err) => {
        console.warn('Socket connection note:', err.message);
        setIsConnected(false);
      });

      setSocket(socketInstance);
    } else {
      if (socket) {
        socket.disconnect();
      }
      setSocket(null);
      setIsConnected(false);
    }

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [token, isAuthenticated]);

  const joinService = (serviceId) => {
    if (socket && serviceId) {
      socket.emit('join:service', serviceId);
    }
  };

  const leaveService = (serviceId) => {
    if (socket && serviceId) {
      socket.emit('leave:service', serviceId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinService, leaveService }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext) || { socket: null, isConnected: false };
};
