import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { handleSolverRequest } from './handlers';

export interface SocketData {
  userId?: string;
  roomId?: string;
  sessionId?: string;
}

export class WebSocketServer {
  private io: SocketIOServer;
  private connectedClients: Map<string, Socket> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupEventHandlers();
    logger.info('WebSocket server initialized');
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      const clientId = socket.id;
      this.connectedClients.set(clientId, socket);
      logger.info('Client connected', { clientId, totalClients: this.connectedClients.size });

      // Handle solver requests
      socket.on('solver:request', async (data, callback) => {
        try {
          const result = await handleSolverRequest(data);
          if (callback) {
            callback({ success: true, data: result });
          } else {
            socket.emit('solver:response', { success: true, data: result });
          }
        } catch (error: any) {
          logger.error('Solver request error', { error: error.message, clientId });
          if (callback) {
            callback({ success: false, error: error.message });
          } else {
            socket.emit('solver:error', { error: error.message });
          }
        }
      });

      // Handle ICM calculations
      socket.on('icm:calculate', async (data, callback) => {
        try {
          const { stacks, payouts, playerIndex } = data;
          // Import here to avoid circular dependencies
          const { ICMCalculator } = await import('../services/icmCalculator');
          const result = ICMCalculator.calculateICM(stacks, payouts, playerIndex);
          
          if (callback) {
            callback({ success: true, data: result });
          } else {
            socket.emit('icm:result', { success: true, data: result });
          }
        } catch (error: any) {
          logger.error('ICM calculation error', { error: error.message, clientId });
          if (callback) {
            callback({ success: false, error: error.message });
          } else {
            socket.emit('icm:error', { error: error.message });
          }
        }
      });

      // Handle room joining
      socket.on('room:join', (roomId: string) => {
        socket.join(roomId);
        socket.data.roomId = roomId;
        logger.info('Client joined room', { clientId, roomId });
        socket.emit('room:joined', { roomId });
        socket.to(roomId).emit('room:user_joined', { clientId });
      });

      // Handle room leaving
      socket.on('room:leave', (roomId: string) => {
        socket.leave(roomId);
        logger.info('Client left room', { clientId, roomId });
        socket.to(roomId).emit('room:user_left', { clientId });
      });

      // Handle real-time scenario updates
      socket.on('scenario:update', (data) => {
        const { roomId, scenario } = data;
        if (roomId) {
          socket.to(roomId).emit('scenario:updated', { scenario, updatedBy: clientId });
        }
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        this.connectedClients.delete(clientId);
        logger.info('Client disconnected', { clientId, reason, totalClients: this.connectedClients.size });
        
        // Notify room members
        if (socket.data.roomId) {
          socket.to(socket.data.roomId).emit('room:user_left', { clientId });
        }
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error('Socket error', { clientId, error });
      });
    });
  }

  public broadcastToRoom(roomId: string, event: string, data: any): void {
    this.io.to(roomId).emit(event, data);
  }

  public emitToClient(clientId: string, event: string, data: any): void {
    const socket = this.connectedClients.get(clientId);
    if (socket) {
      socket.emit(event, data);
    }
  }

  public getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  public getRoomClientsCount(roomId: string): number {
    return this.io.sockets.adapter.rooms.get(roomId)?.size || 0;
  }
}

let webSocketServerInstance: WebSocketServer | null = null;

export function initializeWebSocket(httpServer: HTTPServer): WebSocketServer {
  if (!webSocketServerInstance) {
    webSocketServerInstance = new WebSocketServer(httpServer);
  }
  return webSocketServerInstance;
}

export function getWebSocketServer(): WebSocketServer | null {
  return webSocketServerInstance;
}

