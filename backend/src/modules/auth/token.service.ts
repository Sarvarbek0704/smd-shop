import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { randomBytes } from 'node:crypto';
import type { SignOptions } from 'jsonwebtoken';
import { RefreshToken } from '../../database/entities/refresh-token.entity';
import { hashToken } from '../../common/utils/hash.util';

export interface JwtPayload {
  sub: string;
  email: string | null;
  phone: string | null;
  roles: string[];
}

export interface TokensPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshRepo: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async issueTokens(
    payload: JwtPayload,
    meta: { userAgent?: string; ip?: string } = {},
  ): Promise<TokensPair> {
    const accessSecret =
      this.configService.getOrThrow<string>('jwt.accessSecret');
    const accessExpires =
      this.configService.getOrThrow<string>('jwt.accessExpires');
    const refreshSecret =
      this.configService.getOrThrow<string>('jwt.refreshSecret');
    const refreshExpires =
      this.configService.getOrThrow<string>('jwt.refreshExpires');

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: accessSecret,
      expiresIn: accessExpires as SignOptions['expiresIn'],
    });

    const refreshToken = randomBytes(48).toString('base64url');
    const tokenHash = hashToken(refreshToken, refreshSecret);
    const expiresAt = this.parseExpiresToDate(refreshExpires);

    await this.refreshRepo.save(
      this.refreshRepo.create({
        userId: payload.sub,
        tokenHash,
        expiresAt,
        userAgent: meta.userAgent ?? null,
        ipAddress: meta.ip ?? null,
      }),
    );

    return { accessToken, refreshToken, expiresIn: accessExpires };
  }

  async rotateRefreshToken(
    oldToken: string,
    payload: JwtPayload,
    meta: { userAgent?: string; ip?: string } = {},
  ): Promise<TokensPair> {
    const refreshSecret =
      this.configService.getOrThrow<string>('jwt.refreshSecret');
    const oldHash = hashToken(oldToken, refreshSecret);

    const stored = await this.refreshRepo.findOne({
      where: { tokenHash: oldHash },
    });

    if (!stored) {
      throw new UnauthorizedException('Refresh token yaroqsiz');
    }

    if (stored.userId !== payload.sub) {
      throw new UnauthorizedException('Refresh token mos kelmadi');
    }

    if (stored.revokedAt) {
      // Token reuse — barcha sessiyalarni bekor qilamiz
      await this.revokeAllForUser(stored.userId);
      throw new UnauthorizedException('Refresh token allaqachon ishlatilgan');
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException("Refresh token muddati o'tgan");
    }

    const tokens = await this.issueTokens(payload, meta);

    const newHash = hashToken(tokens.refreshToken, refreshSecret);
    await this.refreshRepo.update(stored.id, {
      revokedAt: new Date(),
      replacedByTokenHash: newHash,
    });

    return tokens;
  }

  async revokeRefreshToken(token: string): Promise<void> {
    const refreshSecret =
      this.configService.getOrThrow<string>('jwt.refreshSecret');
    const hash = hashToken(token, refreshSecret);
    await this.refreshRepo.update(
      { tokenHash: hash, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.refreshRepo.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  private parseExpiresToDate(expires: string): Date {
    const match = expires.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Noto'g'ri JWT expires formati: ${expires}`);
    }
    const [, num, unit] = match;
    const value = parseInt(num, 10);
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return new Date(Date.now() + value * multipliers[unit]);
  }
}
