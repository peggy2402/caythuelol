import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PricingEngineService, QuoteRequest, SettlementRequest } from './pricing-engine.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Pricing Engine')
@Controller('pricing')
export class PricingController {
  constructor(private pricingEngine: PricingEngineService) {}

  @Public()
  @Get('aov/defaults')
  @ApiOperation({ summary: 'Get default Arena of Valor (Liên Quân) rank ladder, tier packages, and star pricing' })
  getAovDefaults() {
    return {
      success: true,
      data: this.pricingEngine.getAovDefaults(),
    };
  }

  @Public()
  @Post('aov/quote')
  @ApiOperation({ summary: 'Calculate Arena of Valor (Liên Quân) quote by Rank or by Stars' })
  calculateAovQuote(@Body() body: any) {
    return {
      success: true,
      data: this.pricingEngine.calculateAovQuote(body),
    };
  }

  @Public()
  @Post('quote')
  @ApiOperation({ summary: 'Calculate accurate price and deposit quote' })
  calculateQuote(@Body() body: QuoteRequest) {
    return {
      success: true,
      data: this.pricingEngine.calculateQuote(body),
    };
  }

  @Public()
  @Post('settlement-preview')
  @ApiOperation({ summary: 'Preview actual settlement calculation' })
  previewSettlement(@Body() body: SettlementRequest) {
    return {
      success: true,
      data: this.pricingEngine.calculateSettlement(body),
    };
  }
}
