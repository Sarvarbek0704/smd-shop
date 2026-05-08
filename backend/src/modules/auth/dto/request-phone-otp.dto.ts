import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { OtpPurpose } from '../../../database/entities/phone-otp.entity';

export class RequestPhoneOtpDto {
  @ApiProperty({ example: '+998901234567' })
  @IsString()
  phone!: string;

  @ApiProperty({ enum: OtpPurpose, example: OtpPurpose.LOGIN })
  @IsEnum(OtpPurpose)
  purpose!: OtpPurpose;
}
