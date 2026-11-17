import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VipController } from './vip.controller';
import { VipService } from './vip.service';
import UserSchema from '../../database/schemas/User';
import TransactionSchema from '../../database/schemas/Transaction';
import SystemSettingSchema from '../../database/schemas/SystemSetting';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: (UserSchema as any).schema || UserSchema },
      { name: 'Transaction', schema: (TransactionSchema as any).schema || TransactionSchema },
      { name: 'SystemSetting', schema: (SystemSettingSchema as any).schema || SystemSettingSchema },
    ]),
  ],
  controllers: [VipController],
  providers: [VipService],
  exports: [VipService],
})
export class VipModule {}
