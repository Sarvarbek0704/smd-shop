import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class SellerReplyDto {
  @ApiProperty()
  @IsString()
  @Length(3, 2000)
  reply!: string;
}
