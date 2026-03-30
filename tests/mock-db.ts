/**
 * Shared mock state for database tests
 * This file provides a centralized mock database that can be shared across test files
 */
import { vi } from 'vitest';

// In-memory database tables
export const mockTables = {
  expenses: [] as any[],
  ledgerEntries: [] as any[],
  idempotencyKeys: [] as any[],
  groupMembers: [] as any[],
  users: [] as any[],
  groups: [] as any[],
};

// Transaction state
export const transactionState = {
  shouldThrowError: false,
  transactionCalls: 0,
  pendingChanges: {
    expenses: [] as any[],
    ledgerEntries: [] as any[],
    idempotencyKeys: [] as any[],
  },
};

// Reset function for beforeEach
export function resetMockDatabase() {
  mockTables.expenses = [];
  mockTables.ledgerEntries = [];
  mockTables.idempotencyKeys = [];
  mockTables.groupMembers = [
    { userId: 'user-1', groupId: 'group-1' },
    { userId: 'user-2', groupId: 'group-1' },
  ];
  mockTables.users = [
    { id: 'user-1', authId: 'auth-123', email: 'test@example.com', fullName: 'Test User' },
  ];
  mockTables.groups = [];
  transactionState.shouldThrowError = false;
  transactionState.transactionCalls = 0;
  transactionState.pendingChanges = {
    expenses: [],
    ledgerEntries: [],
    idempotencyKeys: [],
  };
}

// Helper to detect table type from the schema object
function getTableName(table: any): string {
  if (!table) return 'unknown';
  // Drizzle tables have a Symbol for the name
  const symbolName = Symbol.for('drizzle:Name');
  if (table[symbolName]) {
    return String(table[symbolName]);
  }
  // Fallback to string representation
  return String(table);
}

// Helper to extract value from Drizzle SQL expression (eq, and, etc.)
function extractWhereCondition(whereClause: any): { field: string; value: any } | null {
  if (!whereClause) return null;

  // Drizzle's eq() returns an object with queryChunks
  if (whereClause.queryChunks) {
    // Extract field and value from the SQL expression
    const chunks = whereClause.queryChunks;
    // Look for the field name and value in the chunks
    let field = '';
    let value: any = null;

    for (const chunk of chunks) {
      // Check for field name in various formats
      if (chunk?.name) {
        field = chunk.name;
      } else if (chunk?.onTable?.key) {
        // Drizzle may store field info in onTable
        field = chunk.onTable.key;
      } else if (chunk?.field?.key) {
        // Or in field.key
        field = chunk.field.key;
      }
      
      // Check for value
      if (chunk?.value !== undefined && typeof chunk.value !== 'string') {
        value = chunk.value;
      } else if (typeof chunk === 'string' && !chunk.includes('(')) {
        // Might be a field name
        const trimmed = chunk.trim();
        if (trimmed && !trimmed.includes('.') && !trimmed.includes('=')) {
          field = trimmed;
        }
      }
    }

    // Try to get value from params
    if (whereClause.params && whereClause.params.length > 0) {
      value = whereClause.params[0];
    }

    if (field && value !== null && value !== undefined) {
      return { field, value };
    }
  }

  return null;
}

// Create a chainable mock database object
export function createMockDb() {
  const mock: any = {
    select: vi.fn(() => mock),
    from: vi.fn(() => mock),
    innerJoin: vi.fn(() => mock),
    leftJoin: vi.fn(() => mock),
    where: vi.fn().mockResolvedValue([]),
    orderBy: vi.fn().mockResolvedValue([]),
    query: {
      groupMembers: {
        findFirst: vi.fn(),
      },
      groups: {
        findFirst: vi.fn(),
      },
      users: {
        findFirst: vi.fn(),
      },
      expenses: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      ledgerEntries: {
        findFirst: vi.fn(),
      },
      idempotencyKeys: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn((table: any) => {
      const tableName = getTableName(table);
      return {
        values: vi.fn((data: any) => {
          if (transactionState.shouldThrowError && !tableName.includes('idempotency')) {
            throw new Error('Database constraint violation');
          }
          // Idempotency keys are saved immediately, not through transaction
          // Check for idempotency keys table by name or by data structure
          if (tableName.includes('idempotency') || tableName.includes('idempotency_keys') || (data.key && data.userId && data.path)) {
            mockTables.idempotencyKeys.push(data);
          } else if (tableName.includes('expense')) {
            transactionState.pendingChanges.expenses.push({ ...data, id: `expense-${mockTables.expenses.length + 1}` });
          } else if (tableName.includes('ledger')) {
            transactionState.pendingChanges.ledgerEntries.push({ ...data, id: `ledger-${mockTables.ledgerEntries.length + 1}` });
          }
          return mock;
        }),
        returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
      };
    }),
    transaction: vi.fn(async (cb: any) => {
      transactionState.transactionCalls++;
      if (transactionState.shouldThrowError) {
        // Rollback - clear pending changes
        transactionState.pendingChanges.expenses = [];
        transactionState.pendingChanges.ledgerEntries = [];
        throw new Error('Transaction rolled back');
      }
      try {
        const result = await cb(mock);
        // Commit - apply pending changes
        mockTables.expenses.push(...transactionState.pendingChanges.expenses);
        mockTables.ledgerEntries.push(...transactionState.pendingChanges.ledgerEntries);
        transactionState.pendingChanges.expenses = [];
        transactionState.pendingChanges.ledgerEntries = [];
        return result;
      } catch (error) {
        // Rollback on error
        transactionState.pendingChanges.expenses = [];
        transactionState.pendingChanges.ledgerEntries = [];
        throw error;
      }
    }),
  };

  // Setup query mocks with proper Drizzle where handling
  mock.query.groupMembers.findFirst.mockImplementation(({ where }: any) => {
    if (!where) return Promise.resolve(null);
    const condition = extractWhereCondition(where);
    if (condition) {
      const result = mockTables.groupMembers.find((item: any) => item[condition.field] === condition.value);
      return Promise.resolve(result || null);
    }
    // Fallback: try calling where as function
    try {
      const result = mockTables.groupMembers.find((item: any) => where(item));
      return Promise.resolve(result || null);
    } catch {
      return Promise.resolve(null);
    }
  });

  mock.query.users.findFirst.mockImplementation(({ where }: any) => {
    if (!where) return Promise.resolve(null);
    const condition = extractWhereCondition(where);
    if (condition) {
      const result = mockTables.users.find((item: any) => item[condition.field] === condition.value);
      return Promise.resolve(result || null);
    }
    try {
      const result = mockTables.users.find((item: any) => where(item));
      return Promise.resolve(result || null);
    } catch {
      return Promise.resolve(null);
    }
  });

  mock.query.idempotencyKeys.findFirst.mockImplementation(({ where }: any) => {
    if (!where) return Promise.resolve(null);
    const condition = extractWhereCondition(where);
    if (condition) {
      const result = mockTables.idempotencyKeys.find((item: any) => item[condition.field] === condition.value);
      return Promise.resolve(result || null);
    }
    try {
      // Fallback: try calling where as a function with a mock item
      // This handles Drizzle's SQL expression objects
      for (const item of mockTables.idempotencyKeys) {
        // Create a proxy that can evaluate the where clause
        const result = where(item);
        if (result) {
          return Promise.resolve(item);
        }
      }
      return Promise.resolve(null);
    } catch {
      return Promise.resolve(null);
    }
  });

  mock.query.expenses.findFirst.mockImplementation(({ where }: any) => {
    if (!where) return Promise.resolve(null);
    const condition = extractWhereCondition(where);
    if (condition) {
      const result = mockTables.expenses.find((item: any) => item[condition.field] === condition.value);
      return Promise.resolve(result || null);
    }
    try {
      const result = mockTables.expenses.find((item: any) => where(item));
      return Promise.resolve(result || null);
    } catch {
      return Promise.resolve(null);
    }
  });

  mock.query.expenses.findMany.mockImplementation(({ where }: any) => {
    let results = mockTables.expenses;
    if (where) {
      const condition = extractWhereCondition(where);
      if (condition) {
        results = results.filter((item: any) => item[condition.field] === condition.value);
      } else {
        try {
          results = results.filter((item: any) => where(item));
        } catch {
          // Ignore filter errors
        }
      }
    }
    return Promise.resolve(results);
  });

  return mock;
}
