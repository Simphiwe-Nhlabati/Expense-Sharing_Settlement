import { describe, it, expect } from 'vitest';
import { sanitize } from '@/server/middleware/sanitization';

describe('Input Sanitization', () => {
    it('should remove script tags', () => {
        const input = '<script>alert("xss")</script>Hello';
        expect(sanitize(input)).toBe('Hello');
    });

    it('should remove event handlers (strips all HTML with strict config)', () => {
        const input = '<img src=x onerror="alert(1)">';
        // With strict XSS config (no whitelist), all HTML tags are stripped
        expect(sanitize(input)).toBe('');
    });

    it('should remove javascript: protocol (strips all HTML)', () => {
        const input = '<a href="javascript:alert(1)">Click</a>';
        // With strict XSS config, all HTML tags are stripped, only text remains
        expect(sanitize(input)).toBe('Click');
    });

    it('should handle undefined or null', () => {
        expect(sanitize(null as any)).toBe(null);
        expect(sanitize('')).toBe('');
    });
});
