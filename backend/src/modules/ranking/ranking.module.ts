import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { RankingService } from './ranking.service';
import { RankingController } from './ranking.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [RankingController],
  providers: [RankingService],
  exports: [RankingService],
})
export class RankingModule {}
