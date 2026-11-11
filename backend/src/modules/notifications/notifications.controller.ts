import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ReqUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user notifications and unread count' })
  async getNotifications(@ReqUser() user: any) {
    return this.notificationsService.getUserNotifications(user.userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@ReqUser() user: any) {
    return this.notificationsService.markAllAsRead(user.userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark specific notification as read' })
  async markOneAsRead(@ReqUser() user: any, @Param('id') id: string) {
    return this.notificationsService.markOneAsRead(user.userId, id);
  }
}
