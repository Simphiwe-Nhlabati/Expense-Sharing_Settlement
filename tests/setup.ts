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
