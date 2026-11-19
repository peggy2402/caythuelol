import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { PublicService } from './public.service';
import { Public } from '../../common/decorators/public.decorator';
import {
  RiotPlayerLookupDto,
  RiotMatchLookupDto,
  ValorantPlayerLookupDto,
  ValorantMatchLookupDto,
  GamePlayerLookupDto,
  GameMatchLookupDto,
} from './dto/riot.dto';

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
  @Get('geo-locale')
  @ApiOperation({ summary: 'Detect client geo country & suggest locale' })
  async getGeoLocale(@Req() req: any) {
    return this.publicService.detectGeoLocale(req);
  }

  @Public()
  @Get('templates/services')
  @ApiOperation({ summary: 'Get standard service templates by gameCode' })
  async getServiceTemplates(@Query('gameCode') gameCode?: string) {
    return this.publicService.getServiceTemplates(gameCode || 'LOL');
  }

  @Public()
  @Get('templates/services/:slug')
  @ApiOperation({ summary: 'Get standard service template detail' })
  async getServiceTemplateDetail(
    @Param('slug') slug: string,
    @Query('gameCode') gameCode?: string,
  ) {
    return this.publicService.getServiceTemplateDetail(gameCode || 'LOL', slug);
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
  @ApiTags('Riot Games')
  @Post('riot/player')
  @ApiOperation({
    summary: 'Tra cứu thông tin Rank & 20 trận gần nhất từ Riot Games',
    description: 'Truy vấn Riot Account-V1 & League-V4 để lấy Bậc Rank, LP và danh sách Match ID 20 trận gần nhất',
  })
  async getRiotPlayer(@Body() dto: RiotPlayerLookupDto) {
    return this.publicService.getRiotPlayer(dto);
  }

  @Public()
  @ApiTags('Riot Games')
  @Post('riot/match')
  @ApiOperation({
    summary: 'Tra cứu chi tiết trận đấu Riot Match V5',
    description: 'Truy vấn Riot Match-V5 & League-V4 theo matchId và targetName để lấy KDA, Tướng đã chơi, kết quả Thắng/Thua và Rank hiện tại',
  })
  async getRiotMatch(@Body() dto: RiotMatchLookupDto) {
    return this.publicService.getRiotMatch(dto);
  }

  // 7. Valorant Proxy (HenrikDev)
  @Public()
  @ApiTags('Valorant')
  @Post('valorant/player')
  @ApiOperation({
    summary: 'Tra cứu Rank & 20 trận gần nhất Valorant (HenrikDev)',
    description: 'Truy vấn HenrikDev MMR & Matches để lấy Bậc Rank, LP (RR) và danh sách Match ID 20 trận gần nhất của Valorant',
  })
  async getValorantPlayer(@Body() dto: ValorantPlayerLookupDto) {
    return this.publicService.lookupValorantPlayer(dto);
  }

  @Public()
  @ApiTags('Valorant')
  @Post('valorant/match')
  @ApiOperation({
    summary: 'Tra cứu chi tiết trận đấu Valorant (HenrikDev)',
    description: 'Truy vấn HenrikDev Match v2 theo matchId và targetName để lấy KDA, Đặc vụ (Agent), Điểm, kết quả Thắng/Thua',
  })
  async getValorantMatch(@Body() dto: ValorantMatchLookupDto) {
    return this.publicService.lookupValorantMatch(dto);
  }

  // 8. Unified Game Match & Player Lookup (Dùng chung cho mọi Game)
  @Public()
  @ApiTags('Game Match Lookup')
  @Post('games/player')
  @ApiOperation({
    summary: 'Tra cứu Rank & Lịch sử trận đa năng (LOL, Valorant, TFT)',
    description: 'Tự động định tuyến theo game: LOL -> Riot Games API, VALORANT -> HenrikDev API',
  })
  async getUnifiedPlayer(@Body() dto: GamePlayerLookupDto) {
    return this.publicService.lookupUnifiedPlayer(dto);
  }

  @Public()
  @ApiTags('Game Match Lookup')
  @Post('games/match')
  @ApiOperation({
    summary: 'Tra cứu Chi tiết trận đấu đa năng (LOL, Valorant, TFT)',
    description: 'Tự động định tuyến theo game để bóc tách thông tin Tướng/Agent, KDA, Thắng/Thua chuẩn hóa',
  })
  async getUnifiedMatch(@Body() dto: GameMatchLookupDto) {
    return this.publicService.lookupUnifiedMatch(dto);
  }
}

