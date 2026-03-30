import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';

// In-memory store for rate limit data during tests
const rateLimitStore: Map<string, Date[]> = new Map();

describe('server/middleware/rate-limiter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitStore.clear();

    // Mock the db module with rate limit tracking per IP
    vi.mock('@/server/db', async () => {
      const actualDb = await vi.importActual('@/server/db');
      return {
        ...(actualDb as object),
        db: {
          select: vi.fn(() => ({
            from: vi.fn(() => ({
              where: vi.fn().mockImplementation((condition) => {
                // Extract IP from the mock condition tracking
                // For simplicity, we track all requests and return count
                const now = new Date();
                const oneMinuteAgo = new Date(now.getTime() - 60000);
                
                // Get all IPs and their counts
                let totalCount = 0;
                rateLimitStore.forEach((timestamps) => {
                  const recentTimestamps = timestamps.filter((t) => t > oneMinuteAgo);
                  totalCount += recentTimestamps.length;
                });
                
                return Promise.resolve([{ count: totalCount }]);
              }),
            })),
          })),
          insert: vi.fn(() => ({
            values: vi.fn().mockImplementation((data) => {
              const ip = data.ip || 'unknown';
              if (!rateLimitStore.has(ip)) {
                rateLimitStore.set(ip, []);
              }
              rateLimitStore.get(ip)!.push(new Date());
              return Promise.resolve();
            }),
          })),
        },
        getDb: vi.fn(() => ({
          select: vi.fn(() => ({
            from: vi.fn(() => ({
              where: vi.fn().mockImplementation((condition) => {
                const now = new Date();
                const oneMinuteAgo = new Date(now.getTime() - 60000);
                let totalCount = 0;
                rateLimitStore.forEach((timestamps) => {
                  const recentTimestamps = timestamps.filter((t) => t > oneMinuteAgo);
                  totalCount += recentTimestamps.length;
                });
                return Promise.resolve([{ count: totalCount }]);
              }),
            })),
          })),
          insert: vi.fn(() => ({
            values: vi.fn().mockImplementation((data) => {
              const ip = data.ip || 'unknown';
              if (!rateLimitStore.has(ip)) {
                rateLimitStore.set(ip, []);
              }
              rateLimitStore.get(ip)!.push(new Date());
              return Promise.resolve();
            }),
          })),
        })),
      };
    });
  });

  afterEach(() => {
    vi.resetModules();
    rateLimitStore.clear();
  });

  it('should allow requests under the limit', async () => {
    const { rateLimiter } = await import('@/server/middleware/rate-limiter');
    const app = new Hono();

    app.use('*', rateLimiter(5));
    app.get('/test', (c) => c.json({ success: true }));

    for (let i = 0; i < 5; i++) {
      const res = await app.request('/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      expect(res.status).toBe(200);
    }
  });

  it('should reject requests over the limit with 429', async () => {
    vi.resetModules();
    rateLimitStore.clear();

    const { rateLimiter } = await import('@/server/middleware/rate-limiter');
    const app = new Hono();

    app.use('*', rateLimiter(3));
    app.get('/test', (c) => c.json({ success: true }));

    for (let i = 0; i < 3; i++) {
      const res = await app.request('/test', {
        headers: { 'x-forwarded-for': '192.168.1.2' },
      });
      expect(res.status).toBe(200);
    }

    const res = await app.request('/test', {
      headers: { 'x-forwarded-for': '192.168.1.2' },
    });
    expect(res.status).toBe(429);

    const body = await res.json();
    expect(body.error).toBe('Too many requests');
    expect(body.retryAfter).toBeDefined();
  });

  it('should use default limit when not specified', async () => {
    vi.resetModules();
    rateLimitStore.clear();

    const { rateLimiter } = await import('@/server/middleware/rate-limiter');
    const app = new Hono();

    app.use('*', rateLimiter());
    app.get('/test', (c) => c.json({ success: true }));

    for (let i = 0; i < 50; i++) {
      const res = await app.request('/test', {
        headers: { 'x-forwarded-for': `192.168.1.${i % 255}` },
      });
      expect(res.status).toBe(200);
    }
  });

  it('should use x-forwarded-for header for IP or default to localhost', async () => {
    vi.resetModules();
    rateLimitStore.clear();

    const { rateLimiter } = await import('@/server/middleware/rate-limiter');
    const app = new Hono();

    app.use('*', rateLimiter(1));
    app.get('/test', (c) => c.json({ success: true }));

    await app.request('/test');

    const res = await app.request('/test');
    expect(res.status).toBe(429);
  });

  it('should include retryAfter in seconds', async () => {
    vi.resetModules();
    rateLimitStore.clear();

    const { rateLimiter } = await import('@/server/middleware/rate-limiter');
    const app = new Hono();

    app.use('*', rateLimiter(1));
    app.get('/test', (c) => c.json({ success: true }));

    await app.request('/test', { headers: { 'x-forwarded-for': '172.16.0.1' } });

    const res = await app.request('/test', { headers: { 'x-forwarded-for': '172.16.0.1' } });
    expect(res.status).toBe(429);

    const body = await res.json();
    expect(body.retryAfter).toBeGreaterThan(0);
    expect(body.retryAfter).toBeLessThanOrEqual(60);
  });
});
