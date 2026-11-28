import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);

  private getWebhookUrl(): string | undefined {
    return process.env.DISCORD_WEBHOOK_URL?.trim();
  }

  /**
   * Gửi Embed tùy biến tới Discord Webhook (An toàn 100%, không bao giờ throw lỗi làm gãy luồng chính)
   */
  async sendEmbed(embed: Record<string, any>): Promise<boolean> {
    const webhookUrl = this.getWebhookUrl();
    if (!webhookUrl) return false;

    const payload = {
      username: 'LeoRank Bot',
      avatar_url: 'https://www.leorank.site/og-image.png',
      embeds: [
        {
          ...embed,
          footer: { text: 'LeoRank Alert System • Escrow Automation', ...(embed.footer || {}) },
          timestamp: embed.timestamp || new Date().toISOString(),
        },
      ],
    };

    try {
      await axios.post(webhookUrl, payload, { timeout: 5000 });
      return true;
    } catch (err: any) {
      this.logger.warn(`Failed to send Discord alert: ${err.message}`);
      return false;
    }
  }

  /**
   * 1. Thông báo nạp tiền SePay thành công
   */
  async notifyDepositSuccess(data: {
    username: string;
    amount: number;
    transactionCode: string;
    newBalance?: number;
    bankName?: string;
  }) {
    return this.sendEmbed({
      title: '💰 KHÁCH NẠP TIỀN THÀNH CÔNG (SEPAY)',
      color: 0x10b981, // Emerald Green
      fields: [
        { name: '👤 Khách hàng', value: `**${data.username}**`, inline: true },
        { name: '💵 Số tiền nạp', value: `\`+${data.amount.toLocaleString('vi-VN')} đ\``, inline: true },
        { name: '💳 Ngân hàng', value: data.bankName || 'MB Bank', inline: true },
        { name: '🔖 Mã giao dịch', value: `\`${data.transactionCode}\``, inline: true },
        {
          name: '💼 Số dư ví mới',
          value: data.newBalance !== undefined ? `\`${data.newBalance.toLocaleString('vi-VN')} đ\`` : 'Đã cộng ví',
          inline: true,
        },
      ],
    });
  }

  /**
   * 2. Thông báo đơn hàng mới được tạo (Đã cọc Escrow)
   */
  async notifyNewOrder(data: {
    orderCode: string;
    customerName: string;
    boosterName?: string;
    game: string;
    serviceName: string;
    totalAmount: number;
    depositAmount: number;
  }) {
    return this.sendEmbed({
      title: '🎮 ĐƠN HÀNG MỚI ĐÃ ĐẶT CỌC (ESCROW HOLD)',
      color: 0x06b6d4, // Cyan
      fields: [
        { name: '📦 Mã đơn', value: `**#${data.orderCode}**`, inline: true },
        { name: '👤 Khách hàng', value: data.customerName, inline: true },
        { name: '⚡ Booster nhận cày', value: data.boosterName ? `**${data.boosterName}**` : '🔍 Chờ nhận đơn', inline: true },
        { name: '🎯 Tựa game', value: data.game, inline: true },
        { name: '⚔️ Gói dịch vụ', value: data.serviceName, inline: true },
        { name: '💰 Tổng giá trị', value: `\`${data.totalAmount.toLocaleString('vi-VN')} đ\``, inline: true },
        { name: '🛡️ Cọc Escrow (40%)', value: `\`${data.depositAmount.toLocaleString('vi-VN')} đ\``, inline: true },
      ],
    });
  }

  /**
   * 3. Thông báo Booster báo lệch Rank
   */
  async notifyRankMismatch(data: {
    orderCode: string;
    boosterName: string;
    customerName: string;
    declaredRank: string;
    verifiedRank: string;
    depositTopUpNeeded: number;
    proofImagesCount?: number;
  }) {
    return this.sendEmbed({
      title: '⚠️ BÁO CÁO LỆCH RANK (CẦN KHÁCH / ADMIN XỬ LÝ)',
      color: 0xf59e0b, // Amber
      fields: [
        { name: '📦 Mã đơn', value: `**#${data.orderCode}**`, inline: true },
        { name: '👤 Khách hàng', value: data.customerName, inline: true },
        { name: '🛡️ Booster phát hiện', value: data.boosterName, inline: true },
        { name: '📋 Rank khách khai ban đầu', value: data.declaredRank, inline: true },
        { name: '🔍 Rank thực tế Booster check', value: `**${data.verifiedRank}**`, inline: true },
        {
          name: '💵 Khoản bù cọc yêu cầu',
          value: data.depositTopUpNeeded > 0 ? `\`+${data.depositTopUpNeeded.toLocaleString('vi-VN')} đ\`` : '0 đ (Chưa vượt cọc)',
          inline: true,
        },
      ],
    });
  }

  /**
   * 4. Thông báo khiếu nại phát sinh
   */
  async notifyDispute(data: {
    orderCode: string;
    openedBy: string;
    reason: string;
    orderAmount?: number;
  }) {
    return this.sendEmbed({
      title: '🚨 KHIẾU NẠI ĐƠN HÀNG (DISPUTE ALERT)',
      color: 0xef4444, // Red
      fields: [
        { name: '📦 Mã đơn', value: `**#${data.orderCode}**`, inline: true },
        { name: '👤 Người mở khiếu nại', value: data.openedBy, inline: true },
        { name: '📝 Lý do', value: data.reason },
      ],
    });
  }

  /**
   * 5. Thông báo yêu cầu rút tiền mới
   */
  async notifyWithdrawalRequest(data: {
    username: string;
    amount: number;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  }) {
    return this.sendEmbed({
      title: '💸 YÊU CẦU RÚT TIỀN MỚI CỦA BOOSTER / KHÁCH',
      color: 0x8b5cf6, // Purple
      fields: [
        { name: '👤 Tài khoản', value: data.username, inline: true },
        { name: '💵 Số tiền rút', value: `\`${data.amount.toLocaleString('vi-VN')} đ\``, inline: true },
        {
          name: '🏦 Thông tin nhận',
          value: `${data.bankName} - \`${data.accountNumber}\` (${data.accountHolder})`,
        },
      ],
    });
  }
}
