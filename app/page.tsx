import { AuthHeader } from "@/components/auth-header";
import { Button } from "@/components/ui/button";
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
  Sparkles,
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
    const stats = await getDashboardStats();

    return (
      <div className="relative flex min-h-screen flex-col bg-background">
        <AuthHeader />
        <main className="flex-1 relative z-10">
          <div className="container mx-auto px-4 py-10 max-w-6xl">

            {/* Dashboard Hero */}
            <div className="relative mb-10 overflow-hidden rounded-sm border border-border/60 bg-gradient-primary">
              {/* Dot mesh overlay */}
              <div className="absolute inset-0 bg-mesh opacity-40" />
              {/* Gold top rule */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-gold opacity-60" />

              <div className="relative z-10 p-8 md:p-10">
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <p className="label-mono text-white/40 mb-2">Dashboard</p>
                    <h1
                      className="text-3xl md:text-4xl font-bold text-white"
                      style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
                    >
                      Welcome Back
                    </h1>
                  </div>
                  <div className="hidden md:flex gap-2">
                    <JoinGroupDialog />
                    <CreateGroupDialog />
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid gap-px md:grid-cols-3 border border-white/10 rounded-sm overflow-hidden">
                  <StatBlock
                    label="Total Balance"
                    value={formatCurrency(stats.totalBalance)}
                    sub="Across all groups"
                    positive={stats.totalBalance >= 0}
                    icon={<TrendingUp className="h-4 w-4" />}
                  />
                  <StatBlock
                    label="You Owe"
                    value={formatCurrency(stats.youOwe)}
                    sub="Pending settlements"
                    debt
                    icon={<ArrowRight className="h-4 w-4" />}
                  />
                  <StatBlock
                    label="Owed to You"
                    value={formatCurrency(stats.owedToYou)}
                    sub="From pending settlements"
                    credit
                    icon={<TrendingUp className="h-4 w-4" />}
                  />
                </div>
              </div>

              {/* Decorative corner geometry */}
              <div className="absolute -bottom-16 -right-16 w-48 h-48 border border-white/5 rotate-45" />
              <div className="absolute -bottom-8 -right-8 w-32 h-32 border border-white/5 rotate-45" />
            </div>

            {/* Groups Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="label-mono text-muted-foreground mb-1">Your Groups</p>
                  <h2 className="heading-section">Shared Ledgers</h2>
                </div>
                <div className="flex gap-2 md:hidden">
                  <JoinGroupDialog />
                  <CreateGroupDialog />
                </div>
              </div>
              <div className="gold-rule" />
              <GroupList />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─── PUBLIC LANDING PAGE ────────────────────────────────────
  return (
    <div className="relative flex min-h-screen flex-col bg-background selection:bg-accent/20">
      <AuthHeader />
      <main className="flex-1 relative z-10">

        {/* ── HERO ── */}
        <section className="relative overflow-hidden bg-gradient-hero min-h-[90vh] flex items-center">
          {/* Grid texture */}
          <div className="absolute inset-0 bg-mesh opacity-30" />

          {/* Floating gold orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-accent/5 blur-3xl animate-float pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-brand-ember/5 blur-3xl animate-float-delayed pointer-events-none" />

          <div className="container mx-auto px-4 relative z-10 py-24">
            <div className="max-w-5xl mx-auto">
              {/* Eyebrow */}
              <div className="flex items-center gap-3 mb-8 animate-slide-down">
                <div className="h-px w-12 bg-accent" />
                <span className="label-mono text-accent">ZAR Ledger — South Africa</span>
              </div>

              {/* Headline — editorial split layout */}
              <h1 className="heading-display mb-6 animate-fade-in">
                <span className="block text-foreground">Split Expenses.</span>
                <span className="block text-gradient">Settle with Precision.</span>
              </h1>

              <p className="max-w-xl text-lg text-muted-foreground leading-relaxed mb-10 animate-slide-up">
                The settlement platform built for{" "}
                <span className="text-foreground font-medium">South Africa</span>.
                Track Rands to the cent, settle instantly, and never argue over the bill again.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 mb-16 animate-slide-up">
                <Link href="/sign-up">
                  <Button
                    size="lg"
                    className="h-12 px-8 rounded-none bg-accent text-accent-foreground hover:bg-accent/90 transition-colors text-sm font-semibold tracking-wide"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 px-8 rounded-none border-border/60 text-sm font-medium hover:border-accent hover:text-accent transition-colors"
                  >
                    Learn More
                  </Button>
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground animate-fade-in">
                <TrustBadge label="POPIA Compliant" />
                <TrustBadge label="Bank-Grade Security" />
                <TrustBadge label="Real-time Sync" />
              </div>
            </div>
          </div>

          {/* Bottom rule */}
          <div className="absolute bottom-0 left-0 right-0 gold-rule" />
        </section>

        {/* ── FEATURES ── */}
        <section className="relative py-24 md:py-32">
          <div className="container mx-auto px-4 max-w-6xl">
            {/* Section header */}
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-accent" />
                <span className="label-mono text-accent">Why ZAR Ledger</span>
              </div>
              <h2 className="heading-section max-w-lg">
                Built for Trust,<br />Engineered for Precision
              </h2>
            </div>

            {/* Feature grid — asymmetric */}
            <div className="grid gap-px border border-border/60 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCell
                icon={PieChart}
                title="Smart Splits"
                description="Split by percentage, shares, or exact amounts. Rounding handled to the last cent."
                accent="gold"
              />
              <FeatureCell
                icon={ShieldCheck}
                title="Idempotent"
                description="Accidental double-clicks never result in double charges. Guaranteed by our settlement logic."
                accent="jade"
              />
              <FeatureCell
                icon={Receipt}
                title="Audit Logs"
                description="Every transaction recorded immutably. Complete transparency for your group finances."
                accent="ember"
              />
              <FeatureCell
                icon={Zap}
                title="Lightning Fast"
                description="Built on Bun.js and Next.js for blazing performance and instant updates."
                accent="gold"
              />
              <FeatureCell
                icon={Lock}
                title="Secure by Design"
                description="JWT authentication, encrypted data, and POPIA-compliant handling of your information."
                accent="jade"
              />
              <FeatureCell
                icon={Users}
                title="Group Management"
                description="Create groups with unique invite codes. Only members can view and add expenses."
                accent="ember"
              />
            </div>
          </div>
        </section>

        {/* ── CTA BAND ── */}
        <section className="py-24 border-t border-border/60">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="relative overflow-hidden border border-border/60 bg-gradient-primary p-12 md:p-16">
              <div className="absolute inset-0 bg-mesh opacity-30" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-gold opacity-60" />

              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div>
                  <p className="label-mono text-white/40 mb-3">Start Today</p>
                  <h2
                    className="text-3xl md:text-4xl font-bold text-white mb-3"
                    style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
                  >
                    Ready to settle with precision?
                  </h2>
                  <p className="text-white/60 max-w-md">
                    Join South Africans who trust ZAR Ledger for fair, transparent expense sharing.
                  </p>
                </div>
                <Link href="/sign-up" className="flex-shrink-0">
                  <Button
                    size="lg"
                    className="h-12 px-8 rounded-none bg-accent text-accent-foreground hover:bg-accent/90 transition-colors text-sm font-semibold"
                  >
                    Create Free Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {/* Corner geometry */}
              <div className="absolute -bottom-12 -right-12 w-40 h-40 border border-white/5 rotate-45" />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative h-6 w-6 flex items-center justify-center">
                <div className="absolute inset-0 rotate-45 border border-accent" />
                <span className="relative text-[9px] font-bold text-accent" style={{ fontFamily: "var(--font-display)" }}>Z</span>
              </div>
              <span className="label-mono text-muted-foreground">ZAR Ledger — Built for South Africa 🇿🇦</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <Link href="/about" className="hover:text-accent transition-colors">About</Link>
              <Link href="/sign-in" className="hover:text-accent transition-colors">Sign In</Link>
              <Link href="/sign-up" className="hover:text-accent transition-colors">Get Started</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */

function StatBlock({
  label,
  value,
  sub,
  positive,
  debt,
  credit,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  positive?: boolean;
  debt?: boolean;
  credit?: boolean;
  icon?: React.ReactNode;
}) {
  const valueColor = debt
    ? "text-red-300"
    : credit
    ? "text-emerald-300"
    : positive
    ? "text-emerald-300"
    : "text-white";

  return (
    <div className="bg-white/5 hover:bg-white/8 transition-colors p-5 md:p-6">
      <div className="flex items-center justify-between mb-3">
        <span className="label-mono text-white/40">{label}</span>
        <span className="text-white/30">{icon}</span>
      </div>
      <p className={`currency text-2xl md:text-3xl font-bold ${valueColor} mb-1`}>{value}</p>
      <p className="text-xs text-white/30">{sub}</p>
    </div>
  );
}

function TrustBadge({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className="h-3.5 w-3.5 text-accent flex-shrink-0" />
      <span>{label}</span>
    </div>
  );
}

const accentMap = {
  gold:  { bar: "bg-accent",       icon: "text-accent" },
  jade:  { bar: "bg-brand-jade",   icon: "text-emerald-500" },
  ember: { bar: "bg-brand-ember",  icon: "text-orange-500" },
};

function FeatureCell({
  icon: Icon,
  title,
  description,
  accent = "gold",
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  accent?: "gold" | "jade" | "ember";
}) {
  const { bar, icon } = accentMap[accent];
  return (
    <div className="group relative bg-card hover:bg-secondary/50 transition-colors p-8 overflow-hidden">
      {/* Top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-px ${bar} opacity-0 group-hover:opacity-100 transition-opacity`} />

      <div className={`inline-flex h-10 w-10 items-center justify-center border border-border/60 mb-5 ${icon} group-hover:border-accent/40 transition-colors`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3
        className="text-base font-semibold mb-2"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
