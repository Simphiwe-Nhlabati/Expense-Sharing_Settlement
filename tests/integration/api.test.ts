import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Hono Server with Supertest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('GET /api/health should return 200', async () => {
    // Mock database before importing server
    vi.mock('@/server/db', () => ({
      db: {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([]),
          })),
        })),
        insert: vi.fn(() => ({
          values: vi.fn().mockResolvedValue(undefined),
        })),
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn().mockResolvedValue(undefined),
          })),
        })),
        delete: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn().mockResolvedValue(undefined),
          })),
        })),
      },
      getDb: vi.fn(() => ({
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([]),
          })),
        })),
        insert: vi.fn(() => ({
          values: vi.fn().mockResolvedValue(undefined),
        })),
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn().mockResolvedValue(undefined),
          })),
        })),
        delete: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn().mockResolvedValue(undefined),
          })),
        })),
      })),
    }));

    const { default: app } = await import('@/server/server');

    const res = await app.request('http://localhost/api/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  }, 10000);

  it('GET /api/groups should return 401 without auth', async () => {
    vi.resetModules();

    // Mock database before importing server
    vi.mock('@/server/db', () => ({
      db: {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([]),
          })),
        })),
        insert: vi.fn(() => ({
          values: vi.fn().mockResolvedValue(undefined),
        })),
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn().mockResolvedValue(undefined),
          })),
        })),
        delete: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn().mockResolvedValue(undefined),
          })),
        })),
      },
      getDb: vi.fn(() => ({
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([]),
          })),
        })),
        insert: vi.fn(() => ({
          values: vi.fn().mockResolvedValue(undefined),
        })),
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn().mockResolvedValue(undefined),
          })),
        })),
        delete: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn().mockResolvedValue(undefined),
          })),
        })),
      })),
    }));

    const { default: app } = await import('@/server/server');

    const res = await app.request('http://localhost/api/groups');
    expect(res.status).toBe(401);
  }, 10000);
});
