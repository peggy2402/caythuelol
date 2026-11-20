import { Module } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { BlogsController } from './blogs.controller';
import { CommentsController } from './comments.controller';

@Module({
  controllers: [BlogsController, CommentsController],
  providers: [BlogsService],
  exports: [BlogsService],
})
export class BlogsModule {}

