import {
  Controller,
  Get,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { PublicService } from './public.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Public & Utilities')
@Controller()
export class PublicController {
  constructor(private publicService: PublicService) {}

  @Public()
  @Get('settings/public')
  @ApiOperation({ summary: 'Get public platform settings and bank info' })
  async getPublicSettings() {
    return this.publicService.getPublicSettings();
  }

  @Public()
  @Get('champions')
  @ApiOperation({ summary: 'Get League of Legends champions list' })
  async getChampions() {
    return this.publicService.getChampions();
  }

  @Public()
  @Post('coupons/validate')
  @ApiOperation({ summary: 'Validate booster discount coupon' })
  async validateCoupon(
    @Body('code') code: string,
    @Body('boosterId') boosterId: string,
  ) {
    return this.publicService.validateCoupon(code, boosterId);
  }

  @Public()
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload image or contract PDF to Cloudinary' })
  async uploadFile(
    @UploadedFile() file: any,
    @Body('resource_type') resourceType?: 'auto' | 'raw' | 'image',
  ) {
    if (!file) throw new BadRequestException('Không tìm thấy file tải lên');
    return this.publicService.uploadFileBuffer(
      file.buffer,
      file.originalname,
      resourceType || 'auto',
    );
  }

  // 1. Phí Rút tiền
  @Public()
  @Get('settings/withdraw-fee')
  @ApiOperation({ summary: 'Get current withdrawal fee' })
  async getWithdrawFee() {
    return this.publicService.getWithdrawFee();
  }

  @Public()
  @Post('settings/withdraw-fee')
  @ApiOperation({ summary: 'Update withdrawal fee' })
  async updateWithdrawFee(@Body('fee') fee: number) {
    return this.publicService.updateWithdrawFee(fee);
  }

  // 2. Phí Sàn
  @Public()
  @Get('settings/platform-fee')
  @ApiOperation({ summary: 'Get platform fee percent' })
  async getPlatformFee() {
    return this.publicService.getPlatformFee();
  }

  // 3. Cấu hình hệ thống công khai
  @Public()
  @Get('public/system-config')
  @ApiOperation({ summary: 'Get public system config (banner, maintenance)' })
  async getSystemConfig() {
    return this.publicService.getSystemConfig();
  }

  // 4. Form Liên hệ & Đánh giá
  @Public()
  @Post('contact')
  @ApiOperation({ summary: 'Submit contact message' })
  async submitContact(@Body() dto: any) {
    return this.publicService.submitContact(dto);
  }

  @Public()
  @Post('feedback')
  @ApiOperation({ summary: 'Submit customer feedback' })
  async submitFeedback(@Body() dto: any) {
    return this.publicService.submitFeedback(dto);
  }

  // 5. Thống kê Rank
  @Public()
  @Get('rank-stats')
  @ApiOperation({ summary: 'Get League rank statistics' })
  async getRankStats() {
    return this.publicService.getRankStats();
  }

  // 6. Riot Games Proxy
  @Public()
  @Post('riot/player')
  @ApiOperation({ summary: 'Lookup Riot player stats' })
  async getRiotPlayer(@Body() dto: any) {
    return this.publicService.getRiotPlayer(dto);
  }

  @Public()
  @Post('riot/match')
  @ApiOperation({ summary: 'Lookup Riot match result' })
  async getRiotMatch(@Body('matchId') matchId: string) {
    return this.publicService.getRiotMatch(matchId);
  }
}

