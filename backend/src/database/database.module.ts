import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import User from './schemas/User';
import Order from './schemas/Order';
import Transaction from './schemas/Transaction';
import BoosterProfile from './schemas/BoosterProfile';
import BoosterService from './schemas/BoosterService';
import BoosterApplication from './schemas/BoosterApplication';
import Blog from './schemas/Blog';
import Comment from './schemas/Comment';
import Game from './schemas/Game';
import Rank from './schemas/Rank';
import RankHistory from './schemas/RankHistory';
import Notification from './schemas/Notification';
import SystemSetting from './schemas/SystemSetting';
import VerificationCode from './schemas/VerificationCode';
import Withdrawal from './schemas/Withdrawal';
import Message from './schemas/Message';
import AuditLog from './schemas/AuditLog';

const models = [
  { name: 'User', schema: User.schema },
  { name: 'Order', schema: Order.schema },
  { name: 'Transaction', schema: Transaction.schema },
  { name: 'BoosterProfile', schema: BoosterProfile.schema },
  { name: 'BoosterService', schema: BoosterService.schema },
  { name: 'BoosterApplication', schema: BoosterApplication.schema },
  { name: 'Blog', schema: Blog.schema },
  { name: 'Comment', schema: Comment.schema },
  { name: 'Game', schema: Game.schema },
  { name: 'Rank', schema: Rank.schema },
  { name: 'RankHistory', schema: RankHistory.schema },
  { name: 'Notification', schema: Notification.schema },
  { name: 'SystemSetting', schema: SystemSetting.schema },
  { name: 'VerificationCode', schema: VerificationCode.schema },
  { name: 'Withdrawal', schema: Withdrawal.schema },
  { name: 'Message', schema: Message.schema },
  { name: 'AuditLog', schema: AuditLog.schema },
];

@Global()
@Module({
  imports: [MongooseModule.forFeature(models)],
  exports: [MongooseModule.forFeature(models)],
})
export class DatabaseModule {}

