import { vi } from 'vitest';
import '@testing-library/jest-dom';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a default QueryClient for tests
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
};

// Mock drizzle-orm for unit tests - provides mock implementations for all DB operations
vi.mock('drizzle-orm', async () => {
  const actual = await vi.importActual('drizzle-orm');
  return {
    ...(actual as object),
    and: (...args: any[]) => ({ type: 'and', args }),
    eq: (field: any, value: any) => ({ type: 'eq', field, value }),
    gte: (field: any, value: any) => ({ type: 'gte', field, value }),
    lt: (field: any, value: any) => ({ type: 'lt', field, value }),
    sql: new Proxy(
      function sql(strings: TemplateStringsArray, ...values: any[]) {
        return { type: 'sql', strings, values };
      },
      {
        get: (target, prop) => {
          if (prop === 'unsafe') return vi.fn();
          return (target as any)[prop];
        },
      }
    ) as any,
  };
});

// Mock @/server/db for unit tests - prevents actual database connections
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
}));

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({
    setTheme: vi.fn(),
    theme: 'light',
    resolvedTheme: 'light',
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children),
}));

// Mock @/lib/utils for component tests
vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => {
    const flatten = (arr: any): string[] => {
      if (!arr) return [];
      if (typeof arr === 'string') return [arr];
      if (Array.isArray(arr)) return arr.flatMap(flatten);
      return [];
    };
    return flatten(classes).filter(Boolean).join(' ');
  },
  formatCurrency: (amountInCents: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amountInCents / 100);
  },
  formatZarAmount: (amountInCents: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amountInCents / 100);
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock uuid
vi.mock('uuid', () => ({
  v4: () => 'test-uuid-1234',
}));

// Mock @/app/actions/auth - return null by default, tests can override
vi.mock('@/app/actions/auth', async () => {
  const actual = await vi.importActual('@/app/actions/auth');
  return {
    ...(actual as object),
    getAuthenticatedUser: vi.fn().mockResolvedValue(null),
    ensureUserSynced: vi.fn().mockResolvedValue({ success: true }),
  };
});

// Export test utilities
export { createTestQueryClient };
