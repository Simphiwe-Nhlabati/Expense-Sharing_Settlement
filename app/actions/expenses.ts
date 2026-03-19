"use server"

import { revalidatePath } from "next/cache"
import { createExpenseSchema, type CreateExpenseInput } from "@/lib/schemas"
import { db } from "@/server/db"
import { expenses, ledgerEntries, groupMembers, users } from "@/server/db/schema"
import { getAuthenticatedUser } from "./auth"
import { eq, and } from "drizzle-orm"

interface CreateExpenseResult {
  success: boolean;
  error?: string;
}

// Helper to create expense
export async function createExpense(input: CreateExpenseInput): Promise<CreateExpenseResult> {
  const user = await getAuthenticatedUser()
  
  if (!user) {
      return { success: false, error: "Unauthorized" }
  }

  const result = createExpenseSchema.safeParse(input);

  if (!result.success) {
      return { success: false, error: "Invalid input" };
  }

  const { groupId, description, amount, date } = result.data;
  const amountInCents = Math.round(Number(amount) * 100);

  try {
      await db.transaction(async (tx) => {
          const payerId = user.id; 

          const [newExpense] = await tx.insert(expenses).values({
              groupId,
              description,
              amount: amountInCents,
              paidBy: payerId,
              date: new Date(date),
              currency: "ZAR",
          }).returning();

          const members = await tx.select().from(groupMembers).where(eq(groupMembers.groupId, groupId));
          
          if (members.length > 0) {
              const share = Math.floor(amountInCents / members.length);
              
              for (const member of members) {
                  if (member.userId !== payerId) {
                      await tx.insert(ledgerEntries).values({
                          groupId,
                          expenseId: newExpense.id,
                          fromUserId: member.userId, 
                          toUserId: payerId,         
                          amount: share,
                          type: "EXPENSE_SHARE",
                      });
                  }
              }
          }
      });

      revalidatePath(`/groups/${groupId}`);
      revalidatePath("/"); 
      return { success: true };
  } catch (error) {
      console.error("Create Expense Error:", error);
      return { success: false, error: "Failed to create expense" };
  }
}

export async function getExpenses(groupId: string) {
  const user = await getAuthenticatedUser();
  if (!user) return [];

  // 1. Fetch Expenses (Parent records)
  const expenseRecords = await db.select({
      id: expenses.id,
      description: expenses.description,
      amount: expenses.amount,
      date: expenses.date,
      paidById: expenses.paidBy,
  })
  .from(expenses)
  .leftJoin(users, eq(expenses.paidBy, users.id))
  .where(eq(expenses.groupId, groupId));

  // 2. Fetch Settlements (Ledger Entries where type=SETTLEMENT and expenseId is null)
  const settlementRecords = await db.select({
      id: ledgerEntries.id,
      amount: ledgerEntries.amount,
      date: ledgerEntries.createdAt,
      fromUserId: ledgerEntries.fromUserId,
      toUserId: ledgerEntries.toUserId,
      payerName: users.fullName, // The person paying (FromUser)
  })
  .from(ledgerEntries)
  .leftJoin(users, eq(ledgerEntries.fromUserId, users.id))
  .where(and(
      eq(ledgerEntries.groupId, groupId),
      eq(ledgerEntries.type, "SETTLEMENT")
  ));

  // 3. Merge and Sort
  // Map expenses to common format
  const formattedExpenses = expenseRecords.map(e => ({
      id: e.id,
      description: e.description,
      amount: e.amount,
      date: new Date(e.date),
      paidBy: e.paidById || "Unknown",
      type: "EXPENSE"
  }));

  // Map settlements to common format
  // We need the recipient name too ideally, but for now showing "Payer paid X" is enough context.
  // Or fetch Recipient name in a separate query/join if needed. Drizzle allows multiple joins.
  // Simplifying for now: "Paid by X"
  const formattedSettlements = settlementRecords.map(s => ({
      id: s.id,
      description: `Settlement`, // Generic description
      amount: s.amount,
      date: new Date(s.date),
      paidBy: s.payerName || "Unknown", // The person who paid up
      type: "SETTLEMENT"
  }));

  const combined = [...formattedExpenses, ...formattedSettlements];
  
  // Sort descending by date
  return combined.sort((a, b) => b.date.getTime() - a.date.getTime());
}
