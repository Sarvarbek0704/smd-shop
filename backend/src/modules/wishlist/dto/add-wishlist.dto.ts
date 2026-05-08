import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddWishlistDto {
  @ApiProperty()
  @IsUUID()
  productId!: string;
}
