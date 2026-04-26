export type IdentifierKind = 'email' | 'phone' | 'unknown';

export function detectIdentifier(input: string): IdentifierKind {
  const v = input.trim();
  if (!v) return 'unknown';
  if (v.includes('@')) return 'email';
  if (/^\+?\d{6,16}$/.test(v.replace(/\s|-/g, ''))) return 'phone';
  return 'unknown';
}
