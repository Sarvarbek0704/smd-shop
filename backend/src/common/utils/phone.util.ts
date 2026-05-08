/**
 * O'zbekiston telefon raqamini standart formatga keltiradi: +998XXXXXXXXX (12 belgi).
 * Qabul qiladi: 998XX..., +998XX..., 9 raqamli (XX...) bilan boshlangan, bo'sh joylar va `-` ham mumkin.
 * Noto'g'ri formatda — null qaytaradi.
 */
export function normalizeUzPhone(input: string): string | null {
  if (!input) return null;
  const cleaned = input.replace(/[\s\-()]/g, '');
  let digits: string;

  if (cleaned.startsWith('+998')) {
    digits = cleaned.slice(1); // 998XXXXXXXXX
  } else if (cleaned.startsWith('998')) {
    digits = cleaned;
  } else if (/^\d{9}$/.test(cleaned)) {
    digits = '998' + cleaned;
  } else {
    return null;
  }

  if (!/^998\d{9}$/.test(digits)) return null;
  return '+' + digits;
}

export function isValidUzPhone(input: string): boolean {
  return normalizeUzPhone(input) !== null;
}
