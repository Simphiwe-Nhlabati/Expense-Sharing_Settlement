import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGroup, getGroups } from '@/app/actions/groups';

// Mock DB with proper chain support
vi.mock('@/server/db', () => {
  const createChainableMock = (returnValue: any) => {
    const mock = {
      select: vi.fn(() => mock),
      from: vi.fn(() => mock),
      innerJoin: vi.fn(() => mock),
      where: vi.fn(() => mock),
      orderBy: vi.fn().mockResolvedValue(returnValue),
      insert: vi.fn(() => mock),
      values: vi.fn(() => mock),
      returning: vi.fn().mockResolvedValue([{ id: 'new-group-id', name: 'Test Group' }]),
      transaction: vi.fn((cb) => cb(mock)),
      query: {
        groupMembers: {
          findFirst: vi.fn(),
        },
        groups: {
          findFirst: vi.fn(),
        }
      },
      then: (onfulfilled: any) => Promise.resolve(returnValue).then(onfulfilled)
    };
    return mock;
  };

  const mockDb = createChainableMock([]);
  return { db: mockDb };
});

import { db } from '@/server/db';

// Mock Auth
vi.mock('@/app/actions/auth', () => ({
  getAuthenticatedUser: vi.fn().mockResolvedValue({ id: 'user-1', fullName: 'Test User' }),
}));

// Mock Next.js cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Group Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getGroups', () => {
    it('should return empty array if not authenticated', async () => {
      const { getAuthenticatedUser } = await import('@/app/actions/auth');
      (getAuthenticatedUser as any).mockResolvedValueOnce(null);
      const result = await getGroups();
      expect(result).toEqual([]);
    });

    it('should return list of groups for authenticated user', async () => {
      const mockGroups = [
        { id: 'g1', name: 'Group 1', role: 'OWNER' }
      ];
      
      // Setup mock to return groups
      (db as any).orderBy.mockResolvedValueOnce(mockGroups);
      
      const result = await getGroups();
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Group 1');
    });
  });

  describe('createGroup', () => {
    it('should fail with invalid input', async () => {
      const result = await createGroup({ name: '' } as any);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid input');
    });

    it('should create group and member entry on success', async () => {
      const result = await createGroup({ name: 'New Group', description: 'Desc', currency: 'ZAR' });
      expect(result.success).toBe(true);
      expect(db.insert).toHaveBeenCalled();
    });
  });
});
