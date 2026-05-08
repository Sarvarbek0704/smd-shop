import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RecommendationsService } from './recommendations.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('recommendations')
@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Public()
  @Get('trending')
  @ApiOperation({ summary: 'Trend mahsulotlar (haftalik)' })
  trending() {
    return this.recommendationsService.trending();
  }

  @Public()
  @Get('similar/:productId')
  @ApiOperation({ summary: "O'xshash mahsulotlar" })
  similar(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.recommendationsService.similar(productId);
  }

  @Public()
  @Get('also-viewed/:productId')
  @ApiOperation({ summary: "Bu mahsulotni ko'rganlar yana nimani ko'rgan" })
  alsoViewed(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.recommendationsService.alsoViewed(productId);
  }

  @ApiBearerAuth()
  @Get('for-you')
  @ApiOperation({ summary: 'Shaxsiy tavsiyalar (auth kerak)' })
  forYou(@CurrentUser() user: AuthUser) {
    return this.recommendationsService.forYou(user.id);
  }

  @ApiBearerAuth()
  @Get('recently-viewed')
  @ApiOperation({ summary: "Oxirgi ko'rilgan mahsulotlar (auth kerak)" })
  recentlyViewed(@CurrentUser() user: AuthUser) {
    return this.recommendationsService.recentlyViewed(user.id);
  }

  @Public()
  @Post('track/:productId')
  @ApiOperation({ summary: "Mahsulot ko'rishni qayd etish (guest)" })
  trackViewGuest(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.recommendationsService.trackView(
      productId,
      undefined,
      sessionId,
    );
  }

  @ApiBearerAuth()
  @Post('track/:productId/auth')
  @ApiOperation({ summary: "Mahsulot ko'rishni qayd etish (auth)" })
  trackViewAuth(
    @Param('productId', ParseUUIDPipe) productId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.recommendationsService.trackView(productId, user.id);
  }
}
