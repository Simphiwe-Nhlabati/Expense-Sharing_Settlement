import { AuthHeader } from "@/components/auth-header";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Receipt, ArrowRightLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { db } from "@/server/db";
import { ledgerEntries, expenses, groups, users } from "@/server/db/schema";
import { desc, eq, and, or } from "drizzle-orm";
import { getAuthenticatedUser } from "@/app/actions/auth";
import { redirect } from "next/navigation";

export default async function ActivityPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch recent activity (Mocked join via Drizzle query builder or raw sql)
  // We want: Expenses where I am involved, Settlements where I am involved.
  // Simplifying: Just fetch all expenses in my groups for now as "Activity Feed"
  // Or fetch last 20 Ledger Entries involving me.

  const activities = await db.select({
      id: ledgerEntries.id,
      amount: ledgerEntries.amount,
      type: ledgerEntries.type,
      createdAt: ledgerEntries.createdAt,
      groupName: groups.name,
      fromUser: users.fullName,
      // Context
  })
  .from(ledgerEntries)
  .leftJoin(groups, eq(ledgerEntries.groupId, groups.id))
  .leftJoin(users, eq(ledgerEntries.fromUserId, users.id))
  .where(or(
      eq(ledgerEntries.fromUserId, user.id),
      eq(ledgerEntries.toUserId, user.id)
  ))
  .orderBy(desc(ledgerEntries.createdAt))
  .limit(20);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AuthHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Activity Feed</h1>
            <p className="text-muted-foreground">Recent transactions and audit logs across all groups.</p>
          </div>
        </div>

        <div className="space-y-4">
          {activities.length === 0 ? (
              <p className="text-muted-foreground">No recent activity.</p>
          ) : (
            activities.map((activity) => (
                <Card key={activity.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="flex items-center p-4 gap-4">
                    <div className={`p-2 rounded-full ${activity.type === 'SETTLEMENT' ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'}`}>
                    {activity.type === 'SETTLEMENT' ? <ArrowRightLeft className="h-5 w-5" /> : <Receipt className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                    <p className="font-medium">{activity.type === 'EXPENSE_SHARE' ? `Expense Share in ${activity.groupName}` : 'Settlement'}</p>
                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                        <span>{activity.fromUser}</span>
                        <span>•</span>
                        <span>{new Date(activity.createdAt).toLocaleDateString()}</span>
                    </div>
                    </div>
                    <div className="font-bold">
                    {formatCurrency(activity.amount)}
                    </div>
                </CardContent>
                </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
