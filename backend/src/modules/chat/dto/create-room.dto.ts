import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({ description: 'Mahsulot ID' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ description: 'Seller ID' })
  @IsUUID()
  sellerId!: string;
}
