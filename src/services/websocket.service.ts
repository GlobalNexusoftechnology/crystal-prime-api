import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyJwt } from '../utils/jwt';
import { NotificationService } from './notification.service';
import config from 'config';

export class WebSocketService {
  private io: SocketIOServer;
  private notificationService = NotificationService();
  private userSockets: Map<string, string[]> = new Map(); // userId -> socketIds

  constructor(server: HTTPServer) {
    const wsPort = config.get<number>('wsPort');
    
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.FRONTEND_URL 
          : 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    // Start WebSocket server on a separate port
    server.listen(wsPort, () => {
      console.log(`WebSocket server started on port ${wsPort}`);
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = verifyJwt<{ id: string }>(token, 'accessTokenPublicKey');
        if (!decoded) {
          return next(new Error('Authentication error'));
        }

        socket.data.userId = decoded.id;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      const userId = socket.data.userId;
      
      // Add socket to user's socket list
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, []);
      }
      this.userSockets.get(userId)?.push(socket.id);

      // Send existing notifications
      this.sendExistingNotifications(userId);

      socket.on('disconnect', () => {
        // Remove socket from user's socket list
        const sockets = this.userSockets.get(userId);
        if (sockets) {
          const index = sockets.indexOf(socket.id);
          if (index > -1) {
            sockets.splice(index, 1);
          }
          if (sockets.length === 0) {
            this.userSockets.delete(userId);
          }
        }
      });

      socket.on('markAsRead', async (notificationId: string) => {
        try {
          await this.notificationService.markAsRead(notificationId, userId);
          socket.emit('notificationRead', notificationId);
        } catch (error) {
          socket.emit('error', 'Failed to mark notification as read');
        }
      });

      socket.on('markAllAsRead', async () => {
        try {
          await this.notificationService.markAllAsRead(userId);
          socket.emit('allNotificationsRead');
        } catch (error) {
          socket.emit('error', 'Failed to mark all notifications as read');
        }
      });
    });
  }

  private async sendExistingNotifications(userId: string) {
    try {
      const notifications = await this.notificationService.getUserNotifications(userId);
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.forEach(socketId => {
          this.io.to(socketId).emit('notifications', notifications);
        });
      }
    } catch (error) {
      console.error('Error sending existing notifications:', error);
    }
  }

  public sendNotification(userId: string, notification: any) {
    try {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.forEach((socketId) => {
          this.io.to(socketId).emit("newNotification", notification);
        });
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      throw error;
    }
  }
} 

export let wsService: WebSocketService;

export const initWebSocket = (server: HTTPServer) => {
  wsService = new WebSocketService(server);
  return wsService;

} 