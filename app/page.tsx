import { AuthHeader } from "@/components/auth-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { 
  ArrowRight, 
  PieChart, 
  Users, 
  Receipt, 
  ShieldCheck, 
  Zap, 
  Lock, 
  TrendingUp,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { CreateGroupDialog } from "@/components/features/groups/create-group-dialog";
import { JoinGroupDialog } from "@/components/features/groups/invite-code";
import { GroupList } from "@/components/features/groups/group-list";
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
                {/* Header with gradient background */}
                <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-primary p-8 md:p-12">
                  <div className="absolute inset-0 bg-mesh opacity-50" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
                          Welcome Back
                        </h1>
                        <p className="text-white/80 text-lg">Manage your expenses with precision</p>
                      </div>
                      <div className="hidden md:flex gap-2">
                        <JoinGroupDialog />
                        <CreateGroupDialog />
                      </div>
                    </div>
                    
                    {/* Stats Grid */}
                    <div className="grid gap-4 md:grid-cols-3">
                       <div className="group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm p-5 transition-all hover:bg-white/15">
                         <div className="flex items-center justify-between mb-3">
                           <span className="text-sm font-medium text-white/80">Total Balance</span>
                           <TrendingUp className="h-5 w-5 text-white/80" />
                         </div>
                         <p className={`text-3xl font-bold ${stats.totalBalance >= 0 ? "text-emerald-300" : "text-white"}`}>
                            {formatCurrency(stats.totalBalance)}
                         </p>
                         <p className="text-xs text-white/60 mt-2">Across all groups</p>
                       </div>
                       <div className="group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm p-5 transition-all hover:bg-white/15">
                         <div className="flex items-center justify-between mb-3">
                           <span className="text-sm font-medium text-white/80">You Owe</span>
                           <ArrowRight className="h-5 w-5 text-white/80" />
                         </div>
                         <p className="text-3xl font-bold text-red-200">
                            {formatCurrency(stats.youOwe)}
                         </p>
                         <p className="text-xs text-white/60 mt-2">Pending settlements</p>
                       </div>
                       <div className="group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm p-5 transition-all hover:bg-white/15">
                         <div className="flex items-center justify-between mb-3">
                           <span className="text-sm font-medium text-white/80">Owed to You</span>
                           <TrendingUp className="h-5 w-5 text-white/80" />
                         </div>
                         <p className="text-3xl font-bold text-emerald-300">
                            {formatCurrency(stats.owedToYou)}
                         </p>
                         <p className="text-xs text-white/60 mt-2">From pending settlements</p>
                       </div>
                    </div>
                  </div>
                  
                  {/* Decorative circles */}
                  <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
                  <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
                </div>

                {/* Groups Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <div>
                       <h2 className="text-2xl font-bold tracking-tight">Your Groups</h2>
                       <p className="text-muted-foreground">Collaborate and split expenses with your circle</p>
                     </div>
                     <div className="flex gap-2 md:hidden">
                        <JoinGroupDialog />
                        <CreateGroupDialog />
                     </div>
                  </div>
                  <GroupList />
                </div>
            </div>
         </main>
       </div>
     );
  }

  // Public Landing Page
  return (
    <div className="relative flex min-h-screen flex-col bg-background selection:bg-primary/20">
        <AuthHeader />
        <main className="flex-1">
          {/* Hero Section with dramatic gradient */}
          <section className="relative overflow-hidden bg-gradient-hero py-20 md:py-32 lg:py-40">
            <div className="absolute inset-0 bg-mesh opacity-20" />

            {/* Animated floating elements */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-coral/20 rounded-full blur-3xl animate-float-delayed" />

            <div className="container mx-auto px-4 relative z-10">
              <div className="max-w-4xl mx-auto text-center space-y-8">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 rounded-full bg-glass px-4 py-2 text-sm font-medium border border-primary/20 shadow-lg animate-slide-down">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-primary font-semibold">ZAR Ledger 2.0 is now live</span>
                </div>

                {/* Main headline */}
                <h1 className="font-heading text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl leading-tight animate-fade-in text-white drop-shadow-lg">
                  Split Expenses with{" "}
                  <span className="text-emerald-300 drop-shadow-md">Precision</span>{" "}
                  and{" "}
                  <span className="text-amber-200 drop-shadow-md">Trust</span>
                </h1>

                {/* Subheadline */}
                <p className="max-w-2xl mx-auto text-lg md:text-xl text-white/90 leading-relaxed animate-slide-up drop-shadow-sm">
                  The settlement platform built for <span className="font-semibold text-white">South Africa</span>.
                  Track Rands, settle instantly to the cent, and never argue over the bill again.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4 animate-slide-up">
                  <Link href="/sign-up">
                    <Button size="lg" className="h-14 px-10 text-lg rounded-full bg-white text-primary hover:bg-white/90 transition-colors shadow-xl">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/about">
                    <Button variant="outline" size="lg" className="h-14 px-10 text-lg rounded-full border-2 border-white/30 text-white hover:bg-white/10 transition-colors">
                      Learn More
                    </Button>
                  </Link>
                </div>

                {/* Trust indicators */}
                <div className="pt-12 flex flex-wrap justify-center gap-6 text-sm text-white/80 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    <span>POPIA Compliant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    <span>Bank-Grade Security</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    <span>Real-time Sync</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Grid with glass morphism */}
          <section className="relative py-20 md:py-28 bg-secondary/50">
            <div className="container mx-auto px-4 relative">
              <div className="mx-auto max-w-4xl text-center space-y-4 mb-16">
                <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight">
                  Built for <span className="text-gradient">Trust</span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Unlike other apps, we handle the complexity of South African banking logic
                  and idempotent settlements.
                </p>
              </div>
              
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
                <FeatureCard
                  icon={PieChart}
                  title="Smart Splits"
                  description="Split by percentage, shares, or exact amounts. We handle the rounding seamlessly to the last cent."
                  gradient="from-indigo-500/10 to-purple-500/10"
                  iconColor="text-indigo-500"
                />
                <FeatureCard
                  icon={ShieldCheck}
                  title="Idempotent"
                  description="Accidental double-clicks never result in double charges. Guaranteed by our settlement logic."
                  gradient="from-emerald-500/10 to-teal-500/10"
                  iconColor="text-emerald-500"
                />
                <FeatureCard
                  icon={Receipt}
                  title="Audit Logs"
                  description="Every transaction is recorded immutably. Complete transparency for your group finances."
                  gradient="from-amber-500/10 to-orange-500/10"
                  iconColor="text-amber-500"
                />
                <FeatureCard
                  icon={Zap}
                  title="Lightning Fast"
                  description="Built on Bun.js and Next.js 16 for blazing fast performance and instant updates."
                  gradient="from-yellow-500/10 to-amber-500/10"
                  iconColor="text-yellow-500"
                />
                <FeatureCard
                  icon={Lock}
                  title="Secure by Design"
                  description="JWT authentication, encrypted data, and POPIA-compliant handling of your information."
                  gradient="from-blue-500/10 to-cyan-500/10"
                  iconColor="text-blue-500"
                />
                <FeatureCard
                  icon={Users}
                  title="Group Management"
                  description="Create groups with unique invite codes. Only members can view and add expenses."
                  gradient="from-pink-500/10 to-rose-500/10"
                  iconColor="text-pink-500"
                />
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 md:py-28">
            <div className="container mx-auto px-4">
              <div className="relative max-w-4xl mx-auto rounded-3xl bg-gradient-primary p-12 md:p-16 overflow-hidden text-center">
                <div className="absolute inset-0 bg-mesh opacity-15" />
                <div className="relative z-10 space-y-6">
                  <h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                    Ready to settle with precision?
                  </h2>
                  <p className="text-lg text-white/90 drop-shadow-sm max-w-xl mx-auto">
                    Join thousands of South Africans who trust ZAR Ledger for their expense sharing.
                  </p>
                  <Link href="/sign-up">
                    <Button size="lg" className="h-14 px-10 text-lg rounded-full bg-white text-primary hover:bg-white/90 transition-colors shadow-xl">
                      Create Free Account
                    </Button>
                  </Link>
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
              </div>
            </div>
          </section>
        </main>
        
        {/* Footer */}
        <footer className="py-8 border-t bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">ZAR Ledger</p>
                <p className="text-xs text-muted-foreground">
                  Built with precision for South Africa 🇿🇦
                </p>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <Link href="/about" className="hover:text-foreground transition-colors">
                  About
                </Link>
                <Link href="/sign-in" className="hover:text-foreground transition-colors">
                  Sign In
                </Link>
                <Link href="/sign-up" className="hover:text-foreground transition-colors">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  iconColor: string;
}

function FeatureCard({ icon: Icon, title, description, gradient, iconColor }: FeatureCardProps) {
  return (
    <Card className="group relative overflow-hidden border-0 bg-card shadow-lg card-lift">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <CardHeader className="relative z-10 space-y-4">
        <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary ${iconColor} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="h-7 w-7" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-muted-foreground leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
