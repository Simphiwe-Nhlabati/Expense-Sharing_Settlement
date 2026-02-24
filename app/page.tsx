import { AuthHeader } from "@/components/auth-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight, PieChart, Users, Receipt, ShieldCheck } from "lucide-react";
import { CreateGroupDialog } from "@/components/features/groups/create-group-dialog";
import { GroupList } from "@/components/features/groups/group-list";
import { JoinGroupDialog } from "@/components/features/groups/invite-code";
import { getDashboardStats } from "@/app/actions/dashboard";
import { formatCurrency } from "@/lib/utils";
import { getAuthenticatedUser } from "@/app/actions/auth";

export default async function Home() {
  const user = await getAuthenticatedUser();

  if (user) {
     // Fetch dashboard stats
     const stats = await getDashboardStats();

     return (
       <div className="relative flex min-h-screen flex-col bg-background">
         <AuthHeader />
         <main className="flex-1">
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                  <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                  <div className="flex gap-2">
                    <JoinGroupDialog />
                    <CreateGroupDialog />
                  </div>
                </div>
                
                <div className="grid gap-6 md:grid-cols-3 mb-8">
                   <Card>
                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                       <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                       <span className={`text-2xl font-bold ${stats.totalBalance >= 0 ? "text-primary" : "text-destructive"}`}>
                          {formatCurrency(stats.totalBalance)}
                       </span>
                     </CardHeader>
                     <CardContent>
                       <p className="text-xs text-muted-foreground">Overall across all groups</p>
                     </CardContent>
                   </Card>
                   <Card>
                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                       <CardTitle className="text-sm font-medium">You Owe</CardTitle>
                       <span className="text-2xl font-bold text-destructive">
                          {formatCurrency(stats.youOwe)}
                       </span>
                     </CardHeader>
                     <CardContent>
                       <p className="text-xs text-muted-foreground">To pending settlements</p>
                     </CardContent>
                   </Card>
                   <Card>
                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                       <CardTitle className="text-sm font-medium">Owed to You</CardTitle>
                       <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(stats.owedToYou)}
                       </span>
                     </CardHeader>
                     <CardContent>
                       <p className="text-xs text-muted-foreground">From pending settlements</p>
                     </CardContent>
                   </Card>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <h2 className="text-xl font-semibold tracking-tight">Your Groups</h2>
                  </div>
                  <GroupList />
                </div>
            </div>
         </main>
       </div>
     );
  }

  // Public Landing Page (unchanged)
  return (
    <div className="relative flex min-h-screen flex-col bg-background selection:bg-primary/20">
        <AuthHeader />
        <main className="flex-1">
             {/* Hero Section */}
             <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
                 <div className="container mx-auto px-4 flex max-w-[64rem] flex-col items-center gap-4 text-center">
                     <div className="rounded-2xl bg-muted px-4 py-1.5 text-sm font-medium">
                        ZAR Ledger 2.0 is now live
                     </div>
                     <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                        Split Expenses with <span className="text-primary bg-clip-text">Precision</span>
                     </h1>
                     <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                        The settlement platform built for South Africa. Track Rands, settle instantly to the cent, and never argue over the bill again.
                     </p>
                     <div className="space-x-4">
                        <Link href="/sign-up">
                            <Button size="lg" className="h-12 px-8 text-lg rounded-full">Get Started</Button>
                        </Link>
                        <Link href="/about">
                            <Button variant="outline" size="lg" className="h-12 px-8 text-lg rounded-full">Learn More</Button>
                        </Link>
                     </div>
                 </div>
             </section>

             {/* Features Grid */}
             <section className="container mx-auto px-4 space-y-6 py-8 md:py-12 lg:py-24 bg-muted/30 rounded-3xl mb-12">
                <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
                    <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl font-bold">
                        Built for <span className="text-primary">Trust</span>
                    </h2>
                    <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                        Unlike other apps, we handle the complexity of South African banking logic and idempotent settlements.
                    </p>
                </div>
                <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
                    <Card className="bg-background/60 backdrop-blur-sm border-primary/10">
                        <CardHeader>
                            <PieChart className="h-10 w-10 text-primary mb-2" />
                            <CardTitle>Smart Splits</CardTitle>
                            <CardDescription>
                                Split by percentage, shares, or exact amounts. We handle the rounding seamlessly.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                    <Card className="bg-background/60 backdrop-blur-sm border-primary/10">
                        <CardHeader>
                            <ShieldCheck className="h-10 w-10 text-primary mb-2" />
                            <CardTitle>Idempotent</CardTitle>
                            <CardDescription>
                                Accidental double-clicks never result in double charges. Guaranteed.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                    <Card className="bg-background/60 backdrop-blur-sm border-primary/10">
                         <CardHeader>
                            <Receipt className="h-10 w-10 text-primary mb-2" />
                            <CardTitle>Audit Logs</CardTitle>
                            <CardDescription>
                                Every transaction is recorded immutably. Complete transparency for your group.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
             </section>
        </main>
        <footer className="py-6 md:px-8 md:py-0">
             <div className="container mx-auto px-4 flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row text-center md:text-left">
                <p className="text-sm text-balance text-muted-foreground leading-loose">
                    Built by <span className="font-medium underline underline-offset-4">ZAR Ledger Team</span>. The source code is available on GitHub.
                </p>
             </div>
        </footer>
    </div>
  );
}
