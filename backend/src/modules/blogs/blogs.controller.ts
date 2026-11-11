import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BlogsService } from './blogs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ReqUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Blogs')
@Controller('blogs')
export class BlogsController {
  constructor(private blogsService: BlogsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published blogs with filters' })
  async listBlogs(
    @Query('tag') tag?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.blogsService.listBlogs(tag, search, Number(page || 1), Number(limit || 9));
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Live search blogs' })
  async searchBlogs(@Query('q') q: string) {
    return this.blogsService.searchBlogs(q);
  }

  @Public()
  @Get('popular')
  @ApiOperation({ summary: 'Get popular trending blogs' })
  async popularBlogs() {
    return this.blogsService.popularBlogs();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get blog post details by slug' })
  async getBlogBySlug(@Param('slug') slug: string) {
    return this.blogsService.getBlogBySlug(slug);
  }

  @Public()
  @Get(':slug/comments')
  @ApiOperation({ summary: 'Get comments of a blog' })
  async getComments(@Param('slug') slug: string) {
    const blogRes = await this.blogsService.getBlogBySlug(slug);
    return this.blogsService.getComments(blogRes.blog._id.toString());
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':slug/comments')
  @ApiOperation({ summary: 'Post comment or reply on a blog' })
  async createComment(
    @Param('slug') slug: string,
    @ReqUser() user: any,
    @Body('content') content: string,
    @Body('parentId') parentId?: string,
  ) {
    const blogRes = await this.blogsService.getBlogBySlug(slug);
    return this.blogsService.createComment(blogRes.blog._id.toString(), user.userId, content, parentId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('comments/:id/like')
  @ApiOperation({ summary: 'Like or unlike a comment' })
  async likeComment(@Param('id') commentId: string, @ReqUser() user: any) {
    return this.blogsService.likeComment(commentId, user.userId);
  }
}
