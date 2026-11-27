import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Query,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ReqUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/schemas/User';
import { OrderStatus } from '../../database/schemas/Order';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create and checkout an order' })
  async createOrder(@ReqUser() user: any, @Body() body: any) {
    return this.ordersService.checkout(user.userId, body);
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Checkout and book an order' })
  async checkout(@ReqUser() user: any, @Body() body: any) {
    return this.ordersService.checkout(user.userId, body);
  }

  @Get()
  @ApiOperation({ summary: 'Get current customer orders list' })
  async listCustomerOrders(@ReqUser() user: any) {
    return this.ordersService.listCustomerOrders(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details by ID or custom code' })
  async getOrderDetails(@Param('id') id: string, @ReqUser() user: any) {
    return this.ordersService.getOrderDetails(id, user.userId, user.role);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Customer cancels order before booster starts and gets full refund' })
  async cancelOrder(
    @Param('id') id: string,
    @ReqUser() user: any,
    @Body('reason') reason?: string,
  ) {
    return this.ordersService.cancelOrder(id, user.userId, reason);
  }

  @Patch(':id/account')
  @ApiOperation({ summary: 'Customer updates account credentials before booster starts' })
  async updateAccount(
    @Param('id') id: string,
    @ReqUser() user: any,
    @Body() body: any,
  ) {
    return this.ordersService.updateOrderAccount(id, user.userId, body);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.BOOSTER)
  @Post(':id/confirm')
  @ApiOperation({ summary: 'Booster takes an order' })
  async confirmOrder(@Param('id') id: string, @ReqUser() user: any) {
    return this.ordersService.confirmOrder(id, user.userId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.BOOSTER)
  @Post(':id/respond')
  @ApiOperation({ summary: 'Booster approves or rejects an available/direct order' })
  async respondOrder(
    @Param('id') id: string,
    @ReqUser() user: any,
    @Body('action') action: 'approve' | 'reject',
    @Body('reason') reason?: string,
  ) {
    return this.ordersService.respondOrder(id, user.userId, action, reason);
  }

  @Post(':id/handover')
  @ApiOperation({ summary: 'Booster requests to handover/transfer an IN_PROGRESS order to another booster' })
  async handoverOrder(
    @Param('id') id: string,
    @ReqUser() user: any,
    @Body('reason') reason: string,
    @Body('currentProgress') currentProgress?: string,
  ) {
    return this.ordersService.handoverOrder(id, user.userId, reason, currentProgress);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.BOOSTER)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Booster updates status to IN_PROGRESS' })
  async updateStatus(
    @Param('id') id: string,
    @ReqUser() user: any,
    @Body('status') status: OrderStatus,
  ) {
    return this.ordersService.updateOrderStatus(id, user.userId, status);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.BOOSTER)
  @Post(':id/complete')
  @ApiOperation({ summary: 'Booster completes order and releases funds' })
  async completeOrder(
    @Param('id') id: string,
    @ReqUser() user: any,
    @Body() body?: { actualLP?: number; actualRank?: string; note?: string },
  ) {
    return this.ordersService.completeOrder(id, user.userId, body);
  }

  @Post(':id/verify-rank')
  @ApiOperation({ summary: 'Booster reports rank mismatch upon account inspection' })
  async verifyRankMismatch(
    @Param('id') id: string,
    @ReqUser() user: any,
    @Body()
    body: {
      verifiedRank: string;
      proofImage: string;
      note?: string;
      proposedPrice?: number;
    },
  ) {
    return this.ordersService.verifyRankMismatch(id, user.userId, body);
  }

  @Post(':id/confirm-requote')
  @ApiOperation({ summary: 'Customer confirms re-quoted price, pays the difference, and updates/confirms game account' })
  async confirmRequote(
    @Param('id') id: string,
    @ReqUser() user: any,
    @Body()
    body?: {
      account_info?: {
        username?: string;
        password?: string;
        platform?: string;
      };
      server?: string;
      note?: string;
      newTargetRank?: string;
      extraAmount?: number;
    },
  ) {
    return this.ordersService.confirmRequote(id, user.userId, body);
  }

  @Post(':id/cancel-mismatch')
  @ApiOperation({ summary: 'Customer or Admin cancels order due to rank mismatch' })
  async cancelMismatchOrder(
    @Param('id') id: string,
    @ReqUser() user: any,
    @Body('reason') reason?: string,
  ) {
    return this.ordersService.cancelMismatchOrder(id, user.userId, reason);
  }

  @Post(':id/rate')
  @ApiOperation({ summary: 'Customer rates booster' })
  async rateBooster(
    @Param('id') id: string,
    @ReqUser() user: any,
    @Body() body: { stars?: number; rating?: number; comment?: string },
  ) {
    return this.ordersService.rateBooster(id, user.userId, body);
  }

  @Post(':id/dispute')
  @ApiOperation({ summary: 'Report an issue or dispute order' })
  async createDispute(
    @Param('id') id: string,
    @ReqUser() user: any,
    @Body('reason') reason: string,
  ) {
    return this.ordersService.createDispute(id, user.userId, reason, user.role);
  }

  @Patch(':id/details')
  @ApiOperation({ summary: 'Update order details (ingame name, rank, LP, vod, etc.)' })
  async updateOrderDetails(
    @Param('id') id: string,
    @ReqUser() user: any,
    @Body() body: any,
  ) {
    return this.ordersService.updateOrderDetails(id, user.userId, body, user.role);
  }

  @Post(':id/matches')
  @ApiOperation({ summary: 'Add match record to order' })
  async addOrderMatch(
    @Param('id') id: string,
    @ReqUser() user: any,
    @Body() body: any,
  ) {
    return this.ordersService.addOrderMatch(id, user.userId, body, user.role);
  }

  @Post(':id/matches/batch')
  @ApiOperation({ summary: 'Add multiple match records to order in batch' })
  async addOrderMatchesBatch(
    @Param('id') id: string,
    @ReqUser() user: any,
    @Body('matches') matches: any[],
  ) {
    return this.ordersService.addOrderMatchesBatch(id, user.userId, matches, user.role);
  }

  @Put(':id/matches')
  @ApiOperation({ summary: 'Update match record in order' })
  async updateOrderMatch(
    @Param('id') id: string,
    @ReqUser() user: any,
    @Body() body: any,
  ) {
    return this.ordersService.updateOrderMatch(id, user.userId, body, user.role);
  }

  @Delete(':id/matches')
  @ApiOperation({ summary: 'Delete match record from order' })
  async deleteOrderMatch(
    @Param('id') id: string,
    @ReqUser() user: any,
    @Query('matchId') matchId: string,
  ) {
    return this.ordersService.deleteOrderMatch(id, user.userId, matchId, user.role);
  }

  @Patch(':id/schedule')
  @ApiOperation({ summary: 'Update coaching schedule' })
  async updateOrderSchedule(
    @Param('id') id: string,
    @ReqUser() user: any,
    @Body('schedule') schedule: any[],
  ) {
    return this.ordersService.updateOrderSchedule(id, user.userId, schedule, user.role);
  }

  @Post(':id/settle')
  @ApiOperation({ summary: 'Settle order' })
  async settleOrder(
    @Param('id') id: string,
    @ReqUser() user: any,
    @Body() body: any,
  ) {
    return this.ordersService.settleOrder(id, user.userId, body, user.role);
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Refund order' })
  async refundOrder(
    @Param('id') id: string,
    @ReqUser() user: any,
  ) {
    return this.ordersService.refundOrder(id, user.userId, user.role);
  }
}

