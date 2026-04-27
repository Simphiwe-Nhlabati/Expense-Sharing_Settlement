import { AuthHeader } from "@/components/auth-header";
import { Receipt, ArrowRightLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { db } from "@/server/db";
import { ledgerEntries, groups, users } from "@/server/db/schema";
import { desc, eq, or } from "drizzle-orm";
import { getAuthenticatedUser } from "@/app/actions/auth";
import { redirect } from "next/navigation";

export default async function ActivityPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/sign-in");

  const activities = await db
    .select({
      id: ledgerEntries.id,
      amount: ledgerEntries.amount,
      type: ledgerEntries.type,
      createdAt: ledgerEntries.createdAt,
      groupName: groups.name,
      fromUser: users.fullName,
    })
    .from(ledgerEntries)
    .leftJoin(groups, eq(ledgerEntries.groupId, groups.id))
    .leftJoin(users, eq(ledgerEntries.fromUserId, users.id))
    .where(or(eq(ledgerEntries.fromUserId, user.id), eq(ledgerEntries.toUserId, user.id)))
    .orderBy(desc(ledgerEntries.createdAt))
    .limit(20);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AuthHeader />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-4xl relative z-10">
        <div className="mb-8">
          <p className="label-mono text-muted-foreground mb-1">Audit Trail</p>
          <h1
            className="text-3xl font-bold"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
          >
            Activity Feed
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Recent transactions across all groups.
          </p>
        </div>

        <div className="gold-rule mb-8" />

        {activities.length === 0 ? (
          <div className="border border-dashed border-border/60 p-16 text-center">
            <p className="label-mono text-muted-foreground mb-2">No activity yet</p>
            <p className="text-sm text-muted-foreground">
              Transactions will appear here once you start adding expenses.
            </p>
          </div>
        ) : (
          <div className="border border-border/60 divide-y divide-border/60">
            {activities.map((activity, i) => (
              <div
                key={activity.id}
                className="flex items-center gap-4 p-4 hover:bg-secondary/40 transition-colors animate-slide-up"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                {/* Type icon */}
                <div
                  className={`flex-shrink-0 h-9 w-9 flex items-center justify-center border ${
                    activity.type === "SETTLEMENT"
                      ? "border-emerald-500/30 text-emerald-500"
                      : "border-accent/30 text-accent"
                  }`}
                >
                  {activity.type === "SETTLEMENT" ? (
                    <ArrowRightLeft className="h-4 w-4" />
                  ) : (
                    <Receipt className="h-4 w-4" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {activity.type === "EXPENSE_SHARE"
                      ? `Expense in ${activity.groupName ?? "Unknown Group"}`
                      : "Settlement"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{activity.fromUser ?? "Unknown"}</span>
                    <span>·</span>
                    <span>
                      {new Date(activity.createdAt).toLocaleDateString("en-ZA", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Amount */}
                <p className="currency text-sm font-bold flex-shrink-0">
                  {formatCurrency(activity.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
