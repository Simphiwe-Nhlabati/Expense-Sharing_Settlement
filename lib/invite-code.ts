/**
 * Generates a unique, human-readable invite code.
 * Format: XXXX-XXXX (e.g., AB12-CD34)
 * Uses crypto for security — no external deps needed.
 */
export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Omit ambiguous chars (0/O, 1/I)
  const randomSegment = (len: number) =>
    Array.from({ length: len }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");

  return `${randomSegment(4)}-${randomSegment(4)}`;
}
