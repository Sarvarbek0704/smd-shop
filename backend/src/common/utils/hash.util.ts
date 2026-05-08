import { createHmac, randomBytes } from 'node:crypto';

/**
 * Token uchun: deterministik xesh (qidirsa bo'ladi).
 * Secret kalit sifatida JWT secret'lardan birini ishlatamiz.
 */
export function hashToken(token: string, secret: string): string {
  return createHmac('sha256', secret).update(token).digest('hex');
}

/**
 * Tasodifiy URL-safe token (email verify, password reset uchun).
 */
export function generateRandomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/**
 * OTP kodi: faqat raqamlar.
 */
export function generateNumericCode(length: number): string {
  let code = '';
  // crypto.randomInt mavjud, lekin bir nechta marta chaqirish kerak —
  // randomBytes orqali bir martada olamiz va modulo bias'ni minimallashtiramiz.
  while (code.length < length) {
    const buf = randomBytes(length * 2);
    for (const byte of buf) {
      // 250 dan katta byte'larni tashlab yuboramiz (uniform distribution uchun)
      if (byte >= 250) continue;
      code += String(byte % 10);
      if (code.length >= length) break;
    }
  }
  return code.slice(0, length);
}
