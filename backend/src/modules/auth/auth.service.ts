import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import axios from 'axios';

import { IUser, UserRole } from '../../database/schemas/User';
import { IVerificationCode } from '../../database/schemas/VerificationCode';
import { MailService } from '../../common/mail.service';
import { RegisterDto } from './dto/register.dto';
import {
  LoginDto,
  VerifyOtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel('User') private userModel: Model<IUser>,
    @InjectModel('VerificationCode')
    private verificationCodeModel: Model<IVerificationCode>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const t0 = Date.now();
    const { username, email, password, phoneNumber } = dto;
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    const usernameRegex = /^[a-zA-Z0-9_\-\.]+$/;
    if (!usernameRegex.test(cleanUsername)) {
      throw new BadRequestException('Tên đăng nhập không được chứa khoảng trắng hoặc ký tự đặc biệt');
    }

    const t1 = Date.now();
    const existingUser = await this.userModel.findOne({
      $or: [{ email: cleanEmail }, { username: cleanUsername }],
    });
    const t2 = Date.now();

    if (existingUser) {
      // YÊU CẦU 3: Nếu tài khoản cũ CHƯA VERIFY OTP -> Cho phép cập nhật thông tin và cấp lại OTP mới
      if (!existingUser.isEmailVerified) {
        this.logger.log(`[Register] User [${existingUser.username} | ${existingUser.email}] chưa kích hoạt OTP. Cập nhật thông tin và cấp mã OTP mới.`);
        const salt = await bcrypt.genSalt(10);
        existingUser.password_hash = await bcrypt.hash(password, salt);
        if (phoneNumber) existingUser.phoneNumber = phoneNumber;
        await existingUser.save();
      } else {
        // ĐÃ VERIFY -> Báo trùng
        if (existingUser.email?.toLowerCase() === cleanEmail) {
          throw new BadRequestException('Email này đã được sử dụng');
        }
        if (existingUser.username === cleanUsername) {
          throw new BadRequestException('Tên đăng nhập này đã tồn tại');
        }
        throw new BadRequestException('Email hoặc Tên đăng nhập đã tồn tại');
      }
    } else {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const newUser = new this.userModel({
        username: cleanUsername,
        email: cleanEmail,
        password_hash: passwordHash,
        role: UserRole.CUSTOMER,
        phoneNumber: phoneNumber || '',
        isEmailVerified: false,
        platform: 'EMAIL',
        wallet_balance: 0,
        pending_balance: 0,
        profile: { avatar: '' },
      });
      await newUser.save();
    }
    const t3 = Date.now();

    // Sinh mã OTP 6 số ngẫu nhiên
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

    // YÊU CẦU 4: Hash OTP trước khi lưu vào Database
    const otpHash = await bcrypt.hash(otp, 8);

    await this.verificationCodeModel.deleteMany({ email: cleanEmail, type: 'EMAIL_VERIFICATION' });
    await this.verificationCodeModel.create({
      email: cleanEmail,
      code: otpHash,
      type: 'EMAIL_VERIFICATION',
      expiresAt,
      attempts: 0,
    });
    const t4 = Date.now();

    this.logger.log(
      `[Register Timing] CheckUser: ${t2 - t1}ms | SaveUser: ${t3 - t2}ms | SaveOTP: ${t4 - t3}ms | Total Response Time: ${t4 - t0}ms`,
    );

    // Gửi email OTP trong background (Fire-and-forget, tuyệt đối KHÔNG await để response < 1s)
    this.mailService.sendOtpEmail(cleanEmail, otp, 'VERIFICATION').catch((err) => {
      this.logger.error(`[MailService] Lỗi gửi OTP đăng ký tới ${cleanEmail}:`, err);
    });

    return {
      success: true,
      email: cleanEmail,
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP.',
    };
  }

  async login(dto: LoginDto) {
    const { identifier, password } = dto;
    const cleanId = identifier.trim();

    const user = await this.userModel
      .findOne({
        $or: [
          { email: new RegExp(`^${cleanId}$`, 'i') },
          { username: new RegExp(`^${cleanId}$`, 'i') },
        ],
      })
      .select('+password_hash');

    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu không chính xác');
    }

    if (user.isBanned) {
      throw new ForbiddenException({
        message: 'Tài khoản của bạn đã bị khóa do vi phạm hoặc nợ cước. Vui lòng liên hệ Admin.',
        isBanned: true,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu không chính xác');
    }

    // YÊU CẦU 3: Nếu tài khoản chưa xác thực OTP -> Không cấp token, sinh OTP mới và trả requireVerification
    if (!user.isEmailVerified) {
      const lowerEmail = user.email.toLowerCase();

      // Kiểm tra rate limit: tối thiểu 60s giữa 2 lần gửi OTP
      const existingRecord = await this.verificationCodeModel.findOne({
        email: lowerEmail,
        type: 'EMAIL_VERIFICATION',
      });

      const lastSentTime = existingRecord ? new Date((existingRecord as any).updatedAt || (existingRecord as any).createdAt).getTime() : 0;
      const canSendNew = Date.now() - lastSentTime > 60 * 1000;

      if (canSendNew || !existingRecord) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        const otpHash = await bcrypt.hash(otp, 8);

        await this.verificationCodeModel.deleteMany({ email: lowerEmail, type: 'EMAIL_VERIFICATION' });
        await this.verificationCodeModel.create({
          email: lowerEmail,
          code: otpHash,
          type: 'EMAIL_VERIFICATION',
          expiresAt,
          attempts: 0,
        });

        this.mailService.sendOtpEmail(user.email, otp, 'VERIFICATION').catch((err) => {
          this.logger.error(`[MailService] Lỗi gửi OTP kích hoạt lại tới ${user.email}:`, err);
        });
      }

      return {
        success: false,
        requireVerification: true,
        email: user.email,
        message: 'Tài khoản chưa được kích hoạt. Mã OTP đã được gửi tới email của bạn.',
      };
    }

    const payload = {
      userId: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      staff_permissions: user.staff_permissions || [],
    };

    const token = this.jwtService.sign(payload);

    return {
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        platform: (user as any).platform || 'EMAIL',
        wallet_balance: user.wallet_balance,
        profile: user.profile,
        staff_permissions: user.staff_permissions || [],
      },
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const { email, otp } = dto;
    const lowerEmail = email.trim().toLowerCase();

    const record = await this.verificationCodeModel.findOne({
      email: lowerEmail,
      type: 'EMAIL_VERIFICATION',
    });

    if (!record) {
      throw new BadRequestException('Mã xác thực không tồn tại hoặc đã hết hạn');
    }

    // YÊU CẦU 4: Giới hạn tối đa 5 lần thử
    if (record.attempts >= 5) {
      await this.verificationCodeModel.deleteOne({ _id: record._id });
      throw new BadRequestException('Bạn đã nhập sai quá 5 lần. Vui lòng yêu cầu gửi lại mã mới.');
    }

    // So khớp mã OTP (hỗ trợ cả hash bcrypt lẫn plain text cũ)
    let isMatch = false;
    if (record.code.startsWith('$2')) {
      isMatch = await bcrypt.compare(otp, record.code);
    } else {
      isMatch = record.code === otp;
    }

    if (!isMatch) {
      record.attempts = (record.attempts || 0) + 1;
      await record.save();
      const remaining = 5 - record.attempts;
      throw new BadRequestException(`Mã xác thực không chính xác. Bạn còn lại ${remaining} lần thử.`);
    }

    const user = await this.userModel.findOne({ email: lowerEmail });
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng');
    }

    user.isEmailVerified = true;
    await user.save();
    await this.verificationCodeModel.deleteOne({ _id: record._id });

    const token = this.jwtService.sign({
      userId: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isEmailVerified: true,
      staff_permissions: user.staff_permissions || [],
    });

    const userObj = user.toObject();
    delete (userObj as any).password_hash;

    return {
      success: true,
      message: 'Xác thực tài khoản thành công',
      token,
      user: userObj,
    };
  }

  async resendOtp(email: string) {
    const lowerEmail = email.trim().toLowerCase();
    const user = await this.userModel.findOne({ email: lowerEmail });
    if (!user) {
      throw new NotFoundException('Email chưa được đăng ký trong hệ thống');
    }

    const existingRecord = await this.verificationCodeModel.findOne({
      email: lowerEmail,
      type: 'EMAIL_VERIFICATION',
    });

    // Rate limit: Tối thiểu 60s giữa 2 lần gửi lại
    if (existingRecord) {
      const lastSentTime = new Date((existingRecord as any).updatedAt || (existingRecord as any).createdAt).getTime();
      const timeSinceLast = Date.now() - lastSentTime;
      if (timeSinceLast < 60 * 1000) {
        const waitSec = Math.ceil((60 * 1000 - timeSinceLast) / 1000);
        throw new BadRequestException(`Vui lòng đợi ${waitSec} giây trước khi yêu cầu mã mới.`);
      }
    }

    await this.verificationCodeModel.deleteMany({ email: lowerEmail, type: 'EMAIL_VERIFICATION' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const otpHash = await bcrypt.hash(otp, 8);

    await this.verificationCodeModel.create({
      email: lowerEmail,
      code: otpHash,
      type: 'EMAIL_VERIFICATION',
      expiresAt,
      attempts: 0,
    });

    this.mailService.sendOtpEmail(lowerEmail, otp, 'VERIFICATION').catch((err) => {
      this.logger.error(`[MailService] Lỗi gửi lại OTP tới ${lowerEmail}:`, err);
    });

    return { success: true, message: 'Mã xác thực mới đã được gửi về email của bạn' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const { email } = dto;
    const lowerEmail = email.toLowerCase();
    const user = await this.userModel.findOne({ email: lowerEmail });
    if (!user) {
      throw new NotFoundException('Email không tồn tại trong hệ thống');
    }

    await this.verificationCodeModel.deleteMany({ email: lowerEmail, type: 'PASSWORD_RESET' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.verificationCodeModel.create({
      email: lowerEmail,
      code: otp,
      type: 'PASSWORD_RESET',
      expiresAt,
    });

    await this.mailService.sendOtpEmail(lowerEmail, otp, 'PASSWORD_RESET');
    return { success: true, message: 'Mã đặt lại mật khẩu đã được gửi đến email của bạn' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { email, otp, newPassword } = dto;
    const lowerEmail = email.toLowerCase();

    const record = await this.verificationCodeModel.findOne({
      email: lowerEmail,
      type: 'PASSWORD_RESET',
    });

    if (!record || record.code !== otp) {
      throw new BadRequestException('Mã xác thực không chính xác hoặc đã hết hạn');
    }

    const user = await this.userModel.findOne({ email: lowerEmail });
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }

    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(newPassword, salt);
    await user.save();

    await this.verificationCodeModel.deleteOne({ _id: record._id });
    return { success: true, message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const oldPassword = dto.oldPassword || dto.currentPassword;
    if (!oldPassword) {
      throw new BadRequestException('Vui lòng nhập mật khẩu hiện tại');
    }

    const { newPassword } = dto;
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      throw new BadRequestException('Mật khẩu mới phải có ít nhất 6 ký tự');
    }

    const user = await this.userModel.findById(userId).select('+password_hash');
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác');
    }

    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(newPassword, salt);
    await user.save();

    return { success: true, message: 'Đổi mật khẩu thành công' };
  }

  async googleAuthCallback(code: string, redirectUri: string) {
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    const userRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
    });
    const googleUser = userRes.data;

    let user = await this.userModel.findOne({ email: googleUser.email.toLowerCase() });
    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-10);
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(randomPassword, salt);

      let baseUsername = googleUser.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
      const existingUser = await this.userModel.findOne({ username: baseUsername });
      if (existingUser) {
        baseUsername += Math.floor(Math.random() * 1000);
      }

      user = new this.userModel({
        username: baseUsername,
        email: googleUser.email.toLowerCase(),
        password_hash: passwordHash,
        role: UserRole.CUSTOMER,
        isEmailVerified: true,
        platform: 'GOOGLE',
        wallet_balance: 0,
        pending_balance: 0,
        profile: { avatar: googleUser.picture || '' },
      });
      await user.save();
    }

    const token = this.jwtService.sign({
      userId: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isEmailVerified: true,
      staff_permissions: user.staff_permissions || [],
    });

    return { token, user };
  }
}

