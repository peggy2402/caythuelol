import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/schemas/User';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get global admin dashboard statistics' })
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users with pagination' })
  async listUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.adminService.listUsers(Number(page || 1), Number(limit || 20), search);
  }

  @Patch('users/:id/ban')
  @ApiOperation({ summary: 'Ban or unban a user' })
  async toggleBan(@Param('id') userId: string, @Body('isBanned') isBanned: boolean) {
    return this.adminService.toggleBanUser(userId, isBanned);
  }

  @Post('users/:id/balance')
  @ApiOperation({ summary: 'Admin manually adjust wallet balance' })
  async adjustBalance(
    @Param('id') userId: string,
    @Body('amount') amount: number,
    @Body('note') note: string,
  ) {
    return this.adminService.adjustBalance(userId, amount, note);
  }

  @Get('boosters/applications')
  @ApiOperation({ summary: 'List booster onboarding applications' })
  async listApplications() {
    return this.adminService.listBoosterApplications();
  }

  @Post('boosters/applications/:id/approve')
  @ApiOperation({ summary: 'Approve booster application' })
  async approveBooster(@Param('id') appId: string) {
    return this.adminService.approveBooster(appId);
  }

  @Post('boosters/applications/:id/reject')
  @ApiOperation({ summary: 'Reject booster application' })
  async rejectBooster(@Param('id') appId: string, @Body('note') note?: string) {
    return this.adminService.rejectBooster(appId, note);
  }

  @Get('disputes')
  @ApiOperation({ summary: 'List order disputes' })
  async listDisputes() {
    return this.adminService.listDisputes();
  }

  @Post('disputes/resolve')
  @ApiOperation({ summary: 'Resolve an order dispute' })
  async resolveDispute(
    @Body('orderId') orderId: string,
    @Body('decision') decision: 'REFUND_CUSTOMER' | 'PAY_BOOSTER' | 'RESUME',
  ) {
    return this.adminService.resolveDispute(orderId, decision);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get platform system settings' })
  async getSettings() {
    return this.adminService.getSettings();
  }

  @Post('settings')
  @ApiOperation({ summary: 'Update system setting' })
  async updateSetting(
    @Body('key') key: string,
    @Body('value') value: any,
    @Body('description') description?: string,
  ) {
    return this.adminService.updateSetting(key, value, description);
  }
}
