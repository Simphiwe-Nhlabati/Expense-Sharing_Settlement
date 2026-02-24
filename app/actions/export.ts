"use server"

import { db } from "@/server/db"
import { expenses, ledgerEntries, groups, users, groupMembers } from "@/server/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { getAuthenticatedUser } from "./auth"
import { formatCurrency } from "@/lib/utils"

export interface ExportRow {
  date: string
  type: string
  description: string
  amount: string
  paidBy: string
  groupName: string
}

/**
 * Fetches all expenses + settlements for a group and returns
 * them as structured rows suitable for CSV or PDF rendering.
 * Only accessible to group members (enforced here).
 */
export async function getGroupExportData(groupId: string): Promise<{
  success: boolean
  error?: string
  groupName?: string
  generatedAt?: string
  rows?: ExportRow[]
}> {
  const user = await getAuthenticatedUser()
  if (!user) return { success: false, error: "Unauthorized" }

  // Check membership
  const membership = await db.query.groupMembers.findFirst({
    where: and(
      eq(groupMembers.groupId, groupId),
      eq(groupMembers.userId, user.id)
    )
  })
  if (!membership) return { success: false, error: "Forbidden" }

  const group = await db.query.groups.findFirst({ where: eq(groups.id, groupId) })
  if (!group) return { success: false, error: "Group not found" }

  // Fetch expenses
  const expenseRecords = await db.select({
    id: expenses.id,
    description: expenses.description,
    amount: expenses.amount,
    date: expenses.date,
    payerName: users.fullName,
    groupName: groups.name,
  })
  .from(expenses)
  .leftJoin(users, eq(expenses.paidBy, users.id))
  .leftJoin(groups, eq(expenses.groupId, groups.id))
  .where(eq(expenses.groupId, groupId))
  .orderBy(desc(expenses.date))

  // Fetch settlements
  const settlementRecords = await db.select({
    id: ledgerEntries.id,
    amount: ledgerEntries.amount,
    createdAt: ledgerEntries.createdAt,
    payerName: users.fullName,
    groupName: groups.name,
  })
  .from(ledgerEntries)
  .leftJoin(users, eq(ledgerEntries.fromUserId, users.id))
  .leftJoin(groups, eq(ledgerEntries.groupId, groups.id))
  .where(and(
    eq(ledgerEntries.groupId, groupId),
    eq(ledgerEntries.type, "SETTLEMENT")
  ))
  .orderBy(desc(ledgerEntries.createdAt))

  const rows: ExportRow[] = [
    ...expenseRecords.map(e => ({
      date: new Date(e.date).toLocaleDateString("en-ZA"),
      type: "Expense",
      description: e.description,
      amount: formatCurrency(e.amount),
      paidBy: e.payerName || "Unknown",
      groupName: e.groupName || group.name,
    })),
    ...settlementRecords.map(s => ({
      date: new Date(s.createdAt).toLocaleDateString("en-ZA"),
      type: "Settlement",
      description: "Debt Settlement",
      amount: formatCurrency(s.amount),
      paidBy: s.payerName || "Unknown",
      groupName: s.groupName || group.name,
    })),
  ].sort((a, b) => {
    // Sort descending by date string (en-ZA format = dd/mm/yyyy)
    const parse = (d: string) => {
      const [day, month, year] = d.split("/")
      return new Date(+year, +month - 1, +day).getTime()
    }
    return parse(b.date) - parse(a.date)
  })

  return {
    success: true,
    groupName: group.name,
    generatedAt: new Date().toLocaleDateString("en-ZA", {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit"
    }),
    rows,
  }
}
