import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AnalyticsService {
  constructor(private readonly dataSource: DataSource) {}

  // ───────── UMUMIY DASHBOARD ─────────

  async getDashboard() {
    const [userStats, productStats, orderStats, revenueStats, recentOrders] =
      await Promise.all([
        this.getUserStats(),
        this.getProductStats(),
        this.getOrderStats(),
        this.getRevenueStats(),
        this.getRecentOrders(10),
      ]);

    return {
      users: userStats,
      products: productStats,
      orders: orderStats,
      revenue: revenueStats,
      recentOrders,
    };
  }

  // ───────── FOYDALANUVCHILAR ─────────

  async getUserStats() {
    const total = await this.dataSource.query(`
      SELECT COUNT(*) as total,
             COUNT(*) FILTER (WHERE is_active = true) as active,
             COUNT(*) FILTER (WHERE is_verified = true) as verified,
             COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_this_month,
             COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_this_week
      FROM users
    `);

    const byRole = await this.dataSource.query(`
      SELECT r.name as role, COUNT(ur.user_id) as count
      FROM roles r
      LEFT JOIN user_roles ur ON ur.role_id = r.id
      GROUP BY r.name
      ORDER BY count DESC
    `);

    return {
      ...total[0],
      byRole: byRole.reduce(
        (acc: Record<string, number>, r: { role: string; count: string }) => {
          acc[r.role] = parseInt(r.count, 10);
          return acc;
        },
        {},
      ),
    };
  }

  // ───────── MAHSULOTLAR ─────────

  async getProductStats() {
    const stats = await this.dataSource.query(`
      SELECT COUNT(*) as total,
             COUNT(*) FILTER (WHERE status = 'active') as active,
             COUNT(*) FILTER (WHERE status = 'draft') as draft,
             COUNT(*) FILTER (WHERE status = 'banned') as banned,
             COUNT(*) FILTER (WHERE status = 'out_of_stock') as out_of_stock,
             COUNT(*) FILTER (WHERE is_featured = true) as featured,
             COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_this_month
      FROM products
    `);

    const topViewed = await this.dataSource.query(`
      SELECT id, name, slug, view_count, rating_avg, rating_count
      FROM products
      WHERE status = 'active'
      ORDER BY view_count DESC
      LIMIT 10
    `);

    const topRated = await this.dataSource.query(`
      SELECT id, name, slug, rating_avg, rating_count, view_count
      FROM products
      WHERE status = 'active' AND rating_count >= 3
      ORDER BY rating_avg DESC, rating_count DESC
      LIMIT 10
    `);

    const byCategory = await this.dataSource.query(`
      SELECT c.name as category, c.slug, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.status = 'active'
      WHERE c.parent_id IS NOT NULL
      GROUP BY c.id, c.name, c.slug
      ORDER BY product_count DESC
      LIMIT 15
    `);

    return {
      ...stats[0],
      topViewed,
      topRated,
      byCategory,
    };
  }

  // ───────── BUYURTMALAR ─────────

  async getOrderStats() {
    const stats = await this.dataSource.query(`
      SELECT COUNT(*) as total,
             COUNT(*) FILTER (WHERE status = 'pending') as pending,
             COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
             COUNT(*) FILTER (WHERE status = 'processing') as processing,
             COUNT(*) FILTER (WHERE status = 'shipped') as shipped,
             COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
             COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
             COUNT(*) FILTER (WHERE status = 'refunded') as refunded,
             COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as today,
             COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as this_week,
             COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as this_month
      FROM orders
    `);

    // Kunlik buyurtmalar (oxirgi 30 kun)
    const daily = await this.dataSource.query(`
      SELECT DATE(created_at) as date,
             COUNT(*) as orders,
             COALESCE(SUM(CAST(final_amount AS NUMERIC)), 0) as revenue
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '30 days'
        AND status != 'cancelled'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    return {
      ...stats[0],
      daily,
    };
  }

  // ───────── DAROMAD ─────────

  async getRevenueStats() {
    const totals = await this.dataSource.query(`
      SELECT
        COALESCE(SUM(CAST(final_amount AS NUMERIC)) FILTER (WHERE status = 'delivered'), 0) as total_revenue,
        COALESCE(SUM(CAST(final_amount AS NUMERIC)) FILTER (
          WHERE status = 'delivered' AND created_at >= NOW() - INTERVAL '30 days'
        ), 0) as revenue_this_month,
        COALESCE(SUM(CAST(final_amount AS NUMERIC)) FILTER (
          WHERE status = 'delivered' AND created_at >= NOW() - INTERVAL '7 days'
        ), 0) as revenue_this_week,
        COALESCE(SUM(CAST(final_amount AS NUMERIC)) FILTER (
          WHERE status = 'delivered' AND created_at >= NOW() - INTERVAL '24 hours'
        ), 0) as revenue_today,
        COALESCE(SUM(CAST(discount_amount AS NUMERIC)) FILTER (WHERE status = 'delivered'), 0) as total_discounts,
        COALESCE(AVG(CAST(final_amount AS NUMERIC)) FILTER (WHERE status = 'delivered'), 0) as avg_order_value
      FROM orders
    `);

    // To'lov usullari bo'yicha
    const byPaymentMethod = await this.dataSource.query(`
      SELECT payment_method,
             COUNT(*) as order_count,
             COALESCE(SUM(CAST(final_amount AS NUMERIC)), 0) as total
      FROM orders
      WHERE status = 'delivered'
      GROUP BY payment_method
      ORDER BY total DESC
    `);

    // Top seller'lar
    const topSellers = await this.dataSource.query(`
      SELECT u.id, u.first_name, u.last_name,
             COUNT(o.id) as order_count,
             COALESCE(SUM(CAST(o.final_amount AS NUMERIC)), 0) as total_revenue
      FROM orders o
      JOIN users u ON u.id = o.seller_id
      WHERE o.status = 'delivered'
      GROUP BY u.id, u.first_name, u.last_name
      ORDER BY total_revenue DESC
      LIMIT 10
    `);

    return {
      ...totals[0],
      byPaymentMethod,
      topSellers,
    };
  }

  // ───────── OXIRGI BUYURTMALAR ─────────

  async getRecentOrders(limit: number) {
    return this.dataSource.query(
      `
      SELECT o.id, o.order_number, o.status, o.payment_status,
             o.final_amount, o.payment_method, o.created_at,
             json_build_object(
               'id', buyer.id,
               'firstName', buyer.first_name,
               'lastName', buyer.last_name
             ) as buyer,
             json_build_object(
               'id', seller.id,
               'firstName', seller.first_name,
               'lastName', seller.last_name
             ) as seller
      FROM orders o
      JOIN users buyer ON buyer.id = o.buyer_id
      JOIN users seller ON seller.id = o.seller_id
      ORDER BY o.created_at DESC
      LIMIT $1
    `,
      [limit],
    );
  }

  // ───────── SELLER ANALYTICS ─────────

  async getSellerAnalytics(sellerId: string) {
    const orders = await this.dataSource.query(
      `
      SELECT COUNT(*) as total_orders,
             COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
             COUNT(*) FILTER (WHERE status = 'pending') as pending,
             COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
             COALESCE(SUM(CAST(final_amount AS NUMERIC)) FILTER (WHERE status = 'delivered'), 0) as total_revenue,
             COALESCE(SUM(CAST(final_amount AS NUMERIC)) FILTER (
               WHERE status = 'delivered' AND created_at >= NOW() - INTERVAL '30 days'
             ), 0) as revenue_this_month
      FROM orders
      WHERE seller_id = $1
    `,
      [sellerId],
    );

    const products = await this.dataSource.query(
      `
      SELECT COUNT(*) as total,
             COUNT(*) FILTER (WHERE status = 'active') as active,
             COALESCE(SUM(view_count), 0) as total_views
      FROM products
      WHERE seller_id = $1
    `,
      [sellerId],
    );

    const reviews = await this.dataSource.query(
      `
      SELECT COUNT(*) as total_reviews,
             COALESCE(AVG(r.rating), 0) as avg_rating
      FROM reviews r
      JOIN products p ON p.id = r.product_id
      WHERE p.seller_id = $1 AND r.is_published = true
    `,
      [sellerId],
    );

    // Kunlik sotuvlar (oxirgi 30 kun)
    const daily = await this.dataSource.query(
      `
      SELECT DATE(created_at) as date,
             COUNT(*) as orders,
             COALESCE(SUM(CAST(final_amount AS NUMERIC)), 0) as revenue
      FROM orders
      WHERE seller_id = $1
        AND status = 'delivered'
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `,
      [sellerId],
    );

    // Top mahsulotlar
    const topProducts = await this.dataSource.query(
      `
      SELECT p.id, p.name, p.slug, p.view_count,
             p.rating_avg, p.rating_count,
             COALESCE(SUM(oi.quantity), 0) as total_sold,
             COALESCE(SUM(CAST(oi.total_price AS NUMERIC)), 0) as total_revenue
      FROM products p
      LEFT JOIN order_items oi ON oi.product_id = p.id
      LEFT JOIN orders o ON o.id = oi.order_id AND o.status = 'delivered'
      WHERE p.seller_id = $1
      GROUP BY p.id, p.name, p.slug, p.view_count, p.rating_avg, p.rating_count
      ORDER BY total_sold DESC
      LIMIT 10
    `,
      [sellerId],
    );

    const o = orders[0];
    const p = products[0];
    const r = reviews[0];

    return {
      totalRevenue: Number(o.total_revenue ?? 0),
      monthRevenue: Number(o.revenue_this_month ?? 0),
      totalOrders: Number(o.total_orders ?? 0),
      pendingOrders: Number(o.pending ?? 0),
      cancelledOrders: Number(o.cancelled ?? 0),
      deliveredOrders: Number(o.delivered ?? 0),
      totalProducts: Number(p.total ?? 0),
      activeProducts: Number(p.active ?? 0),
      totalViews: Number(p.total_views ?? 0),
      avgRating: Number(r.avg_rating ?? 0),
      totalReviews: Number(r.total_reviews ?? 0),
      daily,
      topProducts: topProducts.map((tp: any) => ({
        ...tp,
        soldCount: Number(tp.total_sold ?? 0),
        revenue: Number(tp.total_revenue ?? 0),
      })),
    };
  }

  // ───────── DELIVERY STATS ─────────

  async getDeliveryStats() {
    const stats = await this.dataSource.query(`
      SELECT COUNT(*) as total,
             COUNT(*) FILTER (WHERE status = 'waiting') as waiting,
             COUNT(*) FILTER (WHERE status = 'assigned') as assigned,
             COUNT(*) FILTER (WHERE status = 'picked_up') as picked_up,
             COUNT(*) FILTER (WHERE status = 'on_the_way') as on_the_way,
             COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
             COUNT(*) FILTER (WHERE status = 'failed') as failed
      FROM deliveries
    `);

    const topCouriers = await this.dataSource.query(`
      SELECT u.id, u.first_name, u.last_name, u.phone,
             COUNT(d.id) FILTER (WHERE d.status = 'delivered') as delivered_count,
             COUNT(d.id) FILTER (WHERE d.status = 'failed') as failed_count,
             COUNT(d.id) as total_assigned
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id AND r.name = 'delivery'
      LEFT JOIN deliveries d ON d.courier_id = u.id
      GROUP BY u.id, u.first_name, u.last_name, u.phone
      ORDER BY delivered_count DESC
      LIMIT 10
    `);

    return { ...stats[0], topCouriers };
  }

  // ───────── COUPON STATS ─────────

  async getCouponStats() {
    return this.dataSource.query(`
      SELECT id, code, type, value, usage_count, usage_limit,
             is_active, valid_from, valid_until
      FROM coupons
      ORDER BY usage_count DESC
      LIMIT 20
    `);
  }
}
