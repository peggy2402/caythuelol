import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ActivityService, ActivityFeedItem } from './activity.service';

@ApiTags('Activity')
@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('feed')
  @ApiOperation({
    summary: 'Lấy danh sách hoạt động trực tiếp gần đây (Social Proof Ticker)',
    description: 'Bao gồm nạp tiền QR, đặt đơn cày rank, đánh giá 5 sao, bình luận bài viết.',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách hoạt động thời gian thực',
  })
  async getActivityFeed(): Promise<{ success: boolean; data: ActivityFeedItem[] }> {
    const data = await this.activityService.getActivityFeed();
    return {
      success: true,
      data,
    };
  }
}
