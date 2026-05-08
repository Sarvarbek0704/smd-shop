import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CancelOrderDto {
  @ApiProperty({ example: 'Boshqa mahsulot tanladim' })
  @IsString()
  @Length(3, 500)
  reason!: string;
}
