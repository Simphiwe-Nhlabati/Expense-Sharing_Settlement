import { describe, it, expect } from 'vitest';
import app from '@/server/server';

describe('API Health Check', () => {
    it('should return 200 OK', async () => {
        const res = await app.request('/api/health');
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.status).toBe('ok');
        expect(res.headers.get('X-Request-ID')).toBeDefined();
    });
});
