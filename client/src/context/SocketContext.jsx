import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && token) {
      const newSocket = io('http://localhost:5000', {
        auth: { token }
      });

      newSocket.on('connect', () => {
        console.log('✅ Połączono z serwerem WebSocket');
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Rozłączono z serwerem WebSocket');
        setConnected(false);
      });

      newSocket.on('error', (error) => {
        console.error('Błąd WebSocket:', error);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else if (socket) {
      socket.close();
      setSocket(null);
      setConnected(false);
    }
  }, [isAuthenticated, token]);

  const joinRoom = (roomId) => {
    if (socket && connected) {
      socket.emit('join_room', roomId);
    }
  };

  const leaveRoom = (roomId) => {
    if (socket && connected) {
      socket.emit('leave_room', roomId);
    }
  };

  const sendGroupMessage = (groupId, message) => {
    if (socket && connected) {
      socket.emit('send_group_message', { groupId, message });
    }
  };

  const sendEventMessage = (eventId, message) => {
    if (socket && connected) {
      socket.emit('send_event_message', { eventId, message });
    }
  };

  const value = {
    socket,
    connected,
    joinRoom,
    leaveRoom,
    sendGroupMessage,
    sendEventMessage
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

