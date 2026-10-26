import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const ORACLE_VM_REALTIME_URL =
  (import.meta.env.VITE_ORACLE_REALTIME_URL as string | undefined) ||
  (import.meta.env.DEV ? 'http://localhost:3000' : typeof window !== 'undefined' ? window.location.origin : '');

const socket: Socket = io(ORACLE_VM_REALTIME_URL, {
  transports: ['polling', 'websocket'],
  path: '/api/socket.io',
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export type SocketContextType = {
  socket: Socket;
  isPlanPlusOrAbove: boolean;
  isConnected: boolean;
  oracleVmUrl: string;
};

const SocketContext = createContext<SocketContextType>({
  socket,
  isPlanPlusOrAbove: true,
  isConnected: false,
  oracleVmUrl: ORACLE_VM_REALTIME_URL,
});

export const getSocket = (): Socket => socket;

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Try reading token from localStorage or cookies
    const token = localStorage.getItem('token') || localStorage.getItem('ap_token');
    const projectId = localStorage.getItem('projectId') || 'default';

    if (token) {
      socket.auth = {
        token,
        projectId,
      };
    }

    socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isPlanPlusOrAbove: true,
        isConnected,
        oracleVmUrl: ORACLE_VM_REALTIME_URL,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => useContext(SocketContext);
export const useSocket = () => useContext(SocketContext).socket;
