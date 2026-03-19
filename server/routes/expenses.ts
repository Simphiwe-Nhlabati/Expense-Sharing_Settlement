import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";
import { expenses, ledgerEntries, users, groupMembers } from "../db/schema";
import { runIdempotentAction } from "../middleware/idempotency";
import { eq, and, gte, desc, isNull } from "drizzle-orm";
import { verifyGroupMember } from "../middleware/group-auth";
import { logAudit } from "../services/audit";
import { sanitize } from "../middleware/sanitization";
import { getHistoryCutoffDate } from "../services/subscription";
import { subscriptionMeter } from "../middleware/subscription-meter";
import { HonoEnv } from "../types";
import { auth } from "../middleware/auth";

const app = new Hono<HonoEnv>();

// Helper to get internal user ID from authId
async function getUserIdByAuthId(authId: string) {
    const user = await db.query.users.findFirst({
        where: eq(users.authId, authId)
    });
    return user?.id;
}

// Schema
const createExpenseSchema = z.object({
  groupId: z.string().uuid(),
  description: z.string().min(1),
  amount: z.number().int().positive(), // Cents
  splitType: z.enum(["EQUAL", "EXACT", "PERCENTAGE"]),
  splits: z.array(z.object({
      userId: z.string().uuid(),
      amount: z.number().int().optional(),
  })),
});

/**
 * Validate that all split participants belong to the specified group.
 * Returns the list of member user IDs if valid, throws error otherwise.
 */
async function validateSplitParticipants(groupId: string, splitUserIds: string[]) {
  if (splitUserIds.length === 0) {
    throw new Error("At least one participant is required");
  }

  // Fetch all members of the group
  const members = await db.select({
    userId: groupMembers.userId,
  }).from(groupMembers)
    .where(eq(groupMembers.groupId, groupId));

  const memberUserIds = new Set(members.map(m => m.userId));

  // Check that all split participants are group members
  const invalidUserIds = splitUserIds.filter(id => !memberUserIds.has(id));
  if (invalidUserIds.length > 0) {
    throw new Error(`Invalid participants: ${invalidUserIds.join(", ")}. All participants must be group members.`);
  }

  return memberUserIds;
}

/**
 * Validate split amounts based on split type.
 * - EQUAL: amounts are calculated, not validated
 * - EXACT: sum of amounts must equal total
 * - PERCENTAGE: sum of percentages must equal 100
 */
function validateSplitAmounts(
  splitType: "EQUAL" | "EXACT" | "PERCENTAGE",
  totalAmount: number,
  splits: Array<{ userId: string; amount?: number }>
) {
  if (splitType === "EQUAL") {
    // Amounts are calculated, not provided
    return;
  }

  if (splitType === "EXACT") {
    const sum = splits.reduce((acc, s) => acc + (s.amount || 0), 0);
    if (sum !== totalAmount) {
      throw new Error(`Exact split amounts must sum to total. Got ${sum}, expected ${totalAmount}`);
    }
    // Validate no negative amounts
    const hasNegative = splits.some(s => (s.amount || 0) < 0);
    if (hasNegative) {
      throw new Error("Split amounts cannot be negative");
    }
  }

  if (splitType === "PERCENTAGE") {
    const sum = splits.reduce((acc, s) => acc + (s.amount || 0), 0);
    if (sum !== 100) {
      throw new Error(`Percentage splits must sum to 100%. Got ${sum}%`);
    }
  }
}

// POST / - Create Expense
// Security: Apply auth middleware and validate group membership for all participants
app.post("/", 
  auth(),
  zValidator("json", createExpenseSchema),
  async (c) => {
    const authId = c.get("authId");
    if (!authId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userId = await getUserIdByAuthId(authId);
    if (!userId) {
      return c.json({ error: "Unauthorized: User not found" }, 401);
    }

    // Use validated body from zod validator
    const body = c.req.valid("json");
    const idempotencyKey = c.req.header("Idempotency-Key");

    if (!idempotencyKey) {
      return c.json({ error: "Idempotency-Key header required" }, 400);
    }

    // Security: Validate that the creator is a member of the group
    const memberCheck = await db.select()
      .from(groupMembers)
      .where(and(
        eq(groupMembers.groupId, body.groupId),
        eq(groupMembers.userId, userId)
      ))
      .limit(1);

    if (!memberCheck.length) {
      return c.json({ error: "Forbidden: You must be a member of the group to create expenses" }, 403);
    }

    // Security: Validate all split participants belong to the same group
    const splitUserIds = body.splits.map(s => s.userId);
    try {
      await validateSplitParticipants(body.groupId, splitUserIds);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Validation failed" }, 400);
    }

    // Validate split amounts based on split type
    try {
      validateSplitAmounts(body.splitType, body.amount, body.splits);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Validation failed" }, 400);
    }

    // Use helper for idempotent action
    const result = await runIdempotentAction(idempotencyKey, userId, "/expenses", body, async () => {
      return await db.transaction(async (tx) => {
        try {
          // 1. Create Expense Record
          const [newExpense] = await tx.insert(expenses).values({
            groupId: body.groupId,
            description: sanitize(body.description),
            amount: body.amount,
            paidBy: userId,
            date: new Date(),
          }).returning();

          // 2. Calculate Splits based on split type
          let calculatedSplits: Array<{ userId: string; amount: number }> = [];

          if (body.splitType === "EQUAL") {
            const splitCount = body.splits.length;
            const amountPerPerson = Math.floor(body.amount / splitCount);
            let remainder = body.amount % splitCount;

            calculatedSplits = body.splits.map(split => {
              let share = amountPerPerson;
              if (remainder > 0) {
                share += 1;
                remainder -= 1;
              }
              return { userId: split.userId, amount: share };
            });
          } else if (body.splitType === "EXACT") {
            calculatedSplits = body.splits.map(s => ({ userId: s.userId, amount: s.amount! }));
          } else if (body.splitType === "PERCENTAGE") {
            calculatedSplits = body.splits.map(s => {
              const percentage = (s.amount || 0) / 100;
              const share = Math.round(body.amount * percentage);
              return { userId: s.userId, amount: share };
            });

            // Handle rounding: adjust last split to ensure total matches
            const sum = calculatedSplits.reduce((acc, s) => acc + s.amount, 0);
            if (sum !== body.amount && calculatedSplits.length > 0) {
              const diff = body.amount - sum;
              calculatedSplits[calculatedSplits.length - 1].amount += diff;
            }
          }

          // 3. Create Ledger Entries
          for (const split of calculatedSplits) {
            if (split.userId !== userId) {
              await tx.insert(ledgerEntries).values({
                groupId: body.groupId,
                expenseId: newExpense.id,
                fromUserId: split.userId,
                toUserId: userId,
                amount: split.amount,
                type: "EXPENSE_SHARE",
              });
            }
          }

          // 4. Audit Log
          await logAudit({
            userId: userId,
            action: "CREATE",
            entityType: "expenses",
            entityId: newExpense.id,
            metadata: {
              ip: c.req.header("x-forwarded-for"),
              userAgent: c.req.header("user-agent"),
              splitType: body.splitType,
              participantCount: body.splits.length,
            },
            changes: { before: null, after: newExpense }
          });

          return newExpense;
        } catch (error) {
          // Log transaction error for debugging
          console.error("[EXPENSES] Transaction error:", {
            error: error instanceof Error ? error.message : "Unknown error",
            userId,
            groupId: body.groupId,
          });
          throw error; // Re-throw to trigger rollback
        }
      });
    });

    return c.json(result, 201);
  }
);

// GET /:groupId
app.get("/:groupId", verifyGroupMember(), async (c) => {
    const groupId = c.req.param("groupId");
    const userId = c.get("userId");

    if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    // Apply history cutoff based on subscription tier
    const historyCutoff = await getHistoryCutoffDate(userId);

    const whereConditions = [
        eq(expenses.groupId, groupId),
        isNull(expenses.deletedAt)
    ];

    if (historyCutoff) {
        whereConditions.push(gte(expenses.date, historyCutoff));
    }

    const groupExpenses = await db.query.expenses.findMany({
        where: and(...whereConditions),
        orderBy: [desc(expenses.date)],
        with: {
            payer: true,
        }
    });

    return c.json({
        expenses: groupExpenses,
        historyLimited: historyCutoff !== null,
        cutoffDate: historyCutoff,
    });
});

// GET /:groupId/export/pdf - Export expenses to PDF (HOUSEHOLD+ feature)
app.get("/:groupId/export/pdf", subscriptionMeter("FEATURE", "pdf_export"), verifyGroupMember(), async (c) => {
    const groupId = c.req.param("groupId");
    const userId = c.get("userId");

    if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    // In production, generate PDF using pdf-lib or react-pdf
    // For now, return a placeholder response
    const groupExpenses = await db.query.expenses.findMany({
        where: and(
            eq(expenses.groupId, groupId),
            isNull(expenses.deletedAt)
        ),
        orderBy: [desc(expenses.date)],
        with: {
            payer: true,
            group: true,
        }
    });

    // TODO: Generate actual PDF
    // const pdfBuffer = await generatePdf(groupExpenses);
    // return c.body(pdfBuffer, 200, {
    //     'Content-Type': 'application/pdf',
    //     'Content-Disposition': `attachment; filename="expenses-${groupId}.pdf"`
    // });

    return c.json({
        message: "PDF export feature - integrate with pdf-lib",
        expenses: groupExpenses,
        generatedAt: new Date().toISOString(),
    });
});

// GET /:groupId/export/csv - Export expenses to CSV (HOUSEHOLD+ feature)
app.get("/:groupId/export/csv", subscriptionMeter("FEATURE", "csv_xero_export"), verifyGroupMember(), async (c) => {
    const groupId = c.req.param("groupId");
    const userId = c.get("userId");

    if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const groupExpenses = await db.query.expenses.findMany({
        where: and(
            eq(expenses.groupId, groupId),
            isNull(expenses.deletedAt)
        ),
        orderBy: [desc(expenses.date)],
        with: {
            payer: true,
            group: true,
        }
    });

    // Generate CSV
    const csvRows = [
        ["Date", "Description", "Amount (ZAR)", "Paid By", "Group"],
        ...groupExpenses.map((e) => [
            e.date.toISOString(),
            e.description,
            (e.amount / 100).toFixed(2),
            e.payer.fullName || e.payer.email,
            e.group?.name || groupId,
        ]),
    ];

    const csvContent = csvRows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

    return c.body(csvContent, 200, {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="expenses-${groupId}.csv"`,
    });
});

export default app;
