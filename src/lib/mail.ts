import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail', // Hoặc cấu hình SMTP của nhà cung cấp khác
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ Missing EMAIL_USER or EMAIL_PASS environment variables. Email not sent.');
    return;
  }

  try {
    await transporter.sendMail({
      from: `"CayThueLOL System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent to ${to}`);
  } catch (error) {
    console.error('❌ Error sending email:', error);
  }
};

export const sendNewOrderNotification = async (
  boosterEmail: string,
  boosterName: string,
  orderId: string,
  serviceType: string,
  earnings: number
) => {
  const subject = `[CayThueLOL] 🚀 Bạn nhận được đơn hàng mới #${orderId.slice(-6).toUpperCase()}`;
  
  // Template Email Dark Mode
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #18181b; color: #e4e4e7; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #2563eb; padding: 20px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px;">Đơn Hàng Mới!</h1>
      </div>
      
      <div style="padding: 24px;">
        <p style="font-size: 16px;">Xin chào <strong>${boosterName}</strong>,</p>
        <p style="color: #a1a1aa;">Bạn vừa được chỉ định cho một đơn hàng mới. Hãy kiểm tra và bắt đầu ngay!</p>
        
        <div style="background-color: #27272a; padding: 16px; border-radius: 8px; margin: 24px 0; border: 1px solid #3f3f46;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #a1a1aa;">Mã đơn:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #ffffff;">#${orderId.slice(-6).toUpperCase()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #a1a1aa;">Dịch vụ:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #ffffff;">${serviceType.replace('_', ' ')}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #a1a1aa;">Thu nhập:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #4ade80;">${earnings.toLocaleString('vi-VN')} đ</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin-top: 32px;">
          <a href="${process.env.NEXTAUTH_URL}/orders/${orderId}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Xem Chi Tiết Đơn Hàng</a>
        </div>
      </div>
      
      <div style="background-color: #09090b; padding: 16px; text-align: center; font-size: 12px; color: #71717a;">
        <p style="margin: 0;">Đây là email tự động từ hệ thống CayThueLOL.</p>
      </div>
    </div>
  `;

  await sendEmail(boosterEmail, subject, html);
};