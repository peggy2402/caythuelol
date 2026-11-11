import { Module } from '@nestjs/common';
import { BoostersService } from './boosters.service';
import { BoostersController } from './boosters.controller';

@Module({
  controllers: [BoostersController],
  providers: [BoostersService],
  exports: [BoostersService],
})
export class BoostersModule {}
