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
}

