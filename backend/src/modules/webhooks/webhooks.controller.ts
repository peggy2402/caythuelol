import { Controller, Post, Body, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @Public()
  @Post('sepay')
  @ApiOperation({ summary: 'SePay automated payment gateway webhook' })
  async handleSepay(
    @Headers('authorization') authHeader: string,
    @Body() data: any,
  ) {
    return this.webhooksService.handleSepayWebhook(authHeader, data);
  }
}

