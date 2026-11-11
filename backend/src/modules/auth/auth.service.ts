import {
  Injectable,
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
  constructor(
    @InjectModel('User') private userModel: Model<IUser>,
    @InjectModel('VerificationCode')
    private verificationCodeModel: Model<IVerificationCode>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const { username, email, password, role, phoneNumber } = dto;

    const usernameRegex = /^[a-zA-Z0-9_\-\.]+$/;
    if (!usernameRegex.test(username)) {
      throw new BadRequestException('Tên đăng nhập không được chứa khoảng trắng hoặc ký tự đặc biệt');
    }

    const existingUser = await this.userModel.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });
    if (existingUser) {
      throw new BadRequestException('Email hoặc Tên đăng nhập đã tồn tại');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new this.userModel({
      username,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      role: role || UserRole.CUSTOMER,
      phoneNumber: phoneNumber || '',
      isEmailVerified: false,
      platform: 'EMAIL',
      wallet_balance: 0,
      pending_balance: 0,
      profile: { avatar: '' },
    });
    await newUser.save();

    // Create OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    await this.verificationCodeModel.create({
      email: email.toLowerCase(),
      code: otp,
      type: 'EMAIL_VERIFICATION',
      expiresAt,
    });

    await this.mailService.sendOtpEmail(email, otp, 'VERIFICATION');

    return {
      success: true,
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP.',
    };
  }

  async login(dto: LoginDto) {
    const { identifier, password } = dto;

    const user = await this.userModel
      .findOne({
        $or: [
          { email: new RegExp(`^${identifier}$`, 'i') },
          { username: new RegExp(`^${identifier}$`, 'i') },
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

    const payload = {
      userId: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
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
      },
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const { email, otp } = dto;
    const lowerEmail = email.toLowerCase();

    const record = await this.verificationCodeModel.findOne({
      email: lowerEmail,
      type: 'EMAIL_VERIFICATION',
    });

    if (!record) {
      throw new BadRequestException('Mã xác thực không tồn tại hoặc đã hết hạn');
    }

    if (record.attempts >= 3) {
      await this.verificationCodeModel.deleteOne({ _id: record._id });
      throw new BadRequestException('Bạn đã nhập sai quá số lần quy định. Vui lòng yêu cầu mã mới.');
    }

    if (record.code !== otp) {
      record.attempts += 1;
      await record.save();
      throw new BadRequestException(`Mã xác thực không chính xác. Còn lại ${3 - record.attempts} lần thử.`);
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
    const lowerEmail = email.toLowerCase();
    const user = await this.userModel.findOne({ email: lowerEmail });
    if (!user) {
      throw new NotFoundException('Email chưa được đăng ký trong hệ thống');
    }

    await this.verificationCodeModel.deleteMany({ email: lowerEmail, type: 'EMAIL_VERIFICATION' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.verificationCodeModel.create({
      email: lowerEmail,
      code: otp,
      type: 'EMAIL_VERIFICATION',
      expiresAt,
    });

    await this.mailService.sendOtpEmail(lowerEmail, otp, 'VERIFICATION');
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
    const { oldPassword, newPassword } = dto;
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
    });

    return { token, user };
  }
}

