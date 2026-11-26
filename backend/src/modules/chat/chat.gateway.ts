import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

const allowedOrigins = (process.env.CORS_ORIGINS || 'https://leorank.site,http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

@WebSocketGateway({
  cors: {
    origin: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
      // Cho phép requests không có origin (mobile, internal)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.leorank.site') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(new Error(`WebSocket CORS blocked origin: ${origin}`), false);
    },
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly onlineUsers = new Map<string, Set<string>>();
  private readonly socketToUser = new Map<string, string>();

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    
    // Tự động xác thực JWT từ handshake (auth.token hoặc cookie hoặc header)
    try {
      const token = this.extractTokenFromSocket(client);
      if (token) {
        const payload = this.jwtService.verify(token);
        const userId = payload.userId || payload._id || payload.sub;
        if (userId) {
          client.data.userId = userId.toString();
          client.data.role = payload.role;
          this.registerUserOnline(client, client.data.userId);
          this.logger.log(`🔐 Socket ${client.id} authenticated as user_${client.data.userId}`);
        }
      }
    } catch (err: any) {
      // Token không hợp lệ hoặc hết hạn, client vẫn kết nối dạng ẩn danh
    }
  }

  private extractTokenFromSocket(client: Socket): string | null {
    // 1. Handshake auth { token: "..." }
    const authToken = client.handshake.auth?.token;
    if (authToken && typeof authToken === 'string') {
      return authToken.replace(/^Bearer\s+/i, '');
    }

    // 2. Handshake authorization header
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader && typeof authHeader === 'string') {
      return authHeader.replace(/^Bearer\s+/i, '');
    }

    // 3. Cookie token
    const cookieHeader = client.handshake.headers?.cookie;
    if (cookieHeader && typeof cookieHeader === 'string') {
      const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
      if (match) return decodeURIComponent(match[1]);
    }

    return null;
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const userId = this.socketToUser.get(client.id);
    if (userId) {
      this.socketToUser.delete(client.id);
      const sockets = this.onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.onlineUsers.delete(userId);
          this.server.emit('user_status', { userId, status: 'offline' });
        }
      }
    }
  }

  private registerUserOnline(client: Socket, userId: string) {
    if (!userId) return;
    const id = userId.toString();
    client.join(`user_${id}`);
    this.socketToUser.set(client.id, id);

    let sockets = this.onlineUsers.get(id);
    const wasOffline = !sockets || sockets.size === 0;
    if (!sockets) {
      sockets = new Set();
      this.onlineUsers.set(id, sockets);
    }
    sockets.add(client.id);

    if (wasOffline) {
      this.server.emit('user_status', { userId: id, status: 'online' });
    }
  }

  @SubscribeMessage('join_order')
  handleJoinOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() orderId: string,
  ) {
    client.join(`order_${orderId}`);
    this.logger.log(`Socket ${client.id} joined room: order_${orderId}`);
    return { status: 'joined', orderId };
  }

  @SubscribeMessage('join_order_room')
  handleJoinOrderRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() orderId: string,
  ) {
    client.join(`order_${orderId}`);
    this.logger.log(`Socket ${client.id} joined room: order_${orderId}`);
    return { status: 'joined', orderId };
  }

  @SubscribeMessage('leave_order')
  handleLeaveOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() orderId: string,
  ) {
    client.leave(`order_${orderId}`);
    return { status: 'left', orderId };
  }

  @SubscribeMessage('join_user')
  handleJoinUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: string,
  ) {
    return this.handleJoinUserRoom(client, userId);
  }

  @SubscribeMessage('join_user_room')
  handleJoinUserRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: string,
  ) {
    const authenticatedUserId = client.data?.userId;
    const role = client.data?.role;
    const isStaffOrAdmin = role === 'ADMIN' || role === 'STAFF';

    // Kiểm tra bảo mật: Nếu đã xác thực JWT, không cho phép join room của user khác (trừ Admin/Staff)
    if (authenticatedUserId && userId && authenticatedUserId !== userId && !isStaffOrAdmin) {
      this.logger.warn(`🚫 Unauthorized join_user_room attempt: Socket ${client.id} (${authenticatedUserId}) tried to join user_${userId}`);
      return { status: 'forbidden', message: 'Cannot join another user room' };
    }

    const targetUserId = authenticatedUserId || userId;
    if (targetUserId) {
      this.registerUserOnline(client, targetUserId);
      this.logger.log(`Socket ${client.id} joined user channel: user_${targetUserId}`);
    }
    return { status: 'joined', userId: targetUserId };
  }

  @SubscribeMessage('check_online')
  handleCheckOnline(
    @ConnectedSocket() client: Socket,
    @MessageBody() targetUserId: string,
  ) {
    if (!targetUserId) return { status: 'offline' };
    const id = targetUserId.toString();
    const isOnline = (this.onlineUsers.get(id)?.size || 0) > 0;
    const status = isOnline ? 'online' : 'offline';
    client.emit('user_status', { userId: id, status });
    return { userId: id, status };
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      orderId?: string;
      room?: string;
      username?: string;
      userId?: string;
      isTyping?: boolean;
    },
  ) {
    const roomId = data.orderId || data.room;
    if (!roomId) return;
    client.to(`order_${roomId}`).emit('user_typing', data);
    if (typeof data.isTyping === 'boolean') {
      client.to(`order_${roomId}`).emit('typing_status', {
        userId: data.userId,
        isTyping: data.isTyping,
      });
    }
  }

  @SubscribeMessage('stop_typing')
  handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; username: string },
  ) {
    client.to(`order_${data.orderId}`).emit('user_stop_typing', data);
  }

  @SubscribeMessage('mark_read')
  handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; userId: string },
  ) {
    if (!data?.orderId || !data?.userId) return;
    client.to(`order_${data.orderId}`).emit('message_read', {
      orderId: data.orderId,
      userId: data.userId,
    });
  }

  @SubscribeMessage('mark_delivered')
  handleMarkDelivered(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; userId: string },
  ) {
    if (!data?.orderId || !data?.userId) return;
    client.to(`order_${data.orderId}`).emit('message_delivered', {
      orderId: data.orderId,
      userId: data.userId,
    });
  }

  isUserOnline(userId: string): boolean {
    if (!userId) return false;
    const sockets = this.onlineUsers.get(userId.toString());
    return Boolean(sockets && sockets.size > 0);
  }

  private formatOrderRooms(orderId: string | string[]): string | string[] {
    if (Array.isArray(orderId)) {
      return orderId.map((id) => `order_${id}`);
    }
    return `order_${orderId}`;
  }

  broadcastMessageToOrder(orderId: string | string[], message: any) {
    this.server.to(this.formatOrderRooms(orderId)).emit('new_message', message);
  }

  broadcastMessageDeleted(
    orderId: string | string[],
    payload: { messageId: string; orderId: string },
  ) {
    this.server.to(this.formatOrderRooms(orderId)).emit('message_deleted', payload);
  }

  broadcastMessageReacted(
    orderId: string | string[],
    payload: { messageId: string; reactions: any[] },
  ) {
    this.server.to(this.formatOrderRooms(orderId)).emit('message_reacted', payload);
  }

  broadcastMessageRead(
    orderId: string | string[],
    payload: { orderId: string; userId: string },
  ) {
    this.server.to(this.formatOrderRooms(orderId)).emit('message_read', payload);
  }

  broadcastMessageDelivered(
    orderId: string | string[],
    payload: { orderId: string; userId: string },
  ) {
    this.server.to(this.formatOrderRooms(orderId)).emit('message_delivered', payload);
  }

  broadcastBalanceUpdate(userId: string, balance: number, message: string) {
    this.server.to(`user_${userId}`).emit('balance_updated', { balance, message });
    this.server.to(`user_${userId}`).emit('wallet_update', { balance, message });
  }

  broadcastNotification(userId: string, notification: any) {
    if (!userId || !this.server) return;
    this.server.to(`user_${userId.toString()}`).emit('notification', notification);
  }

  broadcastBoosterJobsUpdated(userId?: string) {
    if (!this.server) return;
    if (userId) {
      this.server.to(`user_${userId.toString()}`).emit('booster_jobs_updated', { timestamp: Date.now() });
    } else {
      this.server.emit('booster_jobs_updated', { timestamp: Date.now() });
    }
  }
}
