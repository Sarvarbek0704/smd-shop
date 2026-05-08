import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class RegisterEmailDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: "Email noto'g'ri formatda" })
  email!: string;

  @ApiProperty({ example: 'StrongPass123!', minLength: 8 })
  @IsString()
  @Length(8, 72, { message: "Parol 8–72 belgi oralig'ida bo'lsin" })
  @Matches(/[A-Z]/, { message: "Parolda kamida 1 katta harf bo'lsin" })
  @Matches(/[a-z]/, { message: "Parolda kamida 1 kichik harf bo'lsin" })
  @Matches(/\d/, { message: "Parolda kamida 1 raqam bo'lsin" })
  password!: string;

  @ApiProperty({ required: false, example: 'Aliya' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstName?: string;

  @ApiProperty({ required: false, example: 'Karimova' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string;
}
