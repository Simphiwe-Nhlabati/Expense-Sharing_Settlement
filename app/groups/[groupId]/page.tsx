import { getGroup } from "@/app/actions/groups";
import { getExpenses } from "@/app/actions/expenses";
import { AuthHeader } from "@/components/auth-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

  // Parallel fetch
  const [group, expenses] = await Promise.all([
    getGroup(groupId),
    getExpenses(groupId)
  ]);

  if (!group) {
    notFound();
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <AuthHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
            {/* Header Section */}
            <div className="mb-8 space-y-6">
                <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors group">
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
                    Back to Dashboard
                </Link>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-primary/25">
                          <span className="text-xl font-bold text-primary-foreground">{group.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
                            <p className="text-muted-foreground">{group.description || "No description"}</p>
                        </div>
                        <RealtimeIndicator groupId={groupId} />
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                        <ExportButton groupId={groupId} groupName={group.name} />
                        <Button variant="outline" size="icon" asChild className="rounded-full">
                            <Link href={`/groups/${groupId}/settings`}>
                                <Settings className="h-5 w-5" />
                                <span className="sr-only">Settings</span>
                            </Link>
                        </Button>
                        <SettleUpDialog groupId={groupId} />
                        <CreateExpenseDialog groupId={groupId} members={group.members} />
                    </div>
                </div>
            </div>

            {/* Expenses List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Expenses</h2>
                  <span className="text-sm text-muted-foreground">{expenses.length} {expenses.length === 1 ? 'transaction' : 'transactions'}</span>
                </div>
                
                {expenses.length === 0 ? (
                    <Card className="border-2 border-dashed bg-muted/30">
                      <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                          <Calendar className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No expenses yet</h3>
                        <p className="text-muted-foreground max-w-sm mb-4">
                          Start by adding your first expense to this group. Track everything from dinners to trips.
                        </p>
                        <CreateExpenseDialog groupId={groupId} members={group.members} />
                      </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-3">
                        {expenses.map((expense: any, index) => (
                            <Card 
                              key={expense.id} 
                              className="group overflow-hidden border-0 shadow-md card-lift bg-card animate-scale-in"
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <CardContent className="flex items-center justify-between p-5">
                                    <div className="flex items-center gap-4">
                                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl font-bold shadow-sm ${
                                          expense.type === 'SETTLEMENT' 
                                            ? 'bg-gradient-emerald text-white' 
                                            : 'bg-gradient-primary text-primary-foreground'
                                        }`}>
                                            {expense.type === 'SETTLEMENT' ? (
                                              <ArrowRightLeft className="h-5 w-5" />
                                            ) : (
                                              <Calendar className="h-5 w-5" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-base">{expense.description}</p>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                              {expense.type === 'SETTLEMENT' ? (
                                                <span className="flex items-center gap-1">
                                                  <ArrowRightLeft className="h-3 w-3" /> Settlement
                                                </span>
                                              ) : (
                                                <span className="flex items-center gap-1">
                                                  <User className="h-3 w-3" /> Paid by {expense.paidBy}
                                                </span>
                                              )}
                                              <span>•</span>
                                              <span>{new Date(expense.date).toLocaleDateString("en-ZA", { 
                                                day: 'numeric', 
                                                month: 'long', 
                                                year: 'numeric' 
                                              })}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold text-xl ${
                                          expense.type === 'SETTLEMENT' 
                                            ? 'text-emerald-500' 
                                            : 'text-foreground'
                                        }`}>
                                          {formatCurrency(expense.amount)}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                          {expense.type === 'SETTLEMENT' ? 'Payment received' : 'Expense'}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </main>
    </div>
  );
}
