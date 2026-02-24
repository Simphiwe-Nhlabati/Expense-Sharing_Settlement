import { describe, it, expect } from 'vitest';
import { generateInviteCode } from '@/lib/invite-code';

describe('lib/invite-code', () => {
  describe('generateInviteCode', () => {
    it('should generate a code with correct format (XXXX-XXXX)', () => {
      const code = generateInviteCode();
      expect(code).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    });

    it('should generate codes of correct length (9 characters including dash)', () => {
      const code = generateInviteCode();
      expect(code.length).toBe(9);
    });

    it('should include a dash at position 4', () => {
      const code = generateInviteCode();
      expect(code[4]).toBe('-');
    });

    it('should generate unique codes on each call', () => {
      const codes = new Set<string>();
      // Generate 100 codes and ensure they're all unique
      for (let i = 0; i < 100; i++) {
        codes.add(generateInviteCode());
      }
      expect(codes.size).toBe(100);
    });

    it('should exclude ambiguous characters (0, O, 1, I)', () => {
      const codes = [];
      for (let i = 0; i < 50; i++) {
        codes.push(generateInviteCode());
      }
      const allCodes = codes.join('');
      expect(allCodes).not.toContain('0');
      expect(allCodes).not.toContain('O');
      expect(allCodes).not.toContain('1');
      expect(allCodes).not.toContain('I');
    });

    it('should only use uppercase letters and numbers', () => {
      const code = generateInviteCode();
      // Remove the dash for testing
      const codeWithoutDash = code.replace('-', '');
      expect(codeWithoutDash).toBe(codeWithoutDash.toUpperCase());
    });
  });
});
