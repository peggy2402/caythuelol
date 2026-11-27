import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CronService } from './cron.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Cron')
@Controller('cron')
export class CronController {
  constructor(private cronService: CronService) {}

  @Public()
  @Get('reminders/coaching')
  @ApiOperation({ summary: 'Trigger coaching reminder cron job' })
  async triggerCoachingReminder(@Query('force') force?: string) {
    const res = await this.cronService.handleCoachingReminders();
    return {
      success: true,
      message: 'Đã thực thi cron nhắc nhở coaching thành công',
      data: res,
    };
  }

  @Public()
  @Get('orders/expire')
  @ApiOperation({ summary: 'Trigger expired orders refund cron job' })
  async triggerExpireOrders(@Query('force') force?: string) {
    await this.cronService.handleExpireOrders();
    return {
      success: true,
      message: 'Đã quét và xử lý hoàn tiền đơn hàng quá hạn thành công',
    };
  }

  @Public()
  @Get('system/optimize')
  @ApiOperation({ summary: 'Trigger weekly system optimization and cache purge' })
  async triggerSystemOptimize(@Query('force') force?: string) {
    const res = await this.cronService.handleWeeklySystemOptimization(true);
    return {
      success: true,
      message: 'Đã thực thi tối ưu hóa hệ thống & dọn dẹp Cache thành công',
      data: res,
    };
  }

  @Public()
  @Get('system/optimization-status')
  @ApiOperation({ summary: 'Get optimization schedule info and countdown target' })
  async getOptimizationStatus() {
    const data = await this.cronService.getOptimizationStatus();
    return {
      success: true,
      data,
    };
  }
}

