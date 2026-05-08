import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../database/entities/enums';

@ApiBearerAuth()
@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // ───────── Admin ─────────

  @Get('dashboard')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Admin dashboard — umumiy statistika' })
  dashboard() {
    return this.analyticsService.getDashboard();
  }

  @Get('users')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Foydalanuvchilar statistikasi' })
  userStats() {
    return this.analyticsService.getUserStats();
  }

  @Get('products')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Mahsulotlar statistikasi' })
  productStats() {
    return this.analyticsService.getProductStats();
  }

  @Get('orders')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Buyurtmalar statistikasi' })
  orderStats() {
    return this.analyticsService.getOrderStats();
  }

  @Get('revenue')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Daromad statistikasi' })
  revenueStats() {
    return this.analyticsService.getRevenueStats();
  }

  @Get('delivery')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Yetkazma statistikasi' })
  deliveryStats() {
    return this.analyticsService.getDeliveryStats();
  }

  @Get('coupons')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Kuponlar statistikasi' })
  couponStats() {
    return this.analyticsService.getCouponStats();
  }

  // ───────── Seller ─────────

  @Get('seller')
  @Roles(RoleName.SELLER)
  @ApiOperation({ summary: "Seller dashboard — o'z statistikasi" })
  sellerAnalytics(@CurrentUser() user: AuthUser) {
    return this.analyticsService.getSellerAnalytics(user.id);
  }
}
