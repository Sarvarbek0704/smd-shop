import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterEmailDto } from './dto/register-email.dto';
import { LoginEmailDto } from './dto/login-email.dto';
import { RequestPhoneOtpDto } from './dto/request-phone-otp.dto';
import { VerifyPhoneOtpDto } from './dto/verify-phone-otp.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendEmailCodeDto } from './dto/resend-email-code.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { UserAgent } from '../../common/decorators/user-agent.decorator';
import { Ip } from '../../common/decorators/ip.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register/email')
  @ApiOperation({
    summary:
      "Email orqali ro'yxatdan o'tish — tasdiqlash kodi emailga yuboriladi",
  })
  @HttpCode(HttpStatus.OK)
  async registerEmail(@Body() dto: RegisterEmailDto) {
    await this.authService.registerWithEmail(dto);
    return {
      ok: true,
      message:
        'Tasdiqlash kodi emailingizga yuborildi. Pochtangizni tekshiring.',
    };
  }

  @Public()
  @Post('login/email')
  @ApiOperation({ summary: 'Email orqali kirish' })
  @HttpCode(HttpStatus.OK)
  loginEmail(
    @Body() dto: LoginEmailDto,
    @UserAgent() userAgent?: string,
    @Ip() ip?: string,
  ) {
    return this.authService.loginWithEmail(dto, { userAgent, ip });
  }

  @Public()
  @Post('phone/request-otp')
  @ApiOperation({
    summary: 'Telefonga OTP kod yuborish (register | login | reset_password)',
  })
  @HttpCode(HttpStatus.OK)
  async requestPhoneOtp(@Body() dto: RequestPhoneOtpDto) {
    await this.authService.requestPhoneOtp(dto.phone, dto.purpose);
    return { ok: true };
  }

  @Public()
  @Post('phone/verify-otp')
  @ApiOperation({
    summary:
      'OTP tekshirish va davom etish (login → tokenlar, register → tokenlar, reset → resetToken)',
  })
  @HttpCode(HttpStatus.OK)
  verifyPhoneOtp(
    @Body() dto: VerifyPhoneOtpDto,
    @UserAgent() userAgent?: string,
    @Ip() ip?: string,
  ) {
    return this.authService.verifyPhoneOtp(dto, { userAgent, ip });
  }

  @Public()
  @Post('verify-email')
  @ApiOperation({
    summary:
      "Email tasdiqlash kodi bilan — muvaffaqiyatli bo'lsa darhol kirish tokenlari beriladi",
  })
  @HttpCode(HttpStatus.OK)
  verifyEmail(
    @Body() dto: VerifyEmailDto,
    @UserAgent() userAgent?: string,
    @Ip() ip?: string,
  ) {
    return this.authService.verifyEmail(dto.email, dto.code, {
      userAgent,
      ip,
    });
  }

  @Public()
  @Post('resend-verification-email')
  @ApiOperation({ summary: 'Email tasdiqlash kodini qayta yuborish' })
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() dto: ResendEmailCodeDto) {
    await this.authService.resendEmailVerification(dto.email);
    return { ok: true };
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Parolni tiklash linki yuborish (email)' })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { ok: true };
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: "Yangi parol o'rnatish (token + parol)" })
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.password);
    return { ok: true };
  }

  @Public()
  @Post('refresh')
  @ApiOperation({
    summary: 'Access tokenni yangilash (refresh token rotation)',
  })
  @HttpCode(HttpStatus.OK)
  refresh(
    @Body() dto: RefreshDto,
    @UserAgent() userAgent?: string,
    @Ip() ip?: string,
  ) {
    return this.authService.refresh(dto.refreshToken, { userAgent, ip });
  }

  @ApiBearerAuth()
  @Post('logout')
  @ApiOperation({
    summary: 'Joriy sessiyadan chiqish (refresh tokenni bekor qilish)',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() dto: RefreshDto) {
    await this.authService.logout(dto.refreshToken);
  }

  @ApiBearerAuth()
  @Post('logout-all')
  @ApiOperation({ summary: 'Hamma qurilmalardan chiqish' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAll(@CurrentUser() user: AuthUser) {
    await this.authService.logoutAll(user.id);
  }
}
