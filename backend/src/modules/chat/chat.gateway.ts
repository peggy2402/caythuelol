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

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly onlineUsers = new Map<string, Set<string>>();
  private readonly socketToUser = new Map<string, string>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
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
    this.registerUserOnline(client, userId);
    this.logger.log(`Socket ${client.id} joined user channel: user_${userId}`);
    return { status: 'joined', userId };
  }

  @SubscribeMessage('join_user_room')
  handleJoinUserRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: string,
  ) {
    this.registerUserOnline(client, userId);
    this.logger.log(`Socket ${client.id} joined user channel: user_${userId}`);
    return { status: 'joined', userId };
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
}
