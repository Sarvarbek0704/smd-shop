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
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../database/entities/enums';

@ApiTags('coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Public()
  @Get('validate/:code')
  @ApiOperation({ summary: 'Kupon kodini tekshirish' })
  validateCode(@Param('code') code: string) {
    return this.couponsService.validateCode(code);
  }

  @ApiBearerAuth()
  @Get()
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: "Kuponlar ro'yxati (admin)" })
  findAll(@Query() query: PaginationQueryDto) {
    return this.couponsService.findAll(query);
  }

  @ApiBearerAuth()
  @Get(':id')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Kupon tafsilotlari (admin)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.couponsService.findByIdOrFail(id);
  }

  @ApiBearerAuth()
  @Post()
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Kupon yaratish' })
  create(@Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Kuponni tahrirlash' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCouponDto) {
    return this.couponsService.update(id, dto);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @Roles(RoleName.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Kuponni o'chirish (ishlatilgan bo'lsa deactivate qiladi)",
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.couponsService.remove(id);
  }
}
