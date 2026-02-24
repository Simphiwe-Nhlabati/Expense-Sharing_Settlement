import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Hono Server with Supertest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('GET /api/health should return 200', async () => {
    const { default: app } = await import('@/server/server');

    const res = await app.request('http://localhost/api/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  }, 10000); // 10 second timeout

  it('GET /api/groups should return 401 without auth', async () => {
    vi.resetModules();
    const { default: app } = await import('@/server/server');

    const res = await app.request('http://localhost/api/groups');
    expect(res.status).toBe(401);
  }, 10000); // 10 second timeout
});
