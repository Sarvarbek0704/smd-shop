export enum RoleName {
  ADMIN = 'admin',
  SELLER = 'seller',
  BUYER = 'buyer',
  DELIVERY = 'delivery',
}

export enum OauthProvider {
  GOOGLE = 'google',
  TELEGRAM = 'telegram',
}

export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  BANNED = 'banned',
  OUT_OF_STOCK = 'out_of_stock',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  PAYME = 'payme',
  CLICK = 'click',
  UZUM = 'uzum',
  COD = 'cod',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum DeliveryStatus {
  WAITING = 'waiting',
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  ON_THE_WAY = 'on_the_way',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

export enum NotificationType {
  ORDER_STATUS = 'order_status',
  PROMO = 'promo',
  SYSTEM = 'system',
  CHAT = 'chat',
  REVIEW = 'review',
}

export enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}