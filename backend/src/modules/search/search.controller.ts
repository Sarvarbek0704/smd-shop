import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Mahsulot qidirish (Full-Text Search + filtrlar)' })
  search(@Query() query: SearchQueryDto) {
    return this.searchService.search(query);
  }

  @Public()
  @Get('autocomplete')
  @ApiOperation({ summary: 'Avtomatik taklif (prefix)' })
  autocomplete(@Query('q') q: string) {
    return this.searchService.autocomplete(q);
  }

  @Public()
  @Get('popular')
  @ApiOperation({ summary: "Mashhur qidiruv so'zlari" })
  popular() {
    return this.searchService.popular();
  }
}
