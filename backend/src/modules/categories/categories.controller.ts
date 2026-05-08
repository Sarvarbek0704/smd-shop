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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ReorderCategoriesDto } from './dto/reorder-category.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../database/entities/enums';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // ───────── Public (hamma ko'ra oladi) ─────────

  @Public()
  @Get('tree')
  @ApiOperation({ summary: 'Aktiv kategoriyalar daraxti (frontend uchun)' })
  getActiveTree() {
    return this.categoriesService.findActiveTree();
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: "Slug bo'yicha kategoriya va sub-kategoriyalari" })
  getBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Public()
  @Get(':id/ancestors')
  @ApiOperation({
    summary: 'Kategoriyaning ota-bobolar zanjiri (breadcrumb uchun)',
  })
  getAncestors(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findAncestors(id);
  }

  // ───────── Admin ─────────

  @ApiBearerAuth()
  @Get('admin/tree')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: "To'liq daraxt (admin — aktiv va noaktiv)" })
  getFullTree() {
    return this.categoriesService.findTree();
  }

  @ApiBearerAuth()
  @Get(':id')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Kategoriya tafsilotlari (admin)' })
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findByIdOrFail(id);
  }

  @ApiBearerAuth()
  @Post()
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Yangi kategoriya yaratish' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Kategoriyani tahrirlash' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, dto);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @Roles(RoleName.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Kategoriyani o'chirish (sub-kategoriyalari bo'lmasa)",
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.categoriesService.remove(id);
  }

  @ApiBearerAuth()
  @Patch('admin/reorder')
  @Roles(RoleName.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Kategoriyalar tartibini o'zgartirish (drag & drop)",
  })
  async reorder(@Body() dto: ReorderCategoriesDto) {
    await this.categoriesService.reorder(dto);
  }
}
