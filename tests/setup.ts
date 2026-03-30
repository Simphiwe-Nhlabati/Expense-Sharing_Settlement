import { vi } from 'vitest';
import '@testing-library/jest-dom';

// React 19 compatibility: testing-library handles act() internally now
// Mock React.act to prevent errors in React 19
const React = require('react');
if (!React.act) {
  React.act = (callback: () => any) => {
    const result = callback();
    if (result instanceof Promise) {
      return result.then(() => undefined);
    }
    return undefined;
  };
}

// Create a default QueryClient for tests
export const createTestQueryClient = () => {
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

// Mock @/server/db/schema with all table exports
vi.mock('@/server/db/schema', () => ({
  users: { tableName: 'users', name: 'users' },
  groups: { tableName: 'groups', name: 'groups' },
  groupMembers: { tableName: 'group_members', name: 'group_members' },
  expenses: { tableName: 'expenses', name: 'expenses' },
  expenseSplits: { tableName: 'expense_splits', name: 'expense_splits' },
  settlements: { tableName: 'settlements', name: 'settlements' },
  ledgerEntries: { tableName: 'ledger_entries', name: 'ledger_entries' },
  auditLogs: { tableName: 'audit_logs', name: 'audit_logs' },
  rateLimitLogs: { tableName: 'rate_limit_logs', name: 'rate_limit_logs' },
  idempotencyKeys: { tableName: 'idempotency_keys', name: 'idempotency_keys' },
  subscriptions: { tableName: 'subscriptions', name: 'subscriptions' },
  subscriptionUsage: { tableName: 'subscription_usage', name: 'subscription_usage' },
}));

// Mock @/server/db for unit tests - prevents actual database connections
// Note: Tests that need custom db behavior should override this mock
vi.mock('@/server/db', () => {
  const mockDb = {
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
    query: {
      users: {
        findFirst: vi.fn().mockResolvedValue(undefined),
      },
      groups: {
        findFirst: vi.fn().mockResolvedValue(undefined),
      },
      groupMembers: {
        findFirst: vi.fn().mockResolvedValue(undefined),
      },
      expenses: {
        findFirst: vi.fn().mockResolvedValue(undefined),
      },
      settlements: {
        findFirst: vi.fn().mockResolvedValue(undefined),
      },
      ledgerEntries: {
        findFirst: vi.fn().mockResolvedValue(undefined),
      },
      auditLogs: {
        findFirst: vi.fn().mockResolvedValue(undefined),
      },
      idempotencyKeys: {
        findFirst: vi.fn().mockResolvedValue(undefined),
      },
    },
  };

  return {
    db: new Proxy(mockDb as any, {
      get: (target, prop) => {
        if (prop in target) return target[prop as keyof typeof target];
        return vi.fn();
      },
    }),
    getDb: vi.fn(() => mockDb),
  };
});

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({
    setTheme: vi.fn(),
    theme: 'light',
    resolvedTheme: 'light',
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => {
    const React = require('react');
    return React.createElement('div', null, children);
  },
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

// Mock Shadcn UI components for component tests
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, className, ...props }: any) => {
    const React = require('react');
    return React.createElement('button', { className, ...props }, children);
  },
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: any) => {
    const React = require('react');
    return React.createElement('div', { 'data-dialog': open ? 'open' : 'closed', 'data-testid': 'dialog' }, children);
  },
  DialogTrigger: ({ children, asChild }: any) => {
    const React = require('react');
    // When asChild is true, just render the children (they should be a button)
    if (asChild) {
      return children;
    }
    return React.createElement('div', { 'data-dialog-trigger': true }, children);
  },
  DialogContent: ({ children, className }: any) => {
    const React = require('react');
    return React.createElement('div', { className, 'data-dialog-content': true }, children);
  },
  DialogHeader: ({ children }: any) => {
    const React = require('react');
    return React.createElement('div', { 'data-dialog-header': true }, children);
  },
  DialogTitle: ({ children }: any) => {
    const React = require('react');
    return React.createElement('h2', { 'data-dialog-title': true }, children);
  },
  DialogDescription: ({ children }: any) => {
    const React = require('react');
    return React.createElement('p', { 'data-dialog-description': true }, children);
  },
  DialogFooter: ({ children }: any) => {
    const React = require('react');
    return React.createElement('div', { 'data-dialog-footer': true }, children);
  },
}));

vi.mock('@/components/ui/form', () => ({
  Form: ({ children }: any) => {
    const React = require('react');
    return React.createElement('form', null, children);
  },
  FormField: ({ render }: any) => {
    const React = require('react');
    return render.render();
  },
  FormItem: ({ children }: any) => {
    const React = require('react');
    return React.createElement('div', { 'data-form-item': true }, children);
  },
  FormLabel: ({ children }: any) => {
    const React = require('react');
    return React.createElement('label', null, children);
  },
  FormControl: ({ children }: any) => {
    const React = require('react');
    return React.createElement('div', null, children);
  },
  FormMessage: ({ children }: any) => {
    const React = require('react');
    return React.createElement('span', { 'data-form-message': true }, children);
  },
}));

vi.mock('@/components/ui/input', () => ({
  Input: ({ className, ...props }: any) => {
    const React = require('react');
    return React.createElement('input', { className, ...props });
  },
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, defaultValue, value }: any) => {
    const React = require('react');
    return React.createElement('select', { 'data-select': true, defaultValue, value }, children);
  },
  SelectTrigger: ({ children, className }: any) => {
    const React = require('react');
    return React.createElement('div', { className, 'data-select-trigger': true }, children);
  },
  SelectValue: ({ placeholder }: any) => {
    const React = require('react');
    return React.createElement('span', { 'data-select-value': true }, placeholder);
  },
  SelectContent: ({ children }: any) => {
    const React = require('react');
    return React.createElement('div', { 'data-select-content': true }, children);
  },
  SelectItem: ({ children, value }: any) => {
    const React = require('react');
    return React.createElement('option', { value }, children);
  },
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, className }: any) => {
    const React = require('react');
    return React.createElement('label', { className }, children);
  },
}));

vi.mock('@/components/ui/calendar', () => ({
  Calendar: ({ value, onChange }: any) => {
    const React = require('react');
    return React.createElement('input', { type: 'date', 'data-calendar': true, value });
  },
}));

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: any) => {
    const React = require('react');
    return React.createElement('div', { 'data-popover': true }, children);
  },
  PopoverTrigger: ({ children }: any) => {
    const React = require('react');
    return React.createElement('button', { 'data-popover-trigger': true }, children);
  },
  PopoverContent: ({ children }: any) => {
    const React = require('react');
    return React.createElement('div', { 'data-popover-content': true }, children);
  },
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => {
    const React = require('react');
    return React.createElement('div', { 'data-dropdown-menu': true }, children);
  },
  DropdownMenuTrigger: ({ children, asChild }: any) => {
    const React = require('react');
    return asChild ? children : React.createElement('button', { 'data-dropdown-trigger': true }, children);
  },
  DropdownMenuContent: ({ children }: any) => {
    const React = require('react');
    return React.createElement('div', { 'data-dropdown-content': true }, children);
  },
  DropdownMenuItem: ({ children, onClick }: any) => {
    const React = require('react');
    return React.createElement('button', { onClick, 'data-dropdown-item': true }, children);
  },
}));
