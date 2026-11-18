import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RankingService } from './ranking.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ReqUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../../database/schemas/User';

@ApiTags('Ranking')
@Controller('ranking')
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Public()
  @Get('config')
  @ApiOperation({ summary: 'Lấy cấu hình trọng số và cấp bậc Tier' })
  async getConfig() {
    return this.rankingService.getConfig();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Put('config')
  @ApiOperation({ summary: 'Admin cập nhật cấu hình trọng số và cấp bậc' })
  async updateConfig(@ReqUser() user: any, @Body() dto: any) {
    return this.rankingService.updateConfig(user.userId, dto);
  }

  @Public()
  @Get('leaderboard')
  @ApiOperation({ summary: 'Lấy bảng xếp hạng Booster theo game và thời gian' })
  async getLeaderboard(
    @Query('gameCode') gameCode?: string,
    @Query('timeframe') timeframe?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.rankingService.getLeaderboard({ gameCode, timeframe, page, limit });
  }

  @Public()
  @Get('booster/:id')
  @ApiOperation({ summary: 'Xem chi tiết điểm năng lực và lịch sử xếp hạng của Booster' })
  async getBoosterRankingDetail(@Param('id') boosterId: string) {
    return this.rankingService.getBoosterRankingDetail(boosterId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('recalculate/:id')
  @ApiOperation({ summary: 'Tính toán lại điểm năng lực cho Booster' })
  async recalculate(@Param('id') boosterId: string) {
    return this.rankingService.calculateBoosterPerformance(boosterId, 'MANUAL_TRIGGER');
  }
}
