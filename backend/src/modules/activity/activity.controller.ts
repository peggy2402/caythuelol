import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ActivityService, ActivityFeedItem } from './activity.service';

@ApiTags('Activity')
@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('feed')
  @ApiOperation({
    summary: 'Lấy danh sách hoạt động trực tiếp gần đây (Social Proof Ticker)',
    description: 'Mô hình Hybrid kết hợp dữ liệu thật từ MongoDB và cơ chế bù đắp thông minh khi vắng khách.',
  })
  @ApiQuery({
    name: 'pureReal',
    required: false,
    type: Boolean,
    description: 'Nếu là true: Chỉ trả về 100% dữ liệu thật từ DB, bỏ qua dữ liệu mô phỏng.',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách hoạt động thời gian thực',
  })
  async getActivityFeed(
    @Query('pureReal') pureReal?: string,
  ): Promise<{ success: boolean; data: ActivityFeedItem[]; meta?: { pureReal: boolean; realCount: number; simulatedCount: number } }> {
    const isPureReal = pureReal === 'true' || pureReal === '1';
    const result = await this.activityService.getActivityFeed(isPureReal);
    return {
      success: true,
      data: result.data,
      meta: result.meta,
    };
  }
}
