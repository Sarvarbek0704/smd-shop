import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhoneOtp } from '../../database/entities/phone-otp.entity';
import { OtpService } from './otp.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([PhoneOtp])],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
