import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService, BoosterChatStatusCode } from './chat.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ReqUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Chat & Messages')
@Controller('orders/:id/messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private chatService: ChatService) {}

  // ===========================================================================
  // CHỨC NĂNG DÙNG CHUNG (Customer của đơn, Booster của đơn, Admin)
  // ===========================================================================

  @Get()
  @ApiOperation({
    summary: '[Customer & Booster] Lấy lịch sử tin nhắn và danh sách quyền theo vai trò trong đơn',
  })
  async getMessages(@Param('id') orderId: string, @ReqUser() user: any) {
    return this.chatService.getMessages(orderId, user.userId, user.role);
  }

  @Post()
  @ApiOperation({
    summary: '[Customer & Booster] Gửi tin nhắn chữ, ảnh hoặc lệnh chat theo đúng vai trò',
    description:
      'Dùng chung: tin nhắn chữ, ảnh (folder chat), /order. Chỉ Customer: /tip <số tiền>. Chỉ Booster: /status hoặc /live, /progress.',
  })
  async sendMessage(
    @Param('id') orderId: string,
    @ReqUser() user: any,
    @Body('content') content: string,
    @Body('type') type?: 'TEXT' | 'IMAGE' | 'COMMAND_RESULT',
    @Body('replyToId') replyToId?: string,
    @Body('metadata') metadata?: any,
  ) {
    return this.chatService.sendMessage(
      orderId,
      user.userId,
      user.role,
      content,
      type,
      replyToId,
      metadata,
    );
  }

  @Post('read')
  @ApiOperation({ summary: '[Customer & Booster] Đánh dấu đã đọc tin nhắn trong phòng chat' })
  async markAsRead(@Param('id') orderId: string, @ReqUser() user: any) {
    return this.chatService.markAsRead(orderId, user.userId, user.role);
  }

  @Post('order-info')
  @ApiOperation({ summary: '[Customer & Booster] Gửi thẻ tóm tắt thông tin đơn hàng vào phòng chat' })
  async sendOrderInfo(@Param('id') orderId: string, @ReqUser() user: any) {
    return this.chatService.sendOrderInfoCard(orderId, user.userId, user.role);
  }

  @Post(':messageId/react')
  @ApiOperation({ summary: '[Customer & Booster] Thả / gỡ cảm xúc trên tin nhắn' })
  async reactMessage(
    @Param('id') orderId: string,
    @Param('messageId') messageId: string,
    @ReqUser() user: any,
    @Body('emoji') emoji: string,
  ) {
    return this.chatService.reactMessage(
      orderId,
      messageId,
      user.userId,
      user.role,
      emoji,
    );
  }

  @Delete(':messageId')
  @ApiOperation({ summary: '[Chính chủ | Admin] Thu hồi tin nhắn trong phòng chat' })
  async deleteMessage(
    @Param('id') orderId: string,
    @Param('messageId') messageId: string,
    @ReqUser() user: any,
  ) {
    return this.chatService.deleteMessage(
      orderId,
      messageId,
      user.userId,
      user.role,
    );
  }

  // ===========================================================================
  // CHỨC NĂNG CHỈ DÀNH CHO CUSTOMER (Khách hàng chủ đơn)
  // ===========================================================================

  @Post('tip')
  @ApiOperation({
    summary: '[Customer only] Khách hàng gửi tiền Tip trực tiếp cho Booster phụ trách đơn',
  })
  async sendTip(
    @Param('id') orderId: string,
    @ReqUser() user: any,
    @Body('amount') amount: number,
    @Body('note') note?: string,
  ) {
    return this.chatService.sendTip(orderId, user.userId, user.role, amount, note);
  }

  // ===========================================================================
  // CHỨC NĂNG CHỈ DÀNH CHO BOOSTER (Tuyển thủ nhận đơn)
  // ===========================================================================

  @Post('booster-status')
  @ApiOperation({
    summary: '[Booster only] Tuyển thủ gửi thẻ cập nhật trạng thái cày cho khách hàng',
  })
  async sendBoosterStatus(
    @Param('id') orderId: string,
    @ReqUser() user: any,
    @Body('statusCode') statusCode: BoosterChatStatusCode,
    @Body('note') note?: string,
  ) {
    return this.chatService.sendBoosterStatus(
      orderId,
      user.userId,
      user.role,
      statusCode,
      note,
    );
  }

  @Post('progress')
  @ApiOperation({
    summary: '[Booster only] Tuyển thủ gửi thẻ báo cáo tiến độ trận đấu của đơn hàng',
  })
  async sendProgressReport(
    @Param('id') orderId: string,
    @ReqUser() user: any,
    @Body('note') note?: string,
  ) {
    return this.chatService.sendProgressReport(orderId, user.userId, user.role, note);
  }
}
