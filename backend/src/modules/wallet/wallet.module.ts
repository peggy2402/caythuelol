import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController, TransactionsController } from './wallet.controller';

@Module({
  controllers: [WalletController, TransactionsController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule { }

