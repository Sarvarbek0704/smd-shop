import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';
import { Role } from '../../database/entities/role.entity';
import { RefreshToken } from '../../database/entities/refresh-token.entity';
import { EmailVerification } from '../../database/entities/email-verification.entity';
import { PasswordReset } from '../../database/entities/password-reset.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      RefreshToken,
      EmailVerification,
      PasswordReset,
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService],
  exports: [TokenService, AuthService],
})
export class AuthModule {}
