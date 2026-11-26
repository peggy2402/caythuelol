import { Controller, Post, Body, Headers, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { WebhooksService, SePayWebhookData } from './webhooks.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @Public()
  @Post('sepay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'SePay automated payment gateway webhook' })
  async handleSepay(
    @Headers('authorization') authHeader: string | undefined,
    @Headers('x-sepay-signature') signatureHeader: string | undefined,
    @Headers('x-sepay-timestamp') timestampHeader: string | undefined,
    @Body() data: SePayWebhookData,
    @Req() req: Request,
  ) {
    const rawIp = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip || '';
    const clientIp = Array.isArray(rawIp) ? rawIp[0] : String(rawIp).split(',')[0].trim();
    const rawBody = (req as any).rawBody || Buffer.from(JSON.stringify(data || {}));

    return this.webhooksService.handleSepayWebhook(
      {
        authHeader,
        signatureHeader: signatureHeader || (req.headers['x-signature'] as string),
        timestampHeader: timestampHeader || (req.headers['x-timestamp'] as string),
        rawBody,
      },
      data,
      {
        ip: clientIp,
        userAgent: (req.headers['user-agent'] as string) || '',
      },
    );
  }
}
