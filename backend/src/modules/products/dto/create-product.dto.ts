import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus } from '../../../database/entities/enums';

export class CreateVariantDto {
  @ApiProperty({ example: 'SKU-001-L-BLUE' })
  @IsString()
  @Length(1, 100)
  sku!: string;

  @ApiProperty({ example: "L / Ko'k" })
  @IsString()
  @Length(1, 200)
  name!: string;

  @ApiPropertyOptional({
    example: 15000,
    description: "Asosiy narxga qo'shimcha/ayirma",
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  priceModifier?: number;

  @ApiProperty({ example: 50 })
  @IsInt()
  @Min(0)
  stockQuantity!: number;

  @ApiPropertyOptional({ example: { color: "Ko'k", size: 'L' } })
  @IsOptional()
  attributes?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateImageDto {
  @ApiProperty({ example: '/products/abc123.webp' })
  @IsString()
  url!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 15 Pro Max' })
  @IsString()
  @Length(1, 255)
  name!: string;

  @ApiPropertyOptional({
    description: "Bo'sh qolsa nomdan generatsiya qilinadi",
  })
  @IsOptional()
  @IsString()
  @Length(1, 280)
  slug?: string;

  @ApiProperty({ example: "To'liq tavsif..." })
  @IsString()
  @Length(1, 10000)
  description!: string;

  @ApiPropertyOptional({ example: 'Qisqacha tavsif' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  shortDescription?: string;

  @ApiProperty({ example: 15990000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  basePrice!: number;

  @ApiPropertyOptional({ example: 13990000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  discountEndsAt?: string;

  @ApiProperty()
  @IsUUID()
  categoryId!: string;

  @ApiPropertyOptional({ enum: ProductStatus, default: ProductStatus.DRAFT })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ type: [CreateVariantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];

  @ApiPropertyOptional({ type: [CreateImageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateImageDto)
  images?: CreateImageDto[];
}
