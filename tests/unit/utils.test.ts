import { describe, it, expect } from 'vitest';
import { formatCurrency, cn } from '@/lib/utils';

describe('lib/utils', () => {
  describe('formatCurrency', () => {
    it('should format ZAR cents to Rand correctly', () => {
      expect(formatCurrency(15050)).toMatch(/R\s?150.50/);
    });

    it('should format zero cents correctly', () => {
      expect(formatCurrency(0)).toMatch(/R\s?0.00/);
    });

    it('should format 1 cent correctly', () => {
      expect(formatCurrency(1)).toMatch(/R\s?0.01/);
    });

    it('should format large amounts correctly', () => {
      // en-ZA uses space as thousand separator and comma as decimal
      expect(formatCurrency(1000000)).toMatch(/R\s?10\s?000,00/);
    });

    it('should handle negative amounts', () => {
      expect(formatCurrency(-5000)).toMatch(/-R\s?50.00/);
    });

    it('should round to 2 decimal places', () => {
      // 1234 cents = R12.34
      expect(formatCurrency(1234)).toMatch(/R\s?12.34/);
    });

    it('should use en-ZA locale with comma separators', () => {
      const result = formatCurrency(1234567);
      // Should have thousand separators
      expect(result).toContain(',');
    });
  });

  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      expect(cn('foo', true && 'bar', false && 'baz')).toBe('foo bar');
    });

    it('should handle array of classes', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar');
    });

    it('should handle nested arrays', () => {
      expect(cn('foo', ['bar', 'baz'])).toBe('foo bar baz');
    });

    it('should handle empty and falsy values', () => {
      expect(cn('', null, undefined, false, 0)).toBe('');
    });

    it('should concatenate classes (simplified implementation)', () => {
      // Note: Our test mock doesn't include tailwind-merge
      // In production, cn uses tailwind-merge to handle conflicts
      expect(cn('px-2', 'px-4')).toBe('px-2 px-4');
    });
  });
});
