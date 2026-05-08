import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { AssignCourierDto } from './dto/assign-courier.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';
import { DeliveriesQueryDto } from './dto/deliveries-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../database/entities/enums';

@ApiBearerAuth()
@ApiTags('delivery')
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  // ───────── Kuryer ─────────

  @Get('my')
  @Roles(RoleName.DELIVERY)
  @ApiOperation({ summary: 'Menga tayinlangan yetkazmalar' })
  myDeliveries(
    @CurrentUser() user: AuthUser,
    @Query() query: DeliveriesQueryDto,
  ) {
    return this.deliveryService.findMyCourier(user.id, query);
  }

  @Patch(':id/status')
  @Roles(RoleName.DELIVERY, RoleName.ADMIN)
  @ApiOperation({ summary: 'Yetkazma statusini yangilash (kuryer/admin)' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateDeliveryStatusDto,
  ) {
    return this.deliveryService.updateStatus(id, dto, user);
  }

  // ───────── Admin / Seller ─────────

  @Get()
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Barcha yetkazmalar (admin)' })
  findAll(@Query() query: DeliveriesQueryDto) {
    return this.deliveryService.findAll(query);
  }

  @Post('order/:orderId')
  @Roles(RoleName.ADMIN, RoleName.SELLER)
  @ApiOperation({ summary: 'Buyurtma uchun yetkazma yaratish' })
  createForOrder(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.deliveryService.createForOrder(orderId);
  }

  @Post(':id/assign')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Kuryer tayinlash' })
  assignCourier(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignCourierDto,
  ) {
    return this.deliveryService.assignCourier(id, dto);
  }

  @Patch(':id/estimated-time')
  @Roles(RoleName.ADMIN, RoleName.DELIVERY)
  @ApiOperation({ summary: 'Taxminiy yetkazish vaqtini belgilash' })
  setEstimatedTime(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('estimatedAt') estimatedAt: string,
  ) {
    return this.deliveryService.setEstimatedTime(id, estimatedAt);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: "Buyurtma yetkazma ma'lumotlari" })
  findByOrder(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.deliveryService.findByOrderId(orderId);
  }

  @Get(':id')
  @Roles(RoleName.ADMIN, RoleName.DELIVERY)
  @ApiOperation({ summary: 'Yetkazma tafsilotlari' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.deliveryService.findByIdFull(id);
  }
}
