import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiPropertyOptional({ description: 'Verified purchase uchun order ID' })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional({ example: 'Ajoyib telefon' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  title?: string;

  @ApiProperty({ example: "Tez yetkazib berishdi, sifati a'lo" })
  @IsString()
  @Length(3, 5000)
  body!: string;

  @ApiPropertyOptional({ type: [String], description: 'Rasm URL lar' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
