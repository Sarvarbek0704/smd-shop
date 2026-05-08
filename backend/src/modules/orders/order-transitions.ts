import { OrderStatus } from '../../database/entities/enums';

/**
 * Har bir status uchun — qaysi statuslarga o'tish mumkin.
 */
const transitions: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return transitions[from]?.includes(to) ?? false;
}

/**
 * Buyer qaysi statuslarga o'zgartira oladi.
 * Faqat bekor qilish — va faqat shipped bo'lgunga qadar.
 */
export function buyerCanCancel(status: OrderStatus): boolean {
  return [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(status);
}
