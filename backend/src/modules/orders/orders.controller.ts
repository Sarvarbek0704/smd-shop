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
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersQueryDto } from './dto/orders-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../database/entities/enums';

@ApiBearerAuth()
@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ───────── Buyer ─────────

  @Post('checkout')
  @ApiOperation({
    summary:
      "Checkout — savatdan buyurtma yaratish (seller bo'yicha guruhlanadi)",
  })
  checkout(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    return this.ordersService.checkout(user.id, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Mening buyurtmalarim (buyer)' })
  myOrders(@CurrentUser() user: AuthUser, @Query() query: OrdersQueryDto) {
    return this.ordersService.findBuyerOrders(user.id, query);
  }

  @Get('my/:id')
  @ApiOperation({ summary: 'Buyurtma tafsilotlari (buyer)' })
  myOrderDetail(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ordersService.findByIdForBuyer(id, user.id);
  }

  @Post('my/:id/cancel')
  @ApiOperation({ summary: 'Buyurtmani bekor qilish (buyer)' })
  cancelOrder(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelOrderDto,
  ) {
    return this.ordersService.buyerCancel(id, user.id, dto.reason);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Buyurtma holat tarixi' })
  getHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.getStatusHistory(id);
  }

  // ───────── Seller ─────────

  @Get('seller/incoming')
  @Roles(RoleName.SELLER)
  @ApiOperation({ summary: 'Sotuvchiga kelgan buyurtmalar' })
  sellerOrders(@CurrentUser() user: AuthUser, @Query() query: OrdersQueryDto) {
    return this.ordersService.findSellerOrders(user.id, query);
  }

  @Get('seller/:id')
  @Roles(RoleName.SELLER)
  @ApiOperation({ summary: 'Buyurtma tafsilotlari (seller)' })
  sellerOrderDetail(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ordersService.findByIdForSeller(id, user.id);
  }

  @Patch('seller/:id/status')
  @Roles(RoleName.SELLER)
  @ApiOperation({
    summary:
      "Buyurtma statusini o'zgartirish (seller: confirmed → processing → shipped)",
  })
  sellerUpdateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto.status, user.id, dto.note);
  }

  // ───────── Admin ─────────

  @Get('admin/all')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Barcha buyurtmalar (admin)' })
  adminAllOrders(@Query() query: OrdersQueryDto) {
    return this.ordersService.findAllOrders(query);
  }

  @Patch('admin/:id/status')
  @Roles(RoleName.ADMIN)
  @ApiOperation({
    summary: "Buyurtma statusini o'zgartirish (admin — har qanday)",
  })
  adminUpdateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto.status, user.id, dto.note);
  }
}
