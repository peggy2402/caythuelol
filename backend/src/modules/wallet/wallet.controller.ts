import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ReqUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Wallet')
@Controller('wallet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'Get current wallet balance and transactions' })
  async getWallet(
    @ReqUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.walletService.getWallet(user.userId, Number(page || 1), Number(limit || 10));
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Create pending deposit transaction' })
  async confirmDeposit(@ReqUser() user: any, @Body('amount') amount: number) {
    return this.walletService.confirmDeposit(user.userId, amount);
  }

  @Post('cancel')
  @ApiOperation({ summary: 'Cancel pending deposit' })
  async cancelDeposit(@ReqUser() user: any, @Body('transactionId') transactionId: string) {
    return this.walletService.cancelDeposit(user.userId, transactionId);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Request withdrawal to bank account' })
  async requestWithdrawal(
    @ReqUser() user: any,
    @Body('amount') amount: number,
    @Body('bankInfo') bankInfo: any,
  ) {
    return this.walletService.requestWithdrawal(user.userId, amount, bankInfo);
  }
}

