import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

interface SolverRequest {
  type: 'scenario' | 'push-fold' | 'multi-way';
  data: any;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url = import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
    autoConnect = true,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Initialize socket
  useEffect(() => {
    if (autoConnect && !socketRef.current) {
      const socket = io(url, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      socket.on('connect', () => {
        setIsConnected(true);
        setError(null);
        onConnect?.();
      });

      socket.on('disconnect', (reason) => {
        setIsConnected(false);
        onDisconnect?.();
      });

      socket.on('connect_error', (err) => {
        setError(err);
        onError?.(err);
      });

      socketRef.current = socket;
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [url, autoConnect, onConnect, onDisconnect, onError]);

  // Connect manually
  const connect = useCallback(() => {
    if (socketRef.current && !socketRef.current.connected) {
      socketRef.current.connect();
    }
  }, []);

  // Disconnect manually
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  }, []);

  // Join a room
  const joinRoom = useCallback((roomId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('room:join', roomId);
    }
  }, []);

  // Leave a room
  const leaveRoom = useCallback((roomId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('room:leave', roomId);
    }
  }, []);

  // Request solver calculation
  const requestSolver = useCallback(
    (request: SolverRequest): Promise<any> => {
      return new Promise((resolve, reject) => {
        if (!socketRef.current || !socketRef.current.connected) {
          reject(new Error('Socket not connected'));
          return;
        }

        socketRef.current.emit('solver:request', request, (response: any) => {
          if (response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response.error || 'Solver request failed'));
          }
        });
      });
    },
    []
  );

  // Request ICM calculation
  const requestICM = useCallback(
    (stacks: number[], payouts: number[], playerIndex: number = 0): Promise<any> => {
      return new Promise((resolve, reject) => {
        if (!socketRef.current || !socketRef.current.connected) {
          reject(new Error('Socket not connected'));
          return;
        }

        socketRef.current.emit('icm:calculate', { stacks, payouts, playerIndex }, (response: any) => {
          if (response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response.error || 'ICM calculation failed'));
          }
        });
      });
    },
    []
  );

  // Subscribe to events
  const subscribe = useCallback(
    (event: string, callback: (data: any) => void) => {
      if (socketRef.current) {
        socketRef.current.on(event, callback);
      }

      return () => {
        if (socketRef.current) {
          socketRef.current.off(event, callback);
        }
      };
    },
    []
  );

  // Emit events
  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    error,
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    requestSolver,
    requestICM,
    subscribe,
    emit,
  };
}

