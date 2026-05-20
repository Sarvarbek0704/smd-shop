import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { SellerReplyDto } from './dto/seller-reply.dto';
import { ReviewsQueryDto } from './dto/reviews-query.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../database/entities/enums';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get('product/:productId')
  @ApiOperation({ summary: 'Mahsulotning sharhlari' })
  getByProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query() query: ReviewsQueryDto,
  ) {
    return this.reviewsService.findByProduct(productId, query);
  }

  @Public()
  @Get('product/:productId/summary')
  @ApiOperation({ summary: 'Reyting taqsimoti (5 yulduz → 1 yulduz)' })
  getRatingSummary(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.reviewsService.getProductRatingSummary(productId);
  }

  @ApiBearerAuth()
  @Get('seller')
  @Roles(RoleName.SELLER)
  @ApiOperation({ summary: "Seller mahsulotlarining sharhlari" })
  getSellerReviews(
    @CurrentUser() user: AuthUser,
    @Query() query: ReviewsQueryDto,
  ) {
    return this.reviewsService.findBySellerProducts(user.id, query);
  }

  @ApiBearerAuth()
  @Get('admin')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Barcha sharhlar (admin)' })
  getAdminReviews(@Query() query: ReviewsQueryDto) {
    return this.reviewsService.findAll(query);
  }

  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Sharh yozish' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(user.id, dto);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Sharhni o'chirish (o'zi yoki admin)" })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.reviewsService.remove(id, user);
  }

  @ApiBearerAuth()
  @Post(':id/seller-reply')
  @Roles(RoleName.SELLER)
  @ApiOperation({ summary: 'Seller javob yozish' })
  sellerReply(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: SellerReplyDto,
  ) {
    return this.reviewsService.sellerReply(id, user.id, dto.reply);
  }

  @ApiBearerAuth()
  @Patch(':id/publish')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: "Sharhni chop etish (admin)" })
  publish(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.setPublished(id, true);
  }

  @ApiBearerAuth()
  @Patch(':id/unpublish')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: "Sharhni yashirish (admin)" })
  unpublish(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.setPublished(id, false);
  }

  @ApiBearerAuth()
  @Patch(':id/toggle-publish')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: "Sharhni yashirish/ko'rsatish (admin)" })
  togglePublish(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.togglePublish(id);
  }
}
