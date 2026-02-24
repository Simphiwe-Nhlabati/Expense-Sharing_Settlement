import { describe, it, expect, vi, beforeEach } from 'vitest';
import { settleDebt } from '@/app/actions/settlements';
import { db } from '@/server/db';
import { ledgerEntries } from '@/server/db/schema';

// Mock DB
vi.mock('@/server/db', () => ({
  db: {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 'mock-settlement-id' }]),
    query: {
        groupMembers: {
            findFirst: vi.fn(),
        }
    }
  },
}));

// Mock Auth
vi.mock('@/app/actions/auth', () => ({
  getAuthenticatedUser: vi.fn().mockResolvedValue({ id: 'user-1', fullName: 'Test User' }),
}));

// Mock Audit
vi.mock('@/server/services/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(true),
}));

// Mock Next.js cache
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

describe('Settlement Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fail if amount is negative', async () => {
        const result = await settleDebt('group-1', 'user-2', -50);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Settlement amount must be positive');
    });

    it('should fail if user is not a group member', async () => {
        (db.query.groupMembers.findFirst as any).mockResolvedValue(null);
        
        const result = await settleDebt('group-1', 'user-2', 100);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Forbidden');
    });

    it('should succeed and log audit if member and positive amount', async () => {
        (db.query.groupMembers.findFirst as any).mockResolvedValue({ id: 'member-1' });
        
        const result = await settleDebt('group-1', 'user-2', 100);
        
        expect(result.success).toBe(true);
        expect(db.insert).toHaveBeenCalledWith(ledgerEntries);
    });
});
