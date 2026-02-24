import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockTables, resetMockDatabase, createMockDb, transactionState } from '../mock-db';

// Mock DB using shared state
vi.mock('@/server/db', () => {
  const mockDb = createMockDb();
  return { db: mockDb };
});

// Mock auth
vi.mock('@/app/actions/auth', () => ({
  getAuthenticatedUser: vi.fn().mockResolvedValue({ id: 'user-1', fullName: 'Test User' }),
}));

// Mock Next.js cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Expense Actions', () => {
  beforeEach(() => {
    resetMockDatabase();
    vi.clearAllMocks();
  });

  it('should fail with invalid amount', async () => {
    const { createExpense } = await import('@/app/actions/expenses');
    
    const input = {
      groupId: '00000000-0000-0000-0000-000000000000',
      description: 'Lunch',
      amount: -10,
      payer: 'user-1',
      date: new Date().toISOString(),
    };

    const result = await createExpense(input);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid input');
  });

  it('should validate input before processing', async () => {
    const { createExpense } = await import('@/app/actions/expenses');
    
    // Test with missing required fields
    const input = {
      groupId: '00000000-0000-0000-0000-000000000000',
      description: '', // Empty description should fail
      amount: 100,
      payer: 'user-1',
      date: new Date().toISOString(),
    };

    const result = await createExpense(input);
    
    // Should fail validation
    expect(result.success).toBe(false);
  });
});
