import { db } from "../db";
import { auditLogs } from "../db/schema";

export async function logAudit(params: {
  userId?: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "SETTLE" | "UPGRADE_SUBSCRIPTION" | "CANCEL_SUBSCRIPTION";
  entityType: "groups" | "expenses" | "ledger" | "group_members" | "subscriptions";
  entityId?: string;
  metadata?: unknown;
  changes?: { before: unknown; after: unknown };
}) {
  try {
    await db.insert(auditLogs).values({
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata,
      changes: params.changes,
    });
  } catch (error) {
    console.error("Failed to log audit:", error);
    // Don't throw error to avoid breaking main flow, or throw if required by compliance
  }
}
