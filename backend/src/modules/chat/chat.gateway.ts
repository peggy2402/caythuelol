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

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
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
    client.join(`user_${userId}`);
    this.logger.log(`Socket ${client.id} joined user channel: user_${userId}`);
    return { status: 'joined', userId };
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; username: string },
  ) {
    client.to(`order_${data.orderId}`).emit('user_typing', data);
  }

  @SubscribeMessage('stop_typing')
  handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; username: string },
  ) {
    client.to(`order_${data.orderId}`).emit('user_stop_typing', data);
  }

  broadcastMessageToOrder(orderId: string, message: any) {
    this.server.to(`order_${orderId}`).emit('new_message', message);
  }

  broadcastBalanceUpdate(userId: string, balance: number, message: string) {
    this.server.to(`user_${userId}`).emit('balance_updated', { balance, message });
  }
}

