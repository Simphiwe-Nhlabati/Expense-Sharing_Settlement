"use server"

import { db } from "@/server/db"
import { ledgerEntries, groups } from "@/server/db/schema"
import { eq, sum, and, sql } from "drizzle-orm"
import { getAuthenticatedUser } from "./auth"

export async function getDashboardStats() {
    const user = await getAuthenticatedUser()

    if (!user) {
        return {
            totalBalance: 0,
            youOwe: 0,
            owedToYou: 0
        }
    }

    // Calculation Logic:
    // Owed To You (Credits): 
    //   SUM(EXPENSE_SHARE where toUser=Me) - SUM(SETTLEMENT where toUser=Me)
    // You Owe (Debits):
    //   SUM(EXPENSE_SHARE where fromUser=Me) - SUM(SETTLEMENT where fromUser=Me)

    // Drizzle aggregation helper or raw fetching
    // Fetching raw sums is efficient enough.

    // 1. Credits (Money people owe ME)
    const credits = await db.select({
        amount: ledgerEntries.amount,
        type: ledgerEntries.type,
    })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.toUserId, user.id));

    let totalOwedToYou = 0;
    for (const c of credits) {
        if (c.type === "EXPENSE_SHARE") totalOwedToYou += c.amount;
        if (c.type === "SETTLEMENT") totalOwedToYou -= c.amount;
    }

    // 2. Debits (Money I owe OTHERS)
    const debits = await db.select({
        amount: ledgerEntries.amount,
        type: ledgerEntries.type,
    })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.fromUserId, user.id));

    let totalYouOwe = 0;
    for (const d of debits) {
        if (d.type === "EXPENSE_SHARE") totalYouOwe += d.amount;
        if (d.type === "SETTLEMENT") totalYouOwe -= d.amount;
    }

    // Net Balance
    const netBalance = totalOwedToYou - totalYouOwe;

    return {
        totalBalance: netBalance, 
        youOwe: -totalYouOwe, // Negative for display connection in UI logic usually
        owedToYou: totalOwedToYou 
    }
}
