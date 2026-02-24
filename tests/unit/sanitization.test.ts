import { describe, it, expect } from 'vitest';
import { sanitize } from '@/server/middleware/sanitization';

describe('Input Sanitization', () => {
    it('should remove script tags', () => {
        const input = '<script>alert("xss")</script>Hello';
        expect(sanitize(input)).toBe('Hello');
    });

    it('should remove event handlers', () => {
        const input = '<img src=x onerror="alert(1)">';
        expect(sanitize(input)).toBe('<img src=x >');
    });

    it('should remove javascript: protocol', () => {
        const input = '<a href="javascript:alert(1)">Click</a>';
        expect(sanitize(input)).toBe('<a href="">Click</a>');
    });

    it('should handle undefined or null', () => {
        expect(sanitize(null as any)).toBe(null);
        expect(sanitize('')).toBe('');
    });
});
