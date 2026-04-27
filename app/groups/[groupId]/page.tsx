import { getGroup } from "@/app/actions/groups";
import { getExpenses } from "@/app/actions/expenses";
import { AuthHeader } from "@/components/auth-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, ArrowRightLeft, Calendar, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CreateExpenseDialog } from "@/components/features/expenses/create-expense-dialog";
import { SettleUpDialog } from "@/components/features/settlements/settle-up-dialog";
import { ExportButton } from "@/components/features/export/export-button";
import { RealtimeIndicator } from "@/components/features/realtime/realtime-indicator";
import { formatCurrency } from "@/lib/utils";

export default async function GroupPage(props: { params: Promise<{ groupId: string }> }) {
  const params = await props.params;
  const { groupId } = params;

  const [group, expenses] = await Promise.all([getGroup(groupId), getExpenses(groupId)]);
  if (!group) notFound();

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <AuthHeader />
      <main className="flex-1 relative z-10">
        <div className="container mx-auto px-4 py-10 max-w-6xl">

          {/* Back nav */}
          <Link
            href="/"
            className="inline-flex items-center text-xs text-muted-foreground hover:text-accent transition-colors group mb-8"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Dashboard
          </Link>

          {/* Group header */}
          <div className="border border-border/60 bg-card mb-8">
            {/* Gold top rule */}
            <div className="h-px bg-gradient-gold opacity-60" />

            <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                {/* Group avatar — geometric */}
                <div className="relative h-12 w-12 flex-shrink-0 flex items-center justify-center border border-accent/40">
                  <div className="absolute inset-1 border border-accent/20" />
                  <span
                    className="relative text-lg font-bold text-accent"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {group.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1
                      className="text-2xl font-bold"
                      style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
                    >
                      {group.name}
                    </h1>
                    <RealtimeIndicator groupId={groupId} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {group.description || "No description"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <ExportButton groupId={groupId} />
                <Button variant="outline" size="icon" asChild className="rounded-none h-9 w-9 border-border/60">
                  <Link href={`/groups/${groupId}/settings`}>
                    <Settings className="h-4 w-4" />
                    <span className="sr-only">Settings</span>
                  </Link>
                </Button>
                <SettleUpDialog groupId={groupId} />
                <CreateExpenseDialog groupId={groupId} members={group.members} />
              </div>
            </div>
          </div>

          {/* Expenses */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="label-mono text-muted-foreground mb-0.5">Transactions</p>
                <h2
                  className="text-xl font-bold"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Expenses
                </h2>
              </div>
              <span className="label-mono text-muted-foreground">
                {expenses.length} {expenses.length === 1 ? "entry" : "entries"}
              </span>
            </div>

            <div className="gold-rule" />

            {expenses.length === 0 ? (
              <div className="border border-dashed border-border/60 p-16 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center border border-border/60 text-muted-foreground mb-4">
                  <Calendar className="h-5 w-5" />
                </div>
                <p className="label-mono text-muted-foreground mb-2">No expenses yet</p>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
                  Start by adding your first expense. Track everything from dinners to trips.
                </p>
                <CreateExpenseDialog groupId={groupId} members={group.members} />
              </div>
            ) : (
              <div className="border border-border/60 divide-y divide-border/60">
                {expenses.map((expense, index) => (
                  <div
                    key={expense.id}
                    className="flex items-center gap-4 p-4 md:p-5 hover:bg-secondary/40 transition-colors animate-slide-up"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    {/* Type icon */}
                    <div
                      className={`flex-shrink-0 h-10 w-10 flex items-center justify-center border ${
                        expense.type === "SETTLEMENT"
                          ? "border-emerald-500/30 text-emerald-500"
                          : "border-accent/30 text-accent"
                      }`}
                    >
                      {expense.type === "SETTLEMENT" ? (
                        <ArrowRightLeft className="h-4 w-4" />
                      ) : (
                        <Calendar className="h-4 w-4" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{expense.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        {expense.type === "SETTLEMENT" ? (
                          <span className="flex items-center gap-1">
                            <ArrowRightLeft className="h-3 w-3" /> Settlement
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" /> Paid by {expense.paidBy}
                          </span>
                        )}
                        <span>·</span>
                        <span>
                          {new Date(expense.date).toLocaleDateString("en-ZA", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                      <p
                        className={`currency font-bold text-base ${
                          expense.type === "SETTLEMENT"
                            ? "text-emerald-500"
                            : "text-foreground"
                        }`}
                      >
                        {formatCurrency(expense.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {expense.type === "SETTLEMENT" ? "Payment" : "Expense"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
