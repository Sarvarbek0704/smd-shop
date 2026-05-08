/**
 * Matndan URL-safe slug yaratish.
 * "Erkaklar uchun" → "erkaklar-uchun"
 * "Uy va bog'" → "uy-va-bog"
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/['''`]/g, '') // apostrof'larni o'chirish
    .replace(/[^\p{L}\p{N}\s-]/gu, '') // harflar, raqamlar, bo'sh joy, tire qoldirish
    .replace(/[\s_]+/g, '-') // bo'sh joy va _ → tire
    .replace(/-+/g, '-') // ko'p tire → bitta
    .replace(/^-|-$/g, ''); // boshi/oxiridagi tireni o'chirish
}

/**
 * Slugni unique qilish — oxiriga random suffix qo'shish.
 */
export function uniqueSlug(base: string): string {
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}
