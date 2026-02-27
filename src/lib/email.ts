import { Resend } from 'resend';

// Sử dụng fallback 're_123' để tránh lỗi build khi chưa có biến môi trường (Resend yêu cầu key không rỗng khi khởi tạo)
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, otp: string) {
  try {
    // QUAN TRỌNG: Nếu chưa verify domain, BẮT BUỘC phải dùng 'onboarding@resend.dev'
    // Nếu đã verify, dùng 'noreply@yourdomain.com'
    const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: '[CAYTHUELOL] Mã xác thực tài khoản',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xác thực tài khoản CAYTHUELOL</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; border: 1px solid #e4e4e7; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; background-color: #18181b; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; letter-spacing: 1px;">
                CAYTHUE<span style="color: #3b82f6;">LOL</span>
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin-top: 0; color: #18181b; font-size: 20px;">Xác thực tài khoản của bạn</h2>
              <p style="color: #52525b; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                Xin chào, cảm ơn bạn đã đăng ký dịch vụ tại CAYTHUELOL. Để hoàn tất quá trình đăng ký và bảo mật tài khoản, vui lòng sử dụng mã xác thực dưới đây:
              </p>

              <div style="background-color: #eff6ff; border: 1px dashed #3b82f6; border-radius: 8px; padding: 24px; text-align: center; margin: 30px 0;">
                <span style="display: block; color: #3b82f6; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Mã OTP của bạn</span>
                <span style="font-family: monospace; font-size: 36px; font-weight: 700; color: #1e3a8a; letter-spacing: 8px;">${otp}</span>
              </div>

              <p style="color: #71717a; font-size: 14px; line-height: 1.5;">
                ⚠️ Mã này sẽ hết hạn trong vòng <strong>60 giây</strong>.
                <br>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f4f4f5; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                © 2026 CAYTHUELOL. All rights reserved.
                <br>
                Đây là email tự động, vui lòng không trả lời.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    if (error) {
      console.error('Resend Error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Email Service Error:', error);
    return false;
  }
}
