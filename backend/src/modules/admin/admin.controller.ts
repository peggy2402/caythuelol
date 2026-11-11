import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
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
import { ReqUser } from '../../common/decorators/current-user.decorator';
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
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<any> {
    return this.adminService.getStats(startDate, endDate);
  }

  // 1. Quản lý Người dùng & Booster
  @Get('users')
  @ApiOperation({ summary: 'List all users with pagination' })
  async listUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ): Promise<any> {
    return this.adminService.listUsers(Number(page || 1), Number(limit || 20), search);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get detailed user info by id' })
  async getUserById(@Param('id') id: string): Promise<any> {
    return this.adminService.getUserById(id);
  }

  @Get('users/:id/stats')
  @ApiOperation({ summary: 'Get user transactions & orders statistics' })
  async getUserStats(@Param('id') id: string): Promise<any> {
    return this.adminService.getUserStats(id);
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

  @Get('boosters')
  @ApiOperation({ summary: 'List boosters or booster applications' })
  async getBoosters(@Query() query: any): Promise<any> {
    return this.adminService.getBoosters(query);
  }

  @Patch('boosters/:id')
  @ApiOperation({ summary: 'Update booster application status (approve/reject)' })
  async updateBoosterApplication(
    @Param('id') id: string,
    @Body('status') status: 'approved' | 'rejected',
    @Body('note') note?: string,
  ): Promise<any> {
    if (status === 'approved') {
      return this.adminService.approveBooster(id);
    } else {
      return this.adminService.rejectBooster(id, note);
    }
  }

  @Post('boosters/demote')
  @ApiOperation({ summary: 'Demote booster to customer' })
  async demoteBooster(
    @Body('userId') userId: string,
    @Body('reason') reason?: string,
  ): Promise<any> {
    return this.adminService.demoteBooster(userId, reason);
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

  // 2. Quản lý Đơn hàng
  @Get('orders')
  @ApiOperation({ summary: 'List orders with pagination & filters' })
  async getOrders(@Query() query: any): Promise<any> {
    return this.adminService.getOrders(query);
  }

  // 3. Quản lý Bài viết (Blogs)
  @Get('blogs')
  @ApiOperation({ summary: 'List all blogs for admin CMS' })
  async getBlogs(): Promise<any> {
    return this.adminService.getBlogs();
  }

  @Post('blogs')
  @ApiOperation({ summary: 'Create new blog post' })
  async createBlog(@Body() dto: any, @ReqUser() user: any): Promise<any> {
    return this.adminService.createBlog(dto, user.userId);
  }

  @Put('blogs/:id')
  @ApiOperation({ summary: 'Update blog post' })
  async updateBlog(@Param('id') id: string, @Body() dto: any): Promise<any> {
    return this.adminService.updateBlog(id, dto);
  }

  @Delete('blogs/:id')
  @ApiOperation({ summary: 'Delete blog post' })
  async deleteBlog(@Param('id') id: string): Promise<any> {
    return this.adminService.deleteBlog(id);
  }

  // 4. Quản lý Rút tiền (Withdrawals)
  @Get('withdrawals')
  @ApiOperation({ summary: 'List withdrawal requests' })
  async getWithdrawals(@Query() query: any): Promise<any> {
    return this.adminService.getWithdrawals(query);
  }

  @Post('withdrawals/action')
  @ApiOperation({ summary: 'Approve or reject a withdrawal request' })
  async handleWithdrawalAction(@Body() dto: any): Promise<any> {
    return this.adminService.handleWithdrawalAction(dto);
  }

  // 5. Quản lý Tiền cọc (Escrow Deposits)
  @Get('deposits')
  @ApiOperation({ summary: 'List held deposit orders' })
  async getDeposits(): Promise<any> {
    return this.adminService.getDeposits();
  }

  // 6. Quản lý Giao dịch (Transactions)
  @Get('transactions')
  @ApiOperation({ summary: 'List platform transactions' })
  async getTransactions(@Query() query: any): Promise<any> {
    return this.adminService.getTransactions(query);
  }

  @Get('transactions/:id')
  @ApiOperation({ summary: 'Get transaction details' })
  async getTransactionById(@Param('id') id: string): Promise<any> {
    return this.adminService.getTransactionById(id);
  }

  @Post('transactions/reject')
  @ApiOperation({ summary: 'Reject a transaction' })
  async rejectTransaction(@Body('transactionId') id: string, @Body('reason') reason?: string): Promise<any> {
    return this.adminService.rejectTransaction(id, reason);
  }

  // 7. Nhật ký hệ thống (Audit Logs)
  @Get('audit-logs')
  @ApiOperation({ summary: 'Get platform audit logs' })
  async getAuditLogs(@Query('page') page?: number, @Query('limit') limit?: number): Promise<any> {
    return this.adminService.getAuditLogs(Number(page || 1), Number(limit || 20));
  }

  // 8. Quản lý Khiếu nại (Disputes)
  @Get('disputes')
  @ApiOperation({ summary: 'List order disputes' })
  async listDisputes(@Query('status') status?: string): Promise<any> {
    return this.adminService.getDisputes(status);
  }

  @Post('disputes/resolve')
  @ApiOperation({ summary: 'Resolve an order dispute' })
  async resolveDispute(
    @Body('orderId') orderId: string,
    @Body('decision') decision: 'REFUND_CUSTOMER' | 'PAY_BOOSTER' | 'RESUME',
  ) {
    return this.adminService.resolveDispute(orderId, decision);
  }

  @Post('disputes/note')
  @ApiOperation({ summary: 'Update admin internal note for order dispute' })
  async updateDisputeNote(
    @Body('orderId') orderId: string,
    @Body('note') note: string,
  ): Promise<any> {
    return this.adminService.updateDisputeNote(orderId, note);
  }

  // 9. Cài đặt hệ thống (Settings)
  @Get('settings')
  @ApiOperation({ summary: 'Get platform system settings list' })
  async getSettings(): Promise<any> {
    return this.adminService.getSettings();
  }

  @Post('settings')
  @ApiOperation({ summary: 'Update system setting' })
  async updateSetting(
    @Body('key') key: string,
    @Body('value') value: any,
    @Body('description') description?: string,
  ): Promise<any> {
    return this.adminService.updateSetting(key, value, description);
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update system setting (PUT)' })
  async updateSettingPut(
    @Body('key') key: string,
    @Body('value') value: any,
    @Body('description') description?: string,
  ): Promise<any> {
    return this.adminService.updateSetting(key, value, description);
  }

  @Get('settings/riot')
  @ApiOperation({ summary: 'Get Riot API key' })
  async getRiotKey(): Promise<any> {
    return this.adminService.getRiotKey();
  }

  @Post('settings/riot')
  @ApiOperation({ summary: 'Save Riot API key' })
  async saveRiotKey(@Body('apiKey') apiKey: string): Promise<any> {
    return this.adminService.saveRiotKey(apiKey);
  }
}


