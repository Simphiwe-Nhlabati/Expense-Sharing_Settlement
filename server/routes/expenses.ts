import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";
import { expenses, ledgerEntries, users } from "../db/schema";
import { runIdempotentAction } from "../middleware/idempotency";
import { eq, and, gte, desc } from "drizzle-orm";
import { verifyGroupMember } from "../middleware/group-auth";
import { logAudit } from "../services/audit";
import { sanitize } from "../middleware/sanitization";
import { getHistoryCutoffDate } from "../services/subscription";
import { canUserExportPdf, canUserExportCsv } from "../services/feature-flags";
import { subscriptionMeter } from "../middleware/subscription-meter";
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
    const userId = c.get("userId");

    if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    // Apply history cutoff based on subscription tier
    const historyCutoff = await getHistoryCutoffDate(userId);

    const whereConditions: any[] = [
        eq(expenses.groupId, groupId),
        eq(expenses.deletedAt, null as any)
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
            eq(expenses.deletedAt, null as any)
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
            eq(expenses.deletedAt, null as any)
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
