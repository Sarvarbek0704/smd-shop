import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginEmailDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: "Email noto'g'ri formatda" })
  email!: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  password!: string;
}
