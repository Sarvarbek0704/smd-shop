import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { NotificationType } from '../../../database/entities/enums';

export class CreateNotificationDto {
  @ApiProperty()
  @IsUUID()
  userId!: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type!: NotificationType;

  @ApiProperty({ example: 'Buyurtma tasdiqlandi' })
  @IsString()
  @Length(1, 255)
  title!: string;

  @ApiProperty({
    example: 'Sizning ORD-20260605-A3F8B2 raqamli buyurtmangiz tasdiqlandi.',
  })
  @IsString()
  @Length(1, 2000)
  body!: string;

  @ApiPropertyOptional({ example: { orderId: '...', status: 'confirmed' } })
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}
