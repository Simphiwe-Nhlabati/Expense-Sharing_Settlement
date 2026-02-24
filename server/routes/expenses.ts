import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";
import { expenses, ledgerEntries, users } from "../db/schema";
import { runIdempotentAction } from "../middleware/idempotency";
import { eq, and } from "drizzle-orm";
import { verifyGroupMember } from "../middleware/group-auth";
import { logAudit } from "../services/audit";
import { sanitize } from "../middleware/sanitization";
import { HonoEnv } from "../types";

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

// POST / - Create Expense
app.post("/", zValidator("json", createExpenseSchema), async (c) => {
  const authId = c.get("authId");
  const userId = await getUserIdByAuthId(authId);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  // Use validated body from zod validator
  const body = c.req.valid("json");
  const idempotencyKey = c.req.header("Idempotency-Key");

  if (!idempotencyKey) {
      return c.json({ error: "Idempotency-Key header required" }, 400);
  }

  // Use helper
  const result = await runIdempotentAction(idempotencyKey, userId, "/expenses", body, async () => {
    return await db.transaction(async (tx) => {
        // 1. Create Expense Record
        const [newExpense] = await tx.insert(expenses).values({
            groupId: body.groupId,
            description: sanitize(body.description),
            amount: body.amount,
            paidBy: userId,
            date: new Date(),
        }).returning();

        // 2. Calculate Splits (Logic simplification: EQUAL split)
        const splitCount = body.splits.length;
        const amountPerPerson = Math.floor(body.amount / splitCount);
        let remainder = body.amount % splitCount;

        // 3. Create Ledger Entries
        for (const split of body.splits) {
            let share = amountPerPerson;
            if (remainder > 0) {
                share += 1;
                remainder -= 1;
            }

            if (split.userId !== userId) {
                await tx.insert(ledgerEntries).values({
                    groupId: body.groupId,
                    expenseId: newExpense.id,
                    fromUserId: split.userId,
                    toUserId: userId,
                    amount: share,
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
            metadata: { ip: c.req.header("x-forwarded-for"), userAgent: c.req.header("user-agent") },
            changes: { before: null, after: newExpense }
        });

        return newExpense;
    });
  });

  return c.json(result, 201);
});

// GET /:groupId
app.get("/:groupId", verifyGroupMember(), async (c) => {
    const groupId = c.req.param("groupId");
    
    const groupExpenses = await db.query.expenses.findMany({
        where: and(
            eq(expenses.groupId, groupId),
            eq(expenses.deletedAt, null as any)
        ),
        orderBy: (expenses, { desc }) => [desc(expenses.date)],
        with: {
            payer: true,
        }
    });

    return c.json(groupExpenses);
});

export default app;
