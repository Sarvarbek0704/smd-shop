import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export enum SearchSortBy {
  RELEVANCE = 'relevance',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  RATING = 'rating',
  NEWEST = 'newest',
  POPULAR = 'popular',
}

export class SearchQueryDto extends PaginationQueryDto {
  @ApiProperty({ example: 'noutbuk', description: "Qidiruv so'zi" })
  @IsString()
  q!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string; // slug

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Minimal reyting (1-5)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  rating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  seller?: string;

  @ApiPropertyOptional({ enum: SearchSortBy, default: SearchSortBy.RELEVANCE })
  @IsOptional()
  @IsEnum(SearchSortBy)
  sort?: SearchSortBy;

  @ApiPropertyOptional({ description: 'Faqat stokda borlar' })
  @IsOptional()
  @Type(() => Boolean)
  inStock?: boolean;

  @ApiPropertyOptional({ description: 'Faqat chegirmalilar' })
  @IsOptional()
  @Type(() => Boolean)
  hasDiscount?: boolean;
}
