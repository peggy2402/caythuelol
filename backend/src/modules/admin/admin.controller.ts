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
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ReqUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../database/schemas/User';
import { getClientIp } from '../../common/utils/ip.util';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Roles(UserRole.ADMIN)
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

  @Roles(UserRole.ADMIN)
  @Post('users/:id/balance')
  @ApiOperation({ summary: 'Admin manually adjust wallet balance' })
  async adjustBalance(
    @Param('id') userId: string,
    @Body('amount') amount: number,
    @Body('type') type?: 'ADD' | 'SUBTRACT',
    @Body('reason') reason?: string,
    @Body('note') note?: string,
    @ReqUser() admin?: any,
    @Req() req?: any,
  ) {
    return this.adminService.adjustBalance(userId, amount, type, reason || note, admin?.userId, req);
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

  @Roles(UserRole.ADMIN)
  @Post('boosters/demote')
  @ApiOperation({ summary: 'Demote booster to customer' })
  async demoteBooster(
    @Body('userId') userId: string,
    @Body('reason') reason?: string,
  ): Promise<any> {
    return this.adminService.demoteBooster(userId, reason);
  }

  @Roles(UserRole.ADMIN)
  @Post('boosters/create')
  @ApiOperation({ summary: 'Admin create or promote user to booster' })
  async createBooster(@Body() body: any): Promise<any> {
    return this.adminService.createBooster(body);
  }

  @Roles(UserRole.ADMIN)
  @Patch('boosters/:id/profile')
  @ApiOperation({ summary: 'Admin edit booster profile information' })
  async editBoosterProfile(
    @Param('id') userId: string,
    @Body() body: any,
  ): Promise<any> {
    return this.adminService.editBoosterProfile(userId, body);
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
  async handleWithdrawalAction(
    @Body() dto: any,
    @ReqUser() admin?: any,
    @Req() req?: any,
  ): Promise<any> {
    const res = await this.adminService.handleWithdrawalAction(dto);
    if (admin?.userId) {
      this.adminService.createAuditLog({
        actorId: admin.userId,
        action: 'WITHDRAWAL_ACTION',
        description: `${dto.action === 'APPROVE' ? 'Duyệt' : 'Từ chối'} yêu cầu rút tiền #${dto.withdrawalId || ''}`,
        metadata: dto,
        ipAddress: getClientIp(req),
      });
    }
    return res;
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
  async rejectTransaction(
    @Body('transactionId') id: string,
    @Body('reason') reason?: string,
    @ReqUser() admin?: any,
    @Req() req?: any,
  ): Promise<any> {
    const res = await this.adminService.rejectTransaction(id, reason);
    if (admin?.userId) {
      this.adminService.createAuditLog({
        actorId: admin.userId,
        action: 'REJECT_TRANSACTION',
        description: `Từ chối giao dịch #${id}: ${reason || 'Không hợp lệ'}`,
        metadata: { transactionId: id, reason },
        ipAddress: getClientIp(req),
      });
    }
    return res;
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
    @ReqUser() admin?: any,
    @Req() req?: any,
  ) {
    const res = await this.adminService.resolveDispute(orderId, decision);
    if (admin?.userId) {
      this.adminService.createAuditLog({
        actorId: admin.userId,
        action: 'RESOLVE_DISPUTE',
        description: `Xử lý khiếu nại đơn #${orderId}: ${decision}`,
        metadata: { orderId, decision },
        ipAddress: getClientIp(req),
      });
    }
    return res;
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
  @Get('games-metrics')
  @ApiOperation({ summary: 'Get real orders, ratings and boosters statistics per game' })
  async getGameMetrics(): Promise<any> {
    return this.adminService.getGameMetrics();
  }

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
    @ReqUser() admin?: any,
    @Req() req?: any,
  ): Promise<any> {
    const res = await this.adminService.updateSetting(key, value, description);
    if (admin?.userId) {
      this.adminService.createAuditLog({
        actorId: admin.userId,
        action: 'UPDATE_SETTING',
        description: `Cập nhật cấu hình [${key}]${description ? ` - ${description}` : ''}`,
        metadata: { key, value },
        ipAddress: getClientIp(req),
      });
    }
    return res;
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update system setting (PUT)' })
  async updateSettingPut(
    @Body('key') key: string,
    @Body('value') value: any,
    @Body('description') description?: string,
    @ReqUser() admin?: any,
    @Req() req?: any,
  ): Promise<any> {
    const res = await this.adminService.updateSetting(key, value, description);
    if (admin?.userId) {
      this.adminService.createAuditLog({
        actorId: admin.userId,
        action: 'UPDATE_SETTING',
        description: `Cập nhật cấu hình [${key}]${description ? ` - ${description}` : ''}`,
        metadata: { key, value },
        ipAddress: getClientIp(req),
      });
    }
    return res;
  }

  @Roles(UserRole.ADMIN)
  @ApiTags('Riot Games')
  @Get('settings/riot')
  @ApiOperation({ summary: 'Lấy cấu hình Riot API Key hiện tại (Admin)' })
  async getRiotKey(): Promise<any> {
    return this.adminService.getRiotKey();
  }

  @Roles(UserRole.ADMIN)
  @ApiTags('Riot Games')
  @Post('settings/riot')
  @ApiOperation({ summary: 'Cập nhật Riot Games API Key (Admin)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        apiKey: {
          type: 'string',
          example: 'RGAPI-12345678-abcd-ef01-2345-6789abcdef01',
          description: 'Riot Games API Key (Development key 24h hoặc Production Key)',
        },
      },
      required: ['apiKey'],
    },
  })
  async saveRiotKey(
    @Body('apiKey') apiKey: string,
    @ReqUser() admin?: any,
    @Req() req?: any,
  ): Promise<any> {
    const res = await this.adminService.saveRiotKey(apiKey);
    if (admin?.userId) {
      this.adminService.createAuditLog({
        actorId: admin.userId,
        action: 'UPDATE_RIOT_KEY',
        description: 'Cập nhật Riot Games API Key',
        ipAddress: getClientIp(req),
      });
    }
    return res;
  }

  @Roles(UserRole.ADMIN)
  @ApiTags('Valorant')
  @Get('settings/valorant')
  @ApiOperation({ summary: 'Lấy cấu hình Valorant HenrikDev API Key hiện tại (Admin)' })
  async getValorantKey(): Promise<any> {
    return this.adminService.getValorantKey();
  }

  @Roles(UserRole.ADMIN)
  @ApiTags('Valorant')
  @Post('settings/valorant')
  @ApiOperation({ summary: 'Cập nhật Valorant HenrikDev API Key (Admin)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        apiKey: {
          type: 'string',
          example: 'HDEV-6f73cf76-7954-4fbe-bf3d-31eff121579c',
          description: 'HenrikDev Valorant API Key',
        },
      },
      required: ['apiKey'],
    },
  })
  async saveValorantKey(
    @Body('apiKey') apiKey: string,
    @ReqUser() admin?: any,
    @Req() req?: any,
  ): Promise<any> {
    const res = await this.adminService.saveValorantKey(apiKey);
    if (admin?.userId) {
      this.adminService.createAuditLog({
        actorId: admin.userId,
        action: 'UPDATE_VALORANT_KEY',
        description: 'Cập nhật Valorant HenrikDev API Key',
        ipAddress: getClientIp(req),
      });
    }
    return res;
  }

  // --- QUẢN LÝ NHÂN VIÊN (STAFF & PERMISSIONS) ---

  @Roles(UserRole.ADMIN)
  @Get('staffs')
  @ApiOperation({ summary: 'List all staff members and admins' })
  async listStaffs(@Query('search') search?: string): Promise<any> {
    return this.adminService.listStaffs(search);
  }

  @Roles(UserRole.ADMIN)
  @Post('staffs')
  @ApiOperation({ summary: 'Assign staff role to user or create new staff' })
  async assignStaff(@Body() body: any): Promise<any> {
    return this.adminService.assignStaff(body);
  }

  @Roles(UserRole.ADMIN)
  @Patch('staffs/:userId/permissions')
  @ApiOperation({ summary: 'Update staff member permissions' })
  async updateStaffPermissions(
    @Param('userId') userId: string,
    @Body('permissions') permissions: string[],
  ): Promise<any> {
    return this.adminService.updateStaffPermissions(userId, permissions);
  }

  @Roles(UserRole.ADMIN)
  @Post('staffs/:userId/remove')
  @ApiOperation({ summary: 'Revoke staff role and revert to customer' })
  async removeStaff(@Param('userId') userId: string): Promise<any> {
    return this.adminService.removeStaff(userId);
  }
}


