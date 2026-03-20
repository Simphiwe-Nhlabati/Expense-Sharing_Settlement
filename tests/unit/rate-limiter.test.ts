import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { db } from '@/server/db';

// Mock drizzle-orm to capture IP in eq function
vi.mock('drizzle-orm', async () => {
  const actual = await vi.importActual('drizzle-orm');
  return {
    ...(actual as object),
    and: (...args: any[]) => ({ type: 'and', args }),
    eq: vi.fn((field, value) => {
      // Capture the IP when eq is called with the ip field
      if (field?.name === 'ip' || field === 'ip') {
        (global as any).__queryIp = value;
      }
      return { type: 'eq', field, value };
    }),
    gte: (field: any, value: any) => ({ type: 'gte', field, value }),
    lt: (field: any, value: any) => ({ type: 'lt', field, value }),
    sql: new Proxy(
      function sql(strings: TemplateStringsArray, ...values: any[]) {
        return { type: 'sql', strings, values };
      },
      {
        get: (target, prop) => {
          if (prop === 'unsafe') return vi.fn();
          return (target as any)[prop];
        },
      }
    ) as any,
  };
});

describe('server/middleware/rate-limiter', () => {
  // In-memory store for rate limit data during tests
  let rateLimitStore: Array<{ ip: string; timestamp: Date }> = [];

  beforeEach(() => {
    // Reset the in-memory store before each test
    rateLimitStore = [];
    (global as any).__queryIp = null;

    // Setup select to return filtered count based on captured IP
    vi.mocked(db.select).mockImplementation(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockImplementation(() => {
        // Filter by the captured IP
        const queryIp = (global as any).__queryIp;
        const filtered = rateLimitStore.filter((entry) => {
          if (queryIp && entry.ip !== queryIp) return false;
          return true;
        });
        return Promise.resolve([{ count: filtered.length }]);
      }),
    } as any));

    // Setup insert to add to our in-memory store
    vi.mocked(db.insert).mockImplementation(() => ({
      values: vi.fn().mockImplementation((values) => {
        rateLimitStore.push({ ip: values.ip, timestamp: values.timestamp });
        return Promise.resolve(undefined);
      }),
    } as any));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should allow requests under the limit', async () => {
    const { rateLimiter } = await import('@/server/middleware/rate-limiter');
    const app = new Hono();

    app.use('*', rateLimiter(5)); // Limit to 5 requests per minute
    app.get('/test', (c) => c.json({ success: true }));

    // First 5 requests should succeed
    for (let i = 0; i < 5; i++) {
      const res = await app.request('/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      expect(res.status).toBe(200);
    }
  });

  it('should reject requests over the limit with 429', async () => {
    const { rateLimiter } = await import('@/server/middleware/rate-limiter');
    const app = new Hono();

    app.use('*', rateLimiter(3)); // Limit to 3 requests per minute
    app.get('/test', (c) => c.json({ success: true }));

    // First 3 requests should succeed
    for (let i = 0; i < 3; i++) {
      const res = await app.request('/test', {
        headers: { 'x-forwarded-for': '192.168.1.2' },
      });
      expect(res.status).toBe(200);
    }

    // 4th request should be rate limited
    const res = await app.request('/test', {
      headers: { 'x-forwarded-for': '192.168.1.2' },
    });
    expect(res.status).toBe(429);

    const body = await res.json();
    expect(body.error).toBe('Too many requests');
    expect(body.retryAfter).toBeDefined();
    expect(typeof body.retryAfter).toBe('number');
  });

  it('should track rate limits per IP address', async () => {
    const { rateLimiter } = await import('@/server/middleware/rate-limiter');
    const app = new Hono();

    app.use('*', rateLimiter(2));
    app.get('/test', (c) => c.json({ success: true }));

    // IP 1: Make 2 requests (at limit)
    await app.request('/test', { headers: { 'x-forwarded-for': '10.0.0.1' } });
    await app.request('/test', { headers: { 'x-forwarded-for': '10.0.0.1' } });

    // IP 2: Make 1 request (under limit)
    await app.request('/test', { headers: { 'x-forwarded-for': '10.0.0.2' } });

    // IP 1: 3rd request should fail
    const res1 = await app.request('/test', { headers: { 'x-forwarded-for': '10.0.0.1' } });
    expect(res1.status).toBe(429);

    // IP 2: 2nd request should succeed
    const res2 = await app.request('/test', { headers: { 'x-forwarded-for': '10.0.0.2' } });
    expect(res2.status).toBe(200);
  });

  it('should use default limit when not specified', async () => {
    const { rateLimiter } = await import('@/server/middleware/rate-limiter');
    const app = new Hono();

    app.use('*', rateLimiter()); // Use default limit (100)
    app.get('/test', (c) => c.json({ success: true }));

    // Should allow many requests
    for (let i = 0; i < 50; i++) {
      const res = await app.request('/test', {
        headers: { 'x-forwarded-for': `192.168.1.${i % 255}` },
      });
      expect(res.status).toBe(200);
    }
  });

  it('should use x-forwarded-for header for IP or default to localhost', async () => {
    const { rateLimiter } = await import('@/server/middleware/rate-limiter');
    const app = new Hono();

    app.use('*', rateLimiter(1));
    app.get('/test', (c) => c.json({ success: true }));

    // Request without x-forwarded-for should use default
    await app.request('/test');

    // Second request without x-forwarded-for should be limited
    const res = await app.request('/test');
    expect(res.status).toBe(429);
  });

  it('should include retryAfter in seconds', async () => {
    const { rateLimiter } = await import('@/server/middleware/rate-limiter');
    const app = new Hono();

    app.use('*', rateLimiter(1));
    app.get('/test', (c) => c.json({ success: true }));

    await app.request('/test', { headers: { 'x-forwarded-for': '172.16.0.1' } });

    const res = await app.request('/test', { headers: { 'x-forwarded-for': '172.16.0.1' } });
    expect(res.status).toBe(429);

    const body = await res.json();
    // retryAfter should be in seconds and less than 60 (window size is 1 minute)
    expect(body.retryAfter).toBeGreaterThan(0);
    expect(body.retryAfter).toBeLessThanOrEqual(60);
  });
});
