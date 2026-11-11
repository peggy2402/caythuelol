import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      this.logger.warn('Missing EMAIL_USER or EMAIL_PASS. Email sending skipped.');
      return false;
    }
    try {
      await this.transporter.sendMail({
        from: `"LEORANK System" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Email successfully sent to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending email to ${to}:`, error);
      return false;
    }
  }

  async sendOtpEmail(to: string, otp: string, type: 'VERIFICATION' | 'PASSWORD_RESET' | 'CHANGE_EMAIL'): Promise<boolean> {
    const titles = {
      VERIFICATION: 'Xác thực tài khoản LEORANK',
      PASSWORD_RESET: 'Đặt lại mật khẩu LEORANK',
      CHANGE_EMAIL: 'Xác thực thay đổi Email LEORANK',
    };
    const title = titles[type] || 'Mã xác thực LEORANK';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #121214; color: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #27272a;">
        <h2 style="color: #60a5fa; text-align: center; margin-bottom: 8px;">${title}</h2>
        <p style="color: #a1a1aa; text-align: center; font-size: 14px;">Mã OTP của bạn có hiệu lực trong 5 phút:</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #38bdf8; background: #1e293b; padding: 12px 24px; border-radius: 8px; border: 1px dashed #38bdf8;">
            ${otp}
          </span>
        </div>
        <p style="color: #71717a; font-size: 12px; text-align: center;">Không chia sẻ mã này với bất kỳ ai để bảo vệ tài khoản của bạn.</p>
      </div>
    `;
    return this.sendEmail(to, `[LEORANK] ${title} - Mã OTP: ${otp}`, html);
  }

  async sendNewOrderNotification(
    boosterEmail: string,
    boosterName: string,
    orderId: string,
    serviceType: string,
    earnings: number,
  ): Promise<boolean> {
    const subject = `[LEORANK] 🚀 Bạn nhận được đơn hàng mới #${orderId.slice(-6).toUpperCase()}`;
    const frontendUrl = process.env.FRONTEND_URL || 'https://leorank.site';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #18181b; color: #e4e4e7; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #2563eb; padding: 20px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 24px;">Đơn Hàng Mới!</h1>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 16px;">Xin chào <strong>${boosterName}</strong>,</p>
          <p style="color: #a1a1aa;">Bạn vừa được chỉ định cho một đơn hàng mới. Hãy kiểm tra và bắt đầu ngay!</p>
          <div style="background-color: #27272a; padding: 16px; border-radius: 8px; margin: 24px 0; border: 1px solid #3f3f46;">
            <p><strong>Mã đơn:</strong> #${orderId.slice(-6).toUpperCase()}</p>
            <p><strong>Dịch vụ:</strong> ${serviceType.replace('_', ' ')}</p>
            <p><strong>Thu nhập dự kiến:</strong> <span style="color: #4ade80; font-weight: bold;">${earnings.toLocaleString('vi-VN')} đ</span></p>
          </div>
          <div style="text-align: center; margin-top: 32px;">
            <a href="${frontendUrl}/dashboard/orders/${orderId}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Xem Chi Tiết Đơn Hàng</a>
          </div>
        </div>
      </div>
    `;
    return this.sendEmail(boosterEmail, subject, html);
  }
}
