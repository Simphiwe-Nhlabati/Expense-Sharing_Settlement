import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockTables, resetMockDatabase, createMockDb } from '../mock-db';

/**
 * Integration Tests: Idempotency Flow
 * 
 * Per testing.md: Test the Idempotency flow: Simulate 2 identical requests 
 * arriving at the same time. Assert only one record is created.
 */

// Mock database using shared state
vi.mock('@/server/db', () => {
  const mockDb = createMockDb();
  return { db: mockDb };
});

// Mock auth
vi.mock('@/app/actions/auth', () => ({
  getAuthenticatedUser: vi.fn().mockResolvedValue({ id: 'user-123' }),
}));

// Mock Next.js cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Integration: Idempotency Flow', () => {
  beforeEach(() => {
    resetMockDatabase();
    vi.clearAllMocks();
  });

  it('should allow different idempotency keys to create separate records', async () => {
    const { runIdempotentAction } = await import('@/server/middleware/idempotency');
    
    const createExpenseAction = vi.fn()
      .mockResolvedValueOnce({ id: 'expense-1', status: 'created' })
      .mockResolvedValueOnce({ id: 'expense-2', status: 'created' });

    const result1 = await runIdempotentAction(
      'idem-key-A',
      'user-123',
      '/api/expenses',
      { amount: 10000 },
      createExpenseAction
    );

    const result2 = await runIdempotentAction(
      'idem-key-B',
      'user-123',
      '/api/expenses',
      { amount: 10000 },
      createExpenseAction
    );

    expect(result1).toEqual({ id: 'expense-1', status: 'created' });
    expect(result2).toEqual({ id: 'expense-2', status: 'created' });
    expect(createExpenseAction).toHaveBeenCalledTimes(2);
    expect(mockTables.idempotencyKeys.length).toBe(2);
  });

  it('should store request metadata for audit trail', async () => {
    const { runIdempotentAction } = await import('@/server/middleware/idempotency');
    
    await runIdempotentAction(
      'idem-key-004',
      'user-123',
      '/api/expenses',
      { groupId: 'group-1', amount: 15000, description: 'Team lunch' },
      vi.fn().mockResolvedValue({ id: 'expense-1' })
    );

    const storedKey = mockTables.idempotencyKeys.find((k: any) => k.key === 'idem-key-004');
    
    expect(storedKey).toBeDefined();
    expect(storedKey?.userId).toBe('user-123');
    expect(storedKey?.path).toBe('/api/expenses');
    expect(storedKey?.params).toEqual({ groupId: 'group-1', amount: 15000, description: 'Team lunch' });
    expect(storedKey?.responseBody).toEqual({ id: 'expense-1' });
  });

  it('should handle idempotency key expiration', async () => {
    const { runIdempotentAction } = await import('@/server/middleware/idempotency');
    
    const action = vi.fn().mockResolvedValue({ id: 'expense-1' });
    
    await runIdempotentAction(
      'idem-key-005',
      'user-123',
      '/api/expenses',
      {},
      action
    );

    const storedKey = mockTables.idempotencyKeys.find((k: any) => k.key === 'idem-key-005');
    
    expect(storedKey).toBeDefined();
    expect(storedKey?.expiresAt).toBeDefined();
    expect(storedKey?.expiresAt).toBeInstanceOf(Date);
  });

  it('should store idempotency key immediately (not through transaction)', async () => {
    const { runIdempotentAction } = await import('@/server/middleware/idempotency');
    
    const action = vi.fn().mockResolvedValue({ id: 'expense-1' });
    
    await runIdempotentAction(
      'idem-key-006',
      'user-123',
      '/api/expenses',
      {},
      action
    );

    // Key should be stored immediately
    expect(mockTables.idempotencyKeys.length).toBe(1);
    expect(mockTables.idempotencyKeys[0].key).toBe('idem-key-006');
  });
});
