import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class MessagesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Bu ID dan oldingi xabarlar (cursor pagination)',
  })
  @IsOptional()
  @IsString()
  before?: string;
}
