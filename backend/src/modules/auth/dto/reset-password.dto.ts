import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @Length(8, 72)
  @Matches(/[A-Z]/, { message: "Parolda kamida 1 katta harf bo'lsin" })
  @Matches(/[a-z]/, { message: "Parolda kamida 1 kichik harf bo'lsin" })
  @Matches(/\d/, { message: "Parolda kamida 1 raqam bo'lsin" })
  password!: string;
}
