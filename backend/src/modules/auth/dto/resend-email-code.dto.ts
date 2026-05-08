import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ResendEmailCodeDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: "Email noto'g'ri formatda" })
  email!: string;
}
