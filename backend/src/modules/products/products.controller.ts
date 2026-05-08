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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsQueryDto } from './dto/products-query.dto';
import { AddImageDto } from './dto/add-image.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName, ProductStatus } from '../../database/entities/enums';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ───────── Public ─────────

  @Public()
  @Get()
  @ApiOperation({
    summary: "Mahsulotlar ro'yxati (filter, search, pagination)",
  })
  findAll(@Query() query: ProductsQueryDto) {
    return this.productsService.findAll(query);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: "Slug bo'yicha mahsulot (view count +1)" })
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  // ───────── Seller ─────────

  @ApiBearerAuth()
  @Get('seller/my')
  @Roles(RoleName.SELLER)
  @ApiOperation({ summary: "Sotuvchining o'z mahsulotlari" })
  findMyProducts(
    @CurrentUser() user: AuthUser,
    @Query() query: ProductsQueryDto,
  ) {
    return this.productsService.findSellerProducts(user.id, query);
  }

  @ApiBearerAuth()
  @Post()
  @Roles(RoleName.SELLER, RoleName.ADMIN)
  @ApiOperation({ summary: 'Yangi mahsulot yaratish' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProductDto) {
    return this.productsService.create(dto, user.id);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @Roles(RoleName.SELLER, RoleName.ADMIN)
  @ApiOperation({ summary: 'Mahsulotni tahrirlash' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto, user);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @Roles(RoleName.SELLER, RoleName.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Mahsulotni o'chirish" })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.productsService.remove(id, user);
  }

  // ───────── Images ─────────

  @ApiBearerAuth()
  @Post(':id/images')
  @Roles(RoleName.SELLER, RoleName.ADMIN)
  @ApiOperation({ summary: "Mahsulotga rasm qo'shish" })
  addImage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: AddImageDto,
  ) {
    return this.productsService.addImage(id, dto, user);
  }

  @ApiBearerAuth()
  @Delete(':id/images/:imageId')
  @Roles(RoleName.SELLER, RoleName.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Rasmni o'chirish" })
  async removeImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.productsService.removeImage(id, imageId, user);
  }

  @ApiBearerAuth()
  @Patch(':id/images/:imageId/primary')
  @Roles(RoleName.SELLER, RoleName.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Asosiy rasmni belgilash' })
  async setPrimary(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.productsService.setPrimaryImage(id, imageId, user);
  }

  // ───────── Admin ─────────

  @ApiBearerAuth()
  @Get('admin/all')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Barcha mahsulotlar (admin — barcha statusdagi)' })
  adminFindAll(@Query() query: ProductsQueryDto) {
    return this.productsService.findAll({
      ...query,
      status: query.status ?? undefined,
    });
  }

  @ApiBearerAuth()
  @Get(':id')
  @Roles(RoleName.SELLER, RoleName.ADMIN)
  @ApiOperation({ summary: "Mahsulot tafsilotlari (ID bo'yicha)" })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findByIdFull(id);
  }

  @ApiBearerAuth()
  @Patch(':id/status/:status')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: "Mahsulot statusini o'zgartirish (admin)" })
  adminSetStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('status') status: ProductStatus,
  ) {
    return this.productsService.adminUpdateStatus(id, status);
  }
}
