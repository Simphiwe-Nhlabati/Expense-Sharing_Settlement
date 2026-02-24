import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock auth
vi.mock('@/app/actions/auth', () => ({
  getAuthenticatedUser: vi.fn(),
}));

// Mock database
vi.mock('@/server/db', () => {
  const mockDb = {
    select: vi.fn(() => mockDb),
    from: vi.fn(() => mockDb),
    where: vi.fn().mockResolvedValue([]),
  };
  return { db: mockDb };
});

import { getDashboardStats } from '@/app/actions/dashboard';
import { getAuthenticatedUser } from '@/app/actions/auth';
import { db } from '@/server/db';

describe('app/actions/dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should return zero balances if not authenticated', async () => {
      (getAuthenticatedUser as any).mockResolvedValue(null);

      const result = await getDashboardStats();

      expect(result).toEqual({
        totalBalance: 0,
        youOwe: 0,
        owedToYou: 0,
      });
    });

    it('should return zero balances if no ledger entries exist', async () => {
      (getAuthenticatedUser as any).mockResolvedValue({ id: 'user-123' });
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      });

      const result = await getDashboardStats();

      expect(result.totalBalance).toBe(0);
      expect(result.owedToYou).toBe(0);
      expect(result.youOwe).toBeLessThanOrEqual(0); // Can be -0
    });

    it('should calculate owedToYou from EXPENSE_SHARE credits', async () => {
      (getAuthenticatedUser as any).mockResolvedValue({ id: 'user-123' });

      let callCount = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            // First call is for credits (toUserId)
            return Promise.resolve([
              { amount: 5000, type: 'EXPENSE_SHARE' },
              { amount: 3000, type: 'EXPENSE_SHARE' },
            ]);
          }
          // Second call for debits
          return Promise.resolve([]);
        }),
      }));

      const result = await getDashboardStats();

      expect(result.owedToYou).toBe(8000); // 5000 + 3000
    });

    it('should calculate youOwe from EXPENSE_SHARE debits', async () => {
      (getAuthenticatedUser as any).mockResolvedValue({ id: 'user-123' });

      // Credits - empty
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      });

      // Debits (money user owes)
      let callCount = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) return Promise.resolve([]); // credits
          return Promise.resolve([
            { amount: 2000, type: 'EXPENSE_SHARE' },
            { amount: 1500, type: 'EXPENSE_SHARE' },
          ]);
        }),
      }));

      const result = await getDashboardStats();

      // youOwe is negative of total debits
      expect(result.youOwe).toBe(-3500); // -(2000 + 1500)
    });

    it('should subtract SETTLEMENT from owedToYou', async () => {
      (getAuthenticatedUser as any).mockResolvedValue({ id: 'user-123' });

      let callCount = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            // Credits with settlements
            return Promise.resolve([
              { amount: 10000, type: 'EXPENSE_SHARE' },
              { amount: 4000, type: 'SETTLEMENT' },
            ]);
          }
          // Debits - empty
          return Promise.resolve([]);
        }),
      }));

      const result = await getDashboardStats();

      expect(result.owedToYou).toBe(6000); // 10000 - 4000
    });

    it('should subtract SETTLEMENT from youOwe', async () => {
      (getAuthenticatedUser as any).mockResolvedValue({ id: 'user-123' });

      // Credits - empty
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      });

      // Debits with settlements
      let callCount = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) return Promise.resolve([]);
          return Promise.resolve([
            { amount: 5000, type: 'EXPENSE_SHARE' },
            { amount: 2000, type: 'SETTLEMENT' },
          ]);
        }),
      }));

      const result = await getDashboardStats();

      // youOwe: -(5000 - 2000) = -3000
      expect(result.youOwe).toBe(-3000);
    });

    it('should calculate correct totalBalance (owedToYou - youOwe)', async () => {
      (getAuthenticatedUser as any).mockResolvedValue({ id: 'user-123' });

      // Credits
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          { amount: 10000, type: 'EXPENSE_SHARE' },
        ]),
      });

      // Debits
      let callCount = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) return Promise.resolve([
            { amount: 10000, type: 'EXPENSE_SHARE' },
          ]);
          return Promise.resolve([
            { amount: 4000, type: 'EXPENSE_SHARE' },
          ]);
        }),
      }));

      const result = await getDashboardStats();

      // owedToYou = 10000
      // youOwe = -4000
      // totalBalance = 10000 - 4000 = 6000
      expect(result.owedToYou).toBe(10000);
      expect(result.youOwe).toBe(-4000);
      expect(result.totalBalance).toBe(6000);
    });

    it('should handle mixed transaction types correctly', async () => {
      (getAuthenticatedUser as any).mockResolvedValue({ id: 'user-123' });

      // Complex scenario with multiple transaction types
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          { amount: 5000, type: 'EXPENSE_SHARE' },
          { amount: 2000, type: 'SETTLEMENT' },
          { amount: 3000, type: 'EXPENSE_SHARE' },
          { amount: 1000, type: 'SETTLEMENT' },
        ]),
      });

      let callCount = 0;
      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve([
              { amount: 5000, type: 'EXPENSE_SHARE' },
              { amount: 2000, type: 'SETTLEMENT' },
              { amount: 3000, type: 'EXPENSE_SHARE' },
              { amount: 1000, type: 'SETTLEMENT' },
            ]);
          }
          return Promise.resolve([
            { amount: 4000, type: 'EXPENSE_SHARE' },
            { amount: 1500, type: 'SETTLEMENT' },
          ]);
        }),
      }));

      const result = await getDashboardStats();

      // Credits: 5000 + 3000 - 2000 - 1000 = 5000
      expect(result.owedToYou).toBe(5000);
      
      // Debits: 4000 - 1500 = 2500, youOwe = -2500
      expect(result.youOwe).toBe(-2500);
      
      // totalBalance = 5000 - 2500 = 2500
      expect(result.totalBalance).toBe(2500);
    });
  });
});
