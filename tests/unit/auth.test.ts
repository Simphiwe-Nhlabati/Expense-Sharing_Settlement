import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock database
vi.mock('@/server/db', () => {
  const mockDb = {
    query: {
      users: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => mockDb),
    values: vi.fn(() => mockDb),
    returning: vi.fn().mockResolvedValue([]),
  };
  return { db: mockDb };
});

// Mock JWT auth service
vi.mock('@/server/services/auth', () => ({
  verifyAccessToken: vi.fn(),
}));

// Mock cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

import { getAuthenticatedUser } from '@/app/actions/auth';
import { db } from '@/server/db';
import { verifyAccessToken } from '@/server/services/auth';
import { cookies } from 'next/headers';

describe('app/actions/auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAuthenticatedUser', () => {
    it('should return null if no access token cookie', async () => {
      (cookies as any).mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      });

      const result = await getAuthenticatedUser();

      expect(result).toBeNull();
      expect(verifyAccessToken).not.toHaveBeenCalled();
    });

    it('should return null if token is invalid', async () => {
      (cookies as any).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: 'invalid-token' }),
      });
      (verifyAccessToken as any).mockResolvedValue(null);

      const result = await getAuthenticatedUser();

      expect(result).toBeNull();
    });

    it('should return existing user from database', async () => {
      const mockUser = {
        id: 'user-123',
        authId: 'auth-123',
        email: 'test@example.com',
        fullName: 'Test User',
        avatarUrl: 'https://example.com/avatar.png',
      };

      (cookies as any).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: 'valid-token' }),
      });
      (verifyAccessToken as any).mockResolvedValue({ userId: 'auth-123', email: 'test@example.com' });
      (db.query.users.findFirst as any).mockResolvedValueOnce(mockUser);

      const result = await getAuthenticatedUser();

      expect(result).toEqual(mockUser);
      expect(db.query.users.findFirst).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.any(Function),
      }));
    });

    it('should return null if user not in database', async () => {
      (cookies as any).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: 'valid-token' }),
      });
      (verifyAccessToken as any).mockResolvedValue({ userId: 'auth-123', email: 'test@example.com' });
      (db.query.users.findFirst as any).mockResolvedValueOnce(null);

      const result = await getAuthenticatedUser();

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      (cookies as any).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: 'valid-token' }),
      });
      (verifyAccessToken as any).mockResolvedValue({ userId: 'auth-123', email: 'test@example.com' });
      (db.query.users.findFirst as any).mockRejectedValue(new Error('Database error'));

      const result = await getAuthenticatedUser();

      expect(result).toBeNull();
    });
  });
});
