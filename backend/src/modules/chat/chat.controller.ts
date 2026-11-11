import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ReqUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Chat & Messages')
@Controller('orders/:id/messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get()
  @ApiOperation({ summary: 'Get order chat messages' })
  async getMessages(@Param('id') orderId: string) {
    return this.chatService.getMessages(orderId);
  }

  @Post()
  @ApiOperation({ summary: 'Send message to order chat room' })
  async sendMessage(
    @Param('id') orderId: string,
    @ReqUser() user: any,
    @Body('content') content: string,
    @Body('type') type?: 'TEXT' | 'IMAGE' | 'COMMAND_RESULT',
    @Body('replyToId') replyToId?: string,
  ) {
    return this.chatService.sendMessage(orderId, user.userId, content, type, replyToId);
  }

  @Post(':messageId/react')
  @ApiOperation({ summary: 'React to a message with emoji' })
  async reactMessage(
    @Param('messageId') messageId: string,
    @ReqUser() user: any,
    @Body('emoji') emoji: string,
  ) {
    return this.chatService.reactMessage(messageId, user.userId, emoji);
  }
}
