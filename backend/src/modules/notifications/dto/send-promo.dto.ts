import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class SendPromoDto {
  @ApiProperty({ example: 'Yoz chegirmalari!' })
  @IsString()
  @Length(1, 255)
  title!: string;

  @ApiProperty({ example: 'Barcha elektronikaga 20% chegirma...' })
  @IsString()
  @Length(1, 2000)
  body!: string;

  @ApiPropertyOptional({
    description: "Aniq foydalanuvchilarga. Bo'sh bo'lsa — hammaga.",
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  userIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}
