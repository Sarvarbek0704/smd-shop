import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, Repository } from 'typeorm';
import { OtpPurpose, PhoneOtp } from '../../database/entities/phone-otp.entity';
import { generateNumericCode, hashToken } from '../../common/utils/hash.util';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    @InjectRepository(PhoneOtp)
    private readonly otpRepo: Repository<PhoneOtp>,
    private readonly configService: ConfigService,
  ) {}

  async sendOtp(phone: string, purpose: OtpPurpose): Promise<void> {
    const length = this.configService.getOrThrow<number>('otp.length');
    const expiresMinutes =
      this.configService.getOrThrow<number>('otp.expiresMinutes');
    const cooldownSeconds = this.configService.getOrThrow<number>(
      'otp.resendCooldownSeconds',
    );
    const secret = this.configService.getOrThrow<string>('jwt.accessSecret');

    // Cooldown tekshirish
    const lastOtp = await this.otpRepo.findOne({
      where: { phone, purpose },
      order: { lastSentAt: 'DESC' },
    });

    if (lastOtp) {
      const sinceLast = (Date.now() - lastOtp.lastSentAt.getTime()) / 1000;
      if (sinceLast < cooldownSeconds) {
        const wait = Math.ceil(cooldownSeconds - sinceLast);
        throw new HttpException(
          `Iltimos, ${wait} soniyadan keyin qayta urinib ko'ring`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // Eski yaroqli OTP'larni invalidate qilamiz
    await this.otpRepo.update(
      { phone, purpose, usedAt: IsNull() },
      { usedAt: new Date() },
    );

    const code = generateNumericCode(length);
    const codeHash = hashToken(code, secret);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresMinutes * 60 * 1000);

    await this.otpRepo.save(
      this.otpRepo.create({
        phone,
        codeHash,
        purpose,
        expiresAt,
        attempts: 0,
        lastSentAt: now,
      }),
    );

    // Hozircha SMS yo'q — konsolga
    this.logger.log(
      `[OTP] phone=${phone} purpose=${purpose} code=${code} expires=${expiresMinutes}min`,
    );
  }

  async verifyOtp(
    phone: string,
    code: string,
    purpose: OtpPurpose,
  ): Promise<boolean> {
    const secret = this.configService.getOrThrow<string>('jwt.accessSecret');
    const maxAttempts =
      this.configService.getOrThrow<number>('otp.maxAttempts');

    const otp = await this.otpRepo.findOne({
      where: { phone, purpose, usedAt: IsNull() },
      order: { lastSentAt: 'DESC' },
    });

    if (!otp) {
      throw new BadRequestException("OTP topilmadi yoki muddati o'tgan");
    }

    if (otp.expiresAt < new Date()) {
      throw new BadRequestException("OTP muddati o'tgan");
    }

    if (otp.attempts >= maxAttempts) {
      await this.otpRepo.update(otp.id, { usedAt: new Date() });
      throw new BadRequestException(
        "Juda ko'p noto'g'ri urinish. Yangi kod so'rang.",
      );
    }

    const expectedHash = hashToken(code, secret);
    if (expectedHash !== otp.codeHash) {
      await this.otpRepo.update(otp.id, { attempts: otp.attempts + 1 });
      throw new BadRequestException("Noto'g'ri kod");
    }

    await this.otpRepo.update(otp.id, { usedAt: new Date() });
    return true;
  }

  async cleanupExpired(): Promise<number> {
    const res = await this.otpRepo.delete({ expiresAt: LessThan(new Date()) });
    return res.affected ?? 0;
  }
}
