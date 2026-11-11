import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response, Request } from 'express';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import {
  LoginDto,
  VerifyOtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { ReqUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto);
    res.cookie('verification_email', dto.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 10 * 1000,
      path: '/',
    });
    return result;
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with username/email and password' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    return result;
  }

  @Public()
  @Post('verify')
  @ApiOperation({ summary: 'Verify OTP code' })
  async verifyOtp(@Body() dto: VerifyOtpDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.verifyOtp(dto);
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    res.clearCookie('verification_email');
    return result;
  }

  @Public()
  @Post('resend')
  @ApiOperation({ summary: 'Resend OTP code' })
  async resendOtp(@Body('email') email: string) {
    return this.authService.resendOtp(email);
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request OTP for password reset' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with OTP' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('change-password')
  @ApiOperation({ summary: 'Change password (authenticated)' })
  async changePassword(@ReqUser() user: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.userId, dto);
  }

  @Public()
  @Get('google')
  @ApiOperation({ summary: 'Initiate Google OAuth login redirect' })
  async googleAuth(@Res() res: Response) {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.API_URL || 'https://apil-lr.leorank.site'}/api/auth/google/callback`;

    const params = new URLSearchParams({
      client_id: googleClientId || '',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'email profile',
      access_type: 'offline',
      prompt: 'consent',
    });

    return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  }

  @Public()
  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback handler' })
  async googleCallback(
    @Query('code') code: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'https://leorank.site';
    const redirectUri = `${process.env.API_URL || 'https://apil-lr.leorank.site'}/api/auth/google/callback`;

    try {
      const { token } = await this.authService.googleAuthCallback(code, redirectUri);
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      });
      return res.redirect(`${frontendUrl}/google-callback?token=${token}`);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.error_description ||
        err?.response?.data?.error ||
        err?.message ||
        'GoogleAuthFailed';
      console.error('[Google OAuth Callback Error]:', err?.response?.data || err?.message || err);
      return res.redirect(`${frontendUrl}/login?error=GoogleAuthFailed&reason=${encodeURIComponent(errorMsg)}`);
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  @ApiOperation({ summary: 'Logout and clear cookies' })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token');
    return { success: true, message: 'Đăng xuất thành công' };
  }
}

