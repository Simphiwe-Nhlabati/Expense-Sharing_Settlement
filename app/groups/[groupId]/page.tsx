import { getGroup } from "@/app/actions/groups";
import { getExpenses } from "@/app/actions/expenses";
import { AuthHeader } from "@/components/auth-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Settings, ArrowRightLeft } from "lucide-react";
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
            <div className="mb-6">
                <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Link>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
                            <p className="text-muted-foreground">{group.description}</p>
                        </div>
                        {/* 🔴 Real-time live indicator */}
                        <RealtimeIndicator groupId={groupId} />
                    </div>
                    <div className="flex gap-2 items-center">
                        {/* 📄 Export CSV/PDF */}
                        <ExportButton groupId={groupId} groupName={group.name} />
                        <Button variant="ghost" size="icon" asChild>
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
                <h2 className="text-xl font-semibold">Expenses</h2>
                {expenses.length === 0 ? (
                    <div className="text-center p-12 border border-dashed rounded-lg bg-muted/30">
                        <p className="text-muted-foreground">No expenses recorded yet.</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {expenses.map((expense: any) => (
                            <Card key={expense.id} className="group hover:border-primary/50 transition-colors">
                                <CardContent className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${expense.type === 'SETTLEMENT' ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'}`}>
                                            {expense.type === 'SETTLEMENT' ? <ArrowRightLeft className="h-5 w-5" /> : new Date(expense.date).getDate()}
                                        </div>
                                        <div>
                                            <p className="font-medium">{expense.description}</p>
                                            <p className="text-sm text-muted-foreground">{expense.type === 'SETTLEMENT' ? `Settlement` : `Paid by ${expense.paidBy}`}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold text-lg ${expense.type === 'SETTLEMENT' ? 'text-green-600' : ''}`}>{formatCurrency(expense.amount)}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(expense.date).toLocaleDateString("en-ZA")}</p>
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
