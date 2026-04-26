/**
 * Helper untuk auth: deteksi format email/HP & format ke E.164.
 * Phone-OTP belum aktif (butuh Twilio/Vonage — Fase 12).
 */

export type IdentifierKind = 'email' | 'phone' | 'unknown';

export function detectIdentifier(input: string): IdentifierKind {
  const v = input.trim();
  if (!v) return 'unknown';
  if (v.includes('@')) return 'email';
  // E.164: +<country><number>, atau angka lokal (08xx)
  if (/^\+?\d{6,16}$/.test(v.replace(/\s|-/g, ''))) return 'phone';
  return 'unknown';
}

/**
 * Normalisasi nomor HP Indonesia ke E.164.
 * - 08xx → +628xx
 * - 8xx → +628xx
 * - +62xx → tetap
 */
export function normalizeIdPhone(input: string): string | null {
  const digits = input.trim().replace(/[\s-]/g, '');
  if (/^\+62\d{8,13}$/.test(digits)) return digits;
  if (/^62\d{8,13}$/.test(digits)) return `+${digits}`;
  if (/^08\d{7,12}$/.test(digits)) return `+62${digits.slice(1)}`;
  if (/^8\d{7,12}$/.test(digits)) return `+62${digits}`;
  if (/^\+\d{8,15}$/.test(digits)) return digits;
  return null;
}
