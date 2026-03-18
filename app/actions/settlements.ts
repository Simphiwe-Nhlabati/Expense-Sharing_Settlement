"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/server/db"
import { ledgerEntries, users } from "@/server/db/schema"
import { eq, and } from "drizzle-orm"
import { getAuthenticatedUser } from "./auth"

import { logAudit } from "@/server/services/audit"
import { groupMembers } from "@/server/db/schema"

export async function getDebts(groupId: string) {
    const user = await getAuthenticatedUser()
    if (!user) return []

    // Verify membership
    const membership = await db.query.groupMembers.findFirst({
        where: and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.userId, user.id)
        )
    });
    if (!membership) return [];

    const entries = await db.select({
        fromUserId: ledgerEntries.fromUserId,
        toUserId: ledgerEntries.toUserId,
        amount: ledgerEntries.amount,
        type: ledgerEntries.type,
        otherUser: users.fullName,
        otherUserId: users.id,
    })
    .from(ledgerEntries)
    .innerJoin(users, eq(ledgerEntries.toUserId, users.id)) // Join ON Creditor (Who I owe)
    .where(and(
        eq(ledgerEntries.groupId, groupId),
        eq(ledgerEntries.fromUserId, user.id) // I am the debtor
    ));

    // Aggregate
    const debtsMap = new Map<string, { userId: string, name: string, amount: number }>();

    for (const entry of entries) {
        const key = entry.toUserId;
        const current = debtsMap.get(key) || { userId: key, name: entry.otherUser || "Unknown", amount: 0 };
        
        if (entry.type === "EXPENSE_SHARE") {
            current.amount += entry.amount;
        } else if (entry.type === "SETTLEMENT") {
            current.amount -= entry.amount;
        }
        
        debtsMap.set(key, current);
    }

    // Filter out zero or negative debts (overpaid?)
    return Array.from(debtsMap.values()).filter(d => d.amount > 0);
}

export async function settleDebt(groupId: string, toUserId: string, amount: number) {
    const user = await getAuthenticatedUser()
    if (!user) return { success: false, error: "Unauthorized" }

    // Guardrail: Reject negative settlement amounts
    if (amount <= 0) {
        return { success: false, error: "Settlement amount must be positive" }
    }

    // Verify membership
    const membership = await db.query.groupMembers.findFirst({
        where: and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.userId, user.id)
        )
    });
    if (!membership) return { success: false, error: "Forbidden: Not a group member" };

    const amountInCents = Math.round(amount * 100);

    try {
        const [result] = await db.insert(ledgerEntries).values({
            groupId,
            fromUserId: user.id, // I am paying
            toUserId: toUserId,   // They receive
            amount: amountInCents,
            type: "SETTLEMENT",
        }).returning();

        // Audit Log
        await logAudit({
            userId: user.id,
            action: "SETTLE",
            entityType: "ledger",
            entityId: result.id,
            metadata: { toUserId, originalAmount: amount },
            changes: { before: null, after: result }
        });

        revalidatePath(`/groups/${groupId}`)
        revalidatePath("/")
        return { success: true }
    } catch (error) {
        console.error("Settlement error:", error)
        return { success: false, error: "Failed to settle" }
    }
}
