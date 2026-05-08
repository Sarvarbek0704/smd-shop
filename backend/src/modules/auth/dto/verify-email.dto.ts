import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: "Email noto'g'ri formatda" })
  email!: string;

  @ApiProperty({ example: '482916', description: '6 xonali tasdiqlash kodi' })
  @IsString()
  @Length(4, 8)
  code!: string;
}
