import { pgTable, text, integer, bigint, boolean, timestamp, json, uuid, index, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// --- Subscription Tiers (Enum) ---
export type SubscriptionTier = "BRAAI" | "HOUSEHOLD" | "AGENT";
export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, {
  maxGroups: number;
  maxMembersPerGroup: number;
  historyDays: number;
  features: string[];
  priceZar: number;
}> = {
  BRAAI: {
    maxGroups: 2,
    maxMembersPerGroup: 10,
    historyDays: 30,
    features: ["basic_splitting", "invite_codes", "zar_precision"],
    priceZar: 0,
  },
  HOUSEHOLD: {
    maxGroups: -1, // Unlimited
    maxMembersPerGroup: 25,
    historyDays: -1, // Lifetime
    features: ["basic_splitting", "invite_codes", "zar_precision", "recurring_expenses", "pdf_export", "priority_support"],
    priceZar: 49,
  },
  AGENT: {
    maxGroups: -1, // Unlimited
    maxMembersPerGroup: 50,
    historyDays: -1, // Lifetime
    features: ["basic_splitting", "invite_codes", "zar_precision", "recurring_expenses", "pdf_export", "priority_support", "white_labeling", "csv_xero_export", "settlement_reminders", "popia_vault"],
    priceZar: 299,
  },
};

// --- Users ---
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  authId: text("auth_id").unique().notNull(), // External auth ID (JWT subject)
  email: text("email").notNull(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  passwordHash: text("password_hash"), // For JWT auth (nullable for OAuth users)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- Groups ---
export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  currency: text("currency").default("ZAR").notNull(),
  inviteCode: text("invite_code").unique().notNull(), // e.g. CT-TRIP-88
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  deletedAt: timestamp("deleted_at"), // Soft Delete
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  inviteCodeIdx: uniqueIndex("idx_groups_invite_code").on(table.inviteCode),
}));

// --- Group Members ---
export const groupMembers = pgTable("group_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").references(() => groups.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  role: text("role").default("MEMBER").notNull(), // OWNER, ADMIN, MEMBER
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (table) => ({
    membersIdx: index("idx_group_members_group_user").on(table.groupId, table.userId),
}));

// --- Expenses ---
// Immutable record of an expense event
export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").references(() => groups.id).notNull(),
  description: text("description").notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(), // Stores Cents (BigInt/Integer)
  currency: text("currency").default("ZAR").notNull(),
  paidBy: uuid("paid_by").references(() => users.id).notNull(),
  date: timestamp("date").notNull(),
  deletedAt: timestamp("deleted_at"), // Soft Delete
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- Ledger (Core Financial Record) ---
// Immutable double-entry bookkeeping pattern for balances
// Every expense creates multiple ledger entries: Payer -> Ower (Amount)
export const ledgerEntries = pgTable("ledger_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").references(() => groups.id).notNull(),
  expenseId: uuid("expense_id").references(() => expenses.id), // Nullable for Settlements
  fromUserId: uuid("from_user_id").references(() => users.id).notNull(), // The person who OWES money
  toUserId: uuid("to_user_id").references(() => users.id).notNull(),     // The person who is OWED money
  amount: bigint("amount", { mode: "number" }).notNull(), // Amount in Cents
  type: text("type").notNull(), // 'EXPENSE_SHARE' or 'SETTLEMENT'
  isSettled: boolean("is_settled").default(false).notNull(), // Optimization flag
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    ledgerGroupIdx: index("idx_ledger_group").on(table.groupId),
    ledgerUserIdx: index("idx_ledger_users").on(table.fromUserId, table.toUserId),
}));

// --- Rate Limit Logs ---
// For database-backed rate limiting
export const rateLimitLogs = pgTable("rate_limit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  ip: text("ip").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  path: text("path").notNull(),
  method: text("method").notNull(),
}, (table) => ({
  ipTimestampIdx: index("idx_rate_limit_ip_timestamp").on(table.ip, table.timestamp),
}));

// --- Idempotency Keys ---
// For preventing double-charges on critical endpoints
export const idempotencyKeys = pgTable("idempotency_keys", {
  key: text("key").primaryKey(), // The unique key from client
  userId: uuid("user_id").references(() => users.id).notNull(),
  path: text("path").notNull(), // API path
  params: json("params"), // Request body/hash
  responseCode: integer("response_code"),
  responseBody: json("response_body"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(), // Auto-expire keys
});

// --- Audit Logs ---
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  action: text("action").notNull(), // CREATE, UPDATE, DELETE, SETTLE
  entityType: text("entity_type").notNull(), // groups, expenses, ledger
  entityId: uuid("entity_id"),
  metadata: json("metadata"), // ip, userAgent, etc.
  changes: json("changes"), // Before/After state
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Subscriptions ---
// Stores user subscription tier and billing status
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull().unique(),
  tier: text("tier").notNull().default("BRAAI"), // BRAAI, HOUSEHOLD, AGENT
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, CANCELLED, PAST_DUE, TRIALING
  stripeSubscriptionId: text("stripe_subscription_id").unique(), // Payment provider subscription ID
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_subscriptions_user_id").on(table.userId),
  statusIdx: index("idx_subscriptions_status").on(table.status),
}));

// --- Relations ---
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  members: many(groupMembers),
  expenses: many(expenses),
  creator: one(users, { fields: [groups.createdBy], references: [users.id] }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  groups: many(groupMembers),
  expensesPaid: many(expenses),
  auditLogs: many(auditLogs),
}));

export const expensesRelations = relations(expenses, ({ one, many }) => ({
  group: one(groups, { fields: [expenses.groupId], references: [groups.id] }),
  payer: one(users, { fields: [expenses.paidBy], references: [users.id] }),
  ledgerEntries: many(ledgerEntries),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
}));

export const usersRelationsWithSubscription = relations(users, ({ many, one }) => ({
  groups: many(groupMembers),
  expensesPaid: many(expenses),
  auditLogs: many(auditLogs),
  subscription: one(subscriptions),
}));
