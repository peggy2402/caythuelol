import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LoyaltyService } from './loyalty.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ReqUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Loyalty')
@Controller('loyalty')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LoyaltyController {
  constructor(private loyaltyService: LoyaltyService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get customer loyalty points, target 2000 progress, vouchers & history' })
  async getMyLoyalty(@ReqUser() user: any) {
    return this.loyaltyService.getMyLoyalty(user.userId);
  }

  @Post('redeem')
  @ApiOperation({ summary: 'Redeem loyalty points for a voucher' })
  async redeemVoucher(
    @ReqUser() user: any,
    @Body('rewardId') rewardId: string,
  ) {
    return this.loyaltyService.redeemVoucher(user.userId, rewardId);
  }

  @Post('vouchers/validate')
  @ApiOperation({ summary: 'Validate a customer loyalty voucher code for checkout' })
  async validateVoucher(
    @ReqUser() user: any,
    @Body('code') code: string,
    @Body('orderAmount') orderAmount?: number,
  ) {
    return this.loyaltyService.validateCustomerVoucher(
      user.userId,
      code,
      Number(orderAmount || 0),
    );
  }
}
