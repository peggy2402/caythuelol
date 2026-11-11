import {
  Controller,
  Get,
  Post,
  Patch,
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
    return this.ordersService.getOrderDetails(id, user.userId);
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
  async completeOrder(@Param('id') id: string, @ReqUser() user: any) {
    return this.ordersService.completeOrder(id, user.userId);
  }

  @Post(':id/rate')
  @ApiOperation({ summary: 'Customer rates booster' })
  async rateBooster(
    @Param('id') id: string,
    @ReqUser() user: any,
    @Body() body: { stars: number; comment?: string },
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
    return this.ordersService.createDispute(id, user.userId, reason);
  }
}
