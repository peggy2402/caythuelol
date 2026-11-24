import { Module } from '@nestjs/common';
import { BoostersService } from './boosters.service';
import { BoostersController } from './boosters.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [NotificationsModule, ChatModule],
  controllers: [BoostersController],
  providers: [BoostersService],
  exports: [BoostersService],
})
export class BoostersModule {}

