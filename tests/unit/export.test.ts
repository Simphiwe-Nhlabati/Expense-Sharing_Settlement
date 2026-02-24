import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock auth
vi.mock('@/app/actions/auth', () => ({
  getAuthenticatedUser: vi.fn(),
}));

// Mock database
vi.mock('@/server/db', () => {
  const mockDb = {
    query: {
      groupMembers: {
        findFirst: vi.fn(),
      },
      groups: {
        findFirst: vi.fn(),
      },
    },
    select: vi.fn(() => mockDb),
    from: vi.fn(() => mockDb),
    leftJoin: vi.fn(() => mockDb),
    where: vi.fn(() => mockDb),
    orderBy: vi.fn().mockResolvedValue([]),
  };
  return { db: mockDb };
});

import { getGroupExportData } from '@/app/actions/export';
import { getAuthenticatedUser } from '@/app/actions/auth';
import { db } from '@/server/db';

describe('app/actions/export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getGroupExportData', () => {
    it('should return unauthorized if not authenticated', async () => {
      (getAuthenticatedUser as any).mockResolvedValue(null);

      const result = await getGroupExportData('group-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('should return forbidden if user is not a group member', async () => {
      (getAuthenticatedUser as any).mockResolvedValue({ id: 'user-123' });
      (db.query.groupMembers.findFirst as any).mockResolvedValue(null);

      const result = await getGroupExportData('group-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Forbidden');
    });

    it('should return error if group not found', async () => {
      (getAuthenticatedUser as any).mockResolvedValue({ id: 'user-123' });
      (db.query.groupMembers.findFirst as any).mockResolvedValue({ userId: 'user-123', groupId: 'group-123' });
      (db.query.groups.findFirst as any).mockResolvedValue(null);

      const result = await getGroupExportData('group-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Group not found');
    });

    it('should return expenses and settlements for valid group', async () => {
      const mockUser = { id: 'user-123' };
      const mockGroup = { id: 'group-123', name: 'Test Group' };
      const mockMembership = { userId: 'user-123', groupId: 'group-123' };

      (getAuthenticatedUser as any).mockResolvedValue(mockUser);
      (db.query.groupMembers.findFirst as any).mockResolvedValue(mockMembership);
      (db.query.groups.findFirst as any).mockResolvedValue(mockGroup);

      // Mock expenses query
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([
          {
            id: 'expense-1',
            description: 'Dinner',
            amount: 50000, // R500.00 in cents
            date: new Date('2024-01-15'),
            payerName: 'John Doe',
            groupName: 'Test Group',
          },
        ]),
      });

      const result = await getGroupExportData('group-123');

      expect(result.success).toBe(true);
      expect(result.groupName).toBe('Test Group');
      expect(result.rows).toBeDefined();
      expect(result.rows?.length).toBeGreaterThan(0);
    });

    it('should format currency correctly in export rows', async () => {
      const mockUser = { id: 'user-123' };
      const mockGroup = { id: 'group-123', name: 'Test Group' };
      const mockMembership = { userId: 'user-123', groupId: 'group-123' };

      (getAuthenticatedUser as any).mockResolvedValue(mockUser);
      (db.query.groupMembers.findFirst as any).mockResolvedValue(mockMembership);
      (db.query.groups.findFirst as any).mockResolvedValue(mockGroup);

      // Mock expenses query with specific amount
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([
          {
            id: 'expense-1',
            description: 'Dinner',
            amount: 15050, // R150.50 in cents
            date: new Date('2024-01-15'),
            payerName: 'John Doe',
            groupName: 'Test Group',
          },
        ]),
      });

      const result = await getGroupExportData('group-123');

      expect(result.success).toBe(true);
      expect(result.rows?.[0].amount).toMatch(/R\s?150.50/);
    });

    it('should use en-ZA date format', async () => {
      const mockUser = { id: 'user-123' };
      const mockGroup = { id: 'group-123', name: 'Test Group' };
      const mockMembership = { userId: 'user-123', groupId: 'group-123' };

      (getAuthenticatedUser as any).mockResolvedValue(mockUser);
      (db.query.groupMembers.findFirst as any).mockResolvedValue(mockMembership);
      (db.query.groups.findFirst as any).mockResolvedValue(mockGroup);

      const testDate = new Date('2024-06-15');
      
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([
          {
            id: 'expense-1',
            description: 'Dinner',
            amount: 10000,
            date: testDate,
            payerName: 'John Doe',
            groupName: 'Test Group',
          },
        ]),
      });

      const result = await getGroupExportData('group-123');

      expect(result.success).toBe(true);
      // en-ZA format is yyyy/mm/dd
      expect(result.rows?.[0].date).toMatch(/\d{4}\/\d{2}\/\d{2}/);
    });

    it('should include generatedAt timestamp', async () => {
      const mockUser = { id: 'user-123' };
      const mockGroup = { id: 'group-123', name: 'Test Group' };
      const mockMembership = { userId: 'user-123', groupId: 'group-123' };

      (getAuthenticatedUser as any).mockResolvedValue(mockUser);
      (db.query.groupMembers.findFirst as any).mockResolvedValue(mockMembership);
      (db.query.groups.findFirst as any).mockResolvedValue(mockGroup);

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
      });

      const result = await getGroupExportData('group-123');

      expect(result.success).toBe(true);
      expect(result.generatedAt).toBeDefined();
    });

    it('should sort rows by date descending', async () => {
      const mockUser = { id: 'user-123' };
      const mockGroup = { id: 'group-123', name: 'Test Group' };
      const mockMembership = { userId: 'user-123', groupId: 'group-123' };

      (getAuthenticatedUser as any).mockResolvedValue(mockUser);
      (db.query.groupMembers.findFirst as any).mockResolvedValue(mockMembership);
      (db.query.groups.findFirst as any).mockResolvedValue(mockGroup);

      // Mock returning expenses in random order
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([
          {
            id: 'expense-1',
            description: 'Older expense',
            amount: 10000,
            date: new Date('2024-01-01'),
            payerName: 'John Doe',
            groupName: 'Test Group',
          },
          {
            id: 'expense-2',
            description: 'Newer expense',
            amount: 20000,
            date: new Date('2024-06-01'),
            payerName: 'Jane Doe',
            groupName: 'Test Group',
          },
        ]),
      });

      const result = await getGroupExportData('group-123');

      expect(result.success).toBe(true);
      // First row should be the newer expense
      expect(result.rows?.[0].description).toBe('Newer expense');
    });
  });
});
