import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../database/entities/user.entity';
import { Role } from '../../database/entities/role.entity';
import { RoleName } from '../../database/entities/enums';
import { EmailVerification } from '../../database/entities/email-verification.entity';
import { PasswordReset } from '../../database/entities/password-reset.entity';
import { OtpPurpose } from '../../database/entities/phone-otp.entity';
import { OtpService } from '../otp/otp.service';
import { MailService } from '../mail/mail.service';
import { TokenService, JwtPayload, TokensPair } from './token.service';
import {
  generateRandomToken,
  generateNumericCode,
  hashToken,
} from '../../common/utils/hash.util';
import { normalizeUzPhone } from '../../common/utils/phone.util';
import { RegisterEmailDto } from './dto/register-email.dto';
import { LoginEmailDto } from './dto/login-email.dto';
import { VerifyPhoneOtpDto } from './dto/verify-phone-otp.dto';

interface AuthMeta {
  userAgent?: string;
  ip?: string;
}

export interface AuthResult extends TokensPair {
  user: {
    id: string;
    email: string | null;
    phone: string | null;
    firstName: string | null;
    lastName: string | null;
    isVerified: boolean;
    roles: string[];
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(EmailVerification)
    private readonly emailVerifRepo: Repository<EmailVerification>,
    @InjectRepository(PasswordReset)
    private readonly passwordResetRepo: Repository<PasswordReset>,
    private readonly otpService: OtpService,
    private readonly mailService: MailService,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  // ───────────────────────── EMAIL FLOW ─────────────────────────

  async registerWithEmail(dto: RegisterEmailDto): Promise<void> {
    const email = dto.email.toLowerCase().trim();

    const existing = await this.userRepo.findOne({ where: { email } });

    if (existing) {
      if (existing.isVerified) {
        throw new ConflictException('Bu email bilan foydalanuvchi mavjud');
      }
      const passwordHash = await bcrypt.hash(dto.password, 10);
      await this.userRepo.update(existing.id, {
        passwordHash,
        firstName: dto.firstName ?? existing.firstName,
        lastName: dto.lastName ?? existing.lastName,
      });
      await this.sendEmailVerificationCode(existing.id, email);
      return;
    }

    const buyerRole = await this.roleRepo.findOneByOrFail({
      name: RoleName.BUYER,
    });

    const user = await this.dataSource.transaction(async (manager) => {
      const passwordHash = await bcrypt.hash(dto.password, 10);
      return manager.save(
        manager.create(User, {
          email,
          passwordHash,
          firstName: dto.firstName ?? null,
          lastName: dto.lastName ?? null,
          isVerified: false,
          isActive: true,
          roles: [buyerRole],
        }),
      );
    });

    await this.sendEmailVerificationCode(user.id, email);
  }

  async loginWithEmail(
    dto: LoginEmailDto,
    meta: AuthMeta,
  ): Promise<AuthResult> {
    const email = dto.email.toLowerCase().trim();

    const user = await this.userRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.roles', 'r')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email })
      .getOne();

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Email yoki parol noto'g'ri");
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Akkount bloklangan');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException("Email yoki parol noto'g'ri");
    }

    if (!user.isVerified) {
      throw new ForbiddenException(
        'Email manzilingiz tasdiqlanmagan. Pochtangizni tekshiring yoki tasdiqlash kodini qayta yuboring.',
      );
    }

    return this.buildAuthResult(user, meta);
  }

  // ───────────────────── EMAIL VERIFICATION (OTP) ─────────────────────

  async sendEmailVerificationCode(
    userId: string,
    email: string,
  ): Promise<void> {
    const expiresHours = this.configService.getOrThrow<number>(
      'verification.emailExpiresHours',
    );
    const cooldownSeconds = this.configService.getOrThrow<number>(
      'otp.resendCooldownSeconds',
    );
    const codeLength = this.configService.getOrThrow<number>('otp.length');
    const secret = this.configService.getOrThrow<string>('jwt.accessSecret');

    // Cooldown tekshirish
    const lastRecord = await this.emailVerifRepo.findOne({
      where: { userId, usedAt: IsNull() },
      order: { lastSentAt: 'DESC' },
    });

    if (lastRecord) {
      const sinceLast = (Date.now() - lastRecord.lastSentAt.getTime()) / 1000;
      if (sinceLast < cooldownSeconds) {
        const wait = Math.ceil(cooldownSeconds - sinceLast);
        throw new HttpException(
          `Iltimos, ${wait} soniyadan keyin qayta urinib ko'ring`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // Eski tasdiqlanmagan kodlarni invalidate qilamiz
    await this.emailVerifRepo.update(
      { userId, usedAt: IsNull() },
      { usedAt: new Date() },
    );

    const code = generateNumericCode(codeLength);
    const codeHash = hashToken(code, secret);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresHours * 60 * 60 * 1000);

    await this.emailVerifRepo.save(
      this.emailVerifRepo.create({
        userId,
        email,
        codeHash,
        expiresAt,
        attempts: 0,
        lastSentAt: now,
      }),
    );

    try {
      await this.mailService.sendVerificationCode(email, code);
    } catch (err) {
      this.logger.error(
        `Email verification yuborishda xato: ${(err as Error).message}`,
      );
      throw new BadRequestException(
        "Tasdiqlash kodini yuborib bo'lmadi. Keyinroq qayta urinib ko'ring.",
      );
    }
  }

  async verifyEmail(
    email: string,
    code: string,
    meta: AuthMeta,
  ): Promise<AuthResult> {
    const normalizedEmail = email.toLowerCase().trim();
    const secret = this.configService.getOrThrow<string>('jwt.accessSecret');
    const maxAttempts =
      this.configService.getOrThrow<number>('otp.maxAttempts');

    const record = await this.emailVerifRepo.findOne({
      where: { email: normalizedEmail, usedAt: IsNull() },
      order: { lastSentAt: 'DESC' },
    });

    if (!record) {
      throw new BadRequestException(
        "Tasdiqlash kodi topilmadi. Yangi kod so'rang.",
      );
    }

    if (record.expiresAt < new Date()) {
      throw new BadRequestException("Tasdiqlash kodi muddati o'tgan");
    }

    if (record.attempts >= maxAttempts) {
      await this.emailVerifRepo.update(record.id, { usedAt: new Date() });
      throw new BadRequestException(
        "Juda ko'p noto'g'ri urinish. Yangi kod so'rang.",
      );
    }

    const expectedHash = hashToken(code, secret);
    if (expectedHash !== record.codeHash) {
      await this.emailVerifRepo.update(record.id, {
        attempts: record.attempts + 1,
      });
      throw new BadRequestException("Noto'g'ri kod");
    }

    // Kod to'g'ri — tasdiqlash
    await this.dataSource.transaction(async (manager) => {
      await manager.update(EmailVerification, record.id, {
        usedAt: new Date(),
      });
      await manager.update(User, record.userId, { isVerified: true });
    });

    const user = await this.userRepo.findOne({
      where: { id: record.userId },
      relations: ['roles'],
    });
    if (!user) {
      throw new BadRequestException('Foydalanuvchi topilmadi');
    }
    if (!user.isActive) {
      throw new ForbiddenException('Akkount bloklangan');
    }

    return this.buildAuthResult(user, meta);
  }

  async resendEmailVerification(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.userRepo.findOne({
      where: { email: normalizedEmail },
    });
    // Maxfiylik: email mavjudligini oshkor qilmaslik
    if (!user) return;
    if (user.isVerified) {
      throw new BadRequestException('Email allaqachon tasdiqlangan');
    }
    if (!user.email) return;

    await this.sendEmailVerificationCode(user.id, user.email);
  }

  // ───────────────────────── PHONE FLOW ─────────────────────────

  async requestPhoneOtp(rawPhone: string, purpose: OtpPurpose): Promise<void> {
    const phone = normalizeUzPhone(rawPhone);
    if (!phone) {
      throw new BadRequestException("Telefon raqami noto'g'ri formatda");
    }

    if (purpose === OtpPurpose.LOGIN || purpose === OtpPurpose.RESET_PASSWORD) {
      const user = await this.userRepo.findOne({ where: { phone } });
      if (!user) {
        throw new NotFoundException(
          'Bunday telefon raqamli foydalanuvchi topilmadi',
        );
      }
      if (!user.isActive) {
        throw new UnauthorizedException('Akkount bloklangan');
      }
    }

    if (purpose === OtpPurpose.REGISTER) {
      const existing = await this.userRepo.findOne({ where: { phone } });
      if (existing) {
        throw new ConflictException(
          'Bu telefon raqami bilan foydalanuvchi mavjud',
        );
      }
    }

    await this.otpService.sendOtp(phone, purpose);
  }

  async verifyPhoneOtp(
    dto: VerifyPhoneOtpDto,
    meta: AuthMeta,
  ): Promise<AuthResult | { ok: true; resetToken?: string }> {
    const phone = normalizeUzPhone(dto.phone);
    if (!phone) {
      throw new BadRequestException("Telefon raqami noto'g'ri formatda");
    }

    await this.otpService.verifyOtp(phone, dto.code, dto.purpose);

    if (dto.purpose === OtpPurpose.LOGIN) {
      const user = await this.userRepo.findOne({
        where: { phone },
        relations: ['roles'],
      });
      if (!user) {
        throw new NotFoundException('Foydalanuvchi topilmadi');
      }
      return this.buildAuthResult(user, meta);
    }

    if (dto.purpose === OtpPurpose.REGISTER) {
      if (!dto.password) {
        throw new BadRequestException(
          "Ro'yxatdan o'tish uchun parol talab qilinadi",
        );
      }

      const buyerRole = await this.roleRepo.findOneByOrFail({
        name: RoleName.BUYER,
      });

      const user = await this.dataSource.transaction(async (manager) => {
        const exists = await manager.findOne(User, { where: { phone } });
        if (exists) {
          throw new ConflictException(
            'Bu telefon raqami bilan foydalanuvchi mavjud',
          );
        }
        const passwordHash = await bcrypt.hash(dto.password!, 10);
        return manager.save(
          manager.create(User, {
            phone,
            passwordHash,
            firstName: dto.firstName ?? null,
            lastName: dto.lastName ?? null,
            isVerified: true,
            isActive: true,
            roles: [buyerRole],
          }),
        );
      });

      return this.buildAuthResult(user, meta);
    }

    if (dto.purpose === OtpPurpose.RESET_PASSWORD) {
      const user = await this.userRepo.findOneByOrFail({ phone });
      const accessSecret =
        this.configService.getOrThrow<string>('jwt.accessSecret');
      const expiresMinutes = this.configService.getOrThrow<number>(
        'verification.passwordResetExpiresMinutes',
      );
      const token = generateRandomToken(32);
      const tokenHash = hashToken(token, accessSecret);
      await this.passwordResetRepo.save(
        this.passwordResetRepo.create({
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + expiresMinutes * 60 * 1000),
        }),
      );
      return { ok: true, resetToken: token };
    }

    return { ok: true };
  }

  // ────────────────────── PASSWORD RESET (email) ──────────────────────

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { email: email.toLowerCase().trim() },
    });
    if (!user || !user.email) return;

    const accessSecret =
      this.configService.getOrThrow<string>('jwt.accessSecret');
    const expiresMinutes = this.configService.getOrThrow<number>(
      'verification.passwordResetExpiresMinutes',
    );
    const frontendUrl = this.configService.getOrThrow<string>('frontendUrl');

    const token = generateRandomToken(32);
    const tokenHash = hashToken(token, accessSecret);

    await this.passwordResetRepo.save(
      this.passwordResetRepo.create({
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + expiresMinutes * 60 * 1000),
      }),
    );

    const link = `${frontendUrl}/auth/reset-password?token=${token}`;
    await this.mailService
      .sendPasswordReset(user.email, link)
      .catch((err) =>
        this.logger.error(
          `Reset email yuborishda xato: ${(err as Error).message}`,
        ),
      );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const accessSecret =
      this.configService.getOrThrow<string>('jwt.accessSecret');
    const tokenHash = hashToken(token, accessSecret);

    const record = await this.passwordResetRepo.findOne({
      where: { tokenHash, usedAt: IsNull() },
    });

    if (!record) {
      throw new BadRequestException('Reset havolasi yaroqsiz yoki ishlatilgan');
    }
    if (record.expiresAt < new Date()) {
      throw new BadRequestException("Reset havolasi muddati o'tgan");
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.dataSource.transaction(async (manager) => {
      await manager.update(PasswordReset, record.id, { usedAt: new Date() });
      await manager.update(User, record.userId, { passwordHash });
    });

    await this.tokenService.revokeAllForUser(record.userId);
  }

  // ───────────────────────── REFRESH / LOGOUT ─────────────────────────

  async refresh(refreshToken: string, meta: AuthMeta): Promise<TokensPair> {
    const refreshSecret =
      this.configService.getOrThrow<string>('jwt.refreshSecret');
    const tokenHash = hashToken(refreshToken, refreshSecret);

    const stored = await this.dataSource
      .getRepository('refresh_tokens')
      .createQueryBuilder('rt')
      .where('rt.token_hash = :hash', { hash: tokenHash })
      .getRawOne<{ rt_user_id: string }>();

    if (!stored) {
      throw new UnauthorizedException('Refresh token yaroqsiz');
    }

    const user = await this.userRepo.findOne({
      where: { id: stored.rt_user_id },
      relations: ['roles'],
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException(
        'Foydalanuvchi topilmadi yoki bloklangan',
      );
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
      roles: user.roles.map((r) => r.name),
      isDemo: user.isDemo,
    };

    return this.tokenService.rotateRefreshToken(refreshToken, payload, meta);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.tokenService.revokeRefreshToken(refreshToken);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.tokenService.revokeAllForUser(userId);
  }

  // ───────────────────────── HELPERS ─────────────────────────

  private async buildAuthResult(
    user: User,
    meta: AuthMeta,
  ): Promise<AuthResult> {
    const roles =
      user.roles ??
      (await this.userRepo
        .findOne({ where: { id: user.id }, relations: ['roles'] })
        .then((u) => u?.roles ?? []));

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
      roles: roles.map((r) => r.name),
      isDemo: user.isDemo,
    };

    const tokens = await this.tokenService.issueTokens(payload, meta);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        isVerified: user.isVerified,
        roles: roles.map((r) => r.name),
      },
    };
  }
}
