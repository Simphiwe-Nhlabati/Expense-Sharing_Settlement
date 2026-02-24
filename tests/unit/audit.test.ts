import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logAudit } from '@/server/services/audit';

// Mock database
vi.mock('@/server/db', () => {
  const mockDb = {
    insert: vi.fn(() => mockDb),
    values: vi.fn().mockResolvedValue({}),
  };
  return { db: mockDb };
});

// Mock schema
vi.mock('@/server/db/schema', () => ({
  auditLogs: {},
}));

import { db } from '@/server/db';

describe('server/services/audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logAudit', () => {
    it('should log audit entry with all fields', async () => {
      await logAudit({
        userId: 'user-123',
        action: 'CREATE',
        entityType: 'groups',
        entityId: 'group-456',
        metadata: { key: 'value' },
        changes: { before: null, after: { name: 'Test' } },
      });

      expect(db.insert).toHaveBeenCalled();
      expect(db.values).toHaveBeenCalledWith({
        userId: 'user-123',
        action: 'CREATE',
        entityType: 'groups',
        entityId: 'group-456',
        metadata: { key: 'value' },
        changes: { before: null, after: { name: 'Test' } },
      });
    });

    it('should log audit entry with minimal fields', async () => {
      await logAudit({
        action: 'DELETE',
        entityType: 'expenses',
      });

      expect(db.values).toHaveBeenCalledWith({
        userId: undefined,
        action: 'DELETE',
        entityType: 'expenses',
        entityId: undefined,
        metadata: undefined,
        changes: undefined,
      });
    });

    it('should handle all valid action types', async () => {
      const actions: Array<'CREATE' | 'UPDATE' | 'DELETE' | 'SETTLE'> = [
        'CREATE',
        'UPDATE',
        'DELETE',
        'SETTLE',
      ];

      for (const action of actions) {
        vi.clearAllMocks();
        await logAudit({
          userId: 'user-123',
          action,
          entityType: 'ledger',
        });
        expect(db.values).toHaveBeenCalledWith(
          expect.objectContaining({ action })
        );
      }
    });

    it('should handle all valid entity types', async () => {
      const entityTypes: Array<'groups' | 'expenses' | 'ledger' | 'group_members'> = [
        'groups',
        'expenses',
        'ledger',
        'group_members',
      ];

      for (const entityType of entityTypes) {
        vi.clearAllMocks();
        await logAudit({
          userId: 'user-123',
          action: 'CREATE',
          entityType,
        });
        expect(db.values).toHaveBeenCalledWith(
          expect.objectContaining({ entityType })
        );
      }
    });

    it('should not throw error on database failure', async () => {
      (db.values as any).mockRejectedValueOnce(new Error('DB connection failed'));
      
      // Should not throw
      await expect(
        logAudit({
          userId: 'user-123',
          action: 'CREATE',
          entityType: 'groups',
        })
      ).resolves.toBeUndefined();
    });

    it('should log complex metadata', async () => {
      const complexMetadata = {
        inviteCode: 'ABCD-1234',
        joinedAs: 'MEMBER',
        nested: { key: 'value' },
        array: [1, 2, 3],
      };

      await logAudit({
        userId: 'user-123',
        action: 'CREATE',
        entityType: 'group_members',
        entityId: 'member-789',
        metadata: complexMetadata,
        changes: { before: null, after: { status: 'active' } },
      });

      expect(db.values).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: complexMetadata,
        })
      );
    });

    it('should handle undefined userId gracefully', async () => {
      await logAudit({
        action: 'UPDATE',
        entityType: 'expenses',
        entityId: 'expense-123',
        changes: { before: { amount: 100 }, after: { amount: 200 } },
      });

      expect(db.values).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: undefined,
          action: 'UPDATE',
        })
      );
    });
  });
});
