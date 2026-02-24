import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockTables, resetMockDatabase, createMockDb } from '../mock-db';

// Mock database using shared state
vi.mock('@/server/db', () => {
  const mockDb = createMockDb();
  return { db: mockDb };
});

import { runIdempotentAction } from '@/server/middleware/idempotency';

describe('server/middleware/idempotency', () => {
  beforeEach(() => {
    resetMockDatabase();
    vi.clearAllMocks();
  });

  describe('runIdempotentAction', () => {
    it('should execute action and return result on first call', async () => {
      const action = vi.fn().mockResolvedValue({ id: '123', status: 'created' });
      
      const result = await runIdempotentAction(
        'key-001',
        'user-123',
        '/api/expenses',
        { amount: 100 },
        action
      );

      expect(result).toEqual({ id: '123', status: 'created' });
      expect(action).toHaveBeenCalledTimes(1);
    });

    it('should save idempotency key with correct metadata', async () => {
      const action = vi.fn().mockResolvedValue({ success: true });
      
      await runIdempotentAction(
        'key-003',
        'user-456',
        '/api/settlements',
        { groupId: 'g1', amount: 500 },
        action
      );

      const storedKey = mockTables.idempotencyKeys.find((k: any) => k.key === 'key-003');
      expect(storedKey).toBeDefined();
      expect(storedKey?.userId).toBe('user-456');
      expect(storedKey?.path).toBe('/api/settlements');
      expect(storedKey?.params).toEqual({ groupId: 'g1', amount: 500 });
    });

    it('should handle action that throws error', async () => {
      const action = vi.fn().mockRejectedValue(new Error('Database error'));
      
      await expect(
        runIdempotentAction(
          'key-004',
          'user-123',
          '/api/expenses',
          {},
          action
        )
      ).rejects.toThrow('Database error');
    });

    it('should use expiresAt 24 hours from now', async () => {
      const action = vi.fn().mockResolvedValue({ id: '123' });
      const beforeCall = new Date();
      
      await runIdempotentAction(
        'key-005',
        'user-123',
        '/api/expenses',
        {},
        action
      );

      const storedKey = mockTables.idempotencyKeys.find((k: any) => k.key === 'key-005');
      expect(storedKey).toBeDefined();
      expect(storedKey?.expiresAt).toBeInstanceOf(Date);
      
      const expectedMin = new Date(beforeCall.getTime() + 24 * 60 * 60 * 1000);
      expect(storedKey?.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime() - 5000);
    });

    it('should execute different keys independently', async () => {
      const action1 = vi.fn().mockResolvedValue({ id: '1', status: 'first' });
      const action2 = vi.fn().mockResolvedValue({ id: '2', status: 'second' });

      await runIdempotentAction('key-A', 'user-123', '/api/expenses', {}, action1);
      await runIdempotentAction('key-B', 'user-123', '/api/expenses', {}, action2);

      expect(action1).toHaveBeenCalledTimes(1);
      expect(action2).toHaveBeenCalledTimes(1);
      
      // Both keys should be stored
      expect(mockTables.idempotencyKeys.length).toBe(2);
    });
  });
});
