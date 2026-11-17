import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VipService } from './vip.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ReqUser } from '../../common/decorators/current-user.decorator';

@ApiTags('VIP Membership')
@Controller('vip')
export class VipController {
  constructor(private readonly vipService: VipService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Lấy danh sách các gói VIP và bảng đặc quyền' })
  async getPlans() {
    return this.vipService.getPlans();
  }

  @Get('my-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy trạng thái VIP hiện tại của người dùng' })
  async getMyStatus(@ReqUser() user: any) {
    return this.vipService.getMyStatus(user.userId);
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng ký hoặc gia hạn gói VIP bằng số dư ví' })
  async subscribe(@ReqUser() user: any, @Body('planId') planId: string) {
    return this.vipService.subscribe(user.userId, planId);
  }
}
