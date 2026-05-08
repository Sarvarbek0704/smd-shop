import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';
import { OtpPurpose } from '../../../database/entities/phone-otp.entity';

export class VerifyPhoneOtpDto {
  @ApiProperty({ example: '+998901234567' })
  @IsString()
  phone!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(4, 8)
  code!: string;

  @ApiProperty({ enum: OtpPurpose })
  @IsEnum(OtpPurpose)
  purpose!: OtpPurpose;

  // Faqat REGISTER va RESET_PASSWORD uchun ishlatiladi
  @ApiProperty({ required: false, minLength: 8 })
  @IsOptional()
  @IsString()
  @Length(8, 72)
  @Matches(/[A-Z]/, { message: "Parolda kamida 1 katta harf bo'lsin" })
  @Matches(/[a-z]/, { message: "Parolda kamida 1 kichik harf bo'lsin" })
  @Matches(/\d/, { message: "Parolda kamida 1 raqam bo'lsin" })
  password?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string;
}
