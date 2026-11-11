import { Controller, Get, Post, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ReqUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Users')
@Controller('user')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@ReqUser() user: any) {
    return this.usersService.getProfile(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('profile')
  @ApiOperation({ summary: 'Update profile info' })
  async updateProfile(
    @ReqUser() user: any,
    @Body() body: { username?: string; avatar?: string; bio?: string },
  ) {
    return this.usersService.updateProfile(user.userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('bank-info')
  @ApiOperation({ summary: 'Update bank info' })
  async updateBankInfo(
    @ReqUser() user: any,
    @Body() body: { bankName: string; accountNumber: string; accountHolder: string },
  ) {
    return this.usersService.updateBankInfo(user.userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('bookmarks')
  @ApiOperation({ summary: 'Toggle booster bookmark' })
  async toggleBookmark(@ReqUser() user: any, @Body('boosterId') boosterId: string) {
    return this.usersService.toggleBookmark(user.userId, boosterId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('bookmarks')
  @ApiOperation({ summary: 'Get bookmarked boosters' })
  async getBookmarks(@ReqUser() user: any) {
    return this.usersService.getBookmarks(user.userId);
  }

  @Public()
  @Post('feedback')
  @ApiOperation({ summary: 'Send user feedback' })
  async sendFeedback(
    @ReqUser() user: any,
    @Body() body: { type: string; content: string; imageUrl?: string },
  ) {
    return this.usersService.sendFeedback(user?.userId || null, body);
  }
}

