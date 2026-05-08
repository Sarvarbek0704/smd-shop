import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../../../database/entities/enums';

export class ShippingAddressDto {
  @ApiProperty({ example: 'Toshkent viloyati' })
  @IsString()
  region!: string;

  @ApiProperty({ example: 'Toshkent' })
  @IsString()
  city!: string;

  @ApiProperty({ example: 'Amir Temur ko\'chasi, 12-uy' })
  @IsString()
  street!: string;

  @ApiPropertyOptional({ example: '100100' })
  @IsOptional()
  @IsString()
  zip?: string;

  @ApiPropertyOptional({ example: '2-qavat, 15-xonadon' })
  @IsOptional()
  @IsString()
  apartment?: string;

  @ApiPropertyOptional({ example: 'Qo\'ng\'iroq qiling, eshik kodi 1234' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateOrderDto {
  @ApiProperty({ type: ShippingAddressDto })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress!: ShippingAddressDto;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.COD })
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @ApiPropertyOptional({ description: 'Kupon kodi' })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}