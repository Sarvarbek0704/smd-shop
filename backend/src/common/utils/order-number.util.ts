import { randomBytes } from 'node:crypto';

/**
 * Buyurtma raqami generatsiya qilish.
 * Format: ORD-YYYYMMDD-XXXXXX
 * Masalan: ORD-20260605-A3F8B2
 */
export function generateOrderNumber(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${y}${m}${d}-${rand}`;
}
