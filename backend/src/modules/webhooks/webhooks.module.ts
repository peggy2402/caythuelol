import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [ChatModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}

