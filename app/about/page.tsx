import { AuthHeader } from "@/components/auth-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { 
  ShieldCheck, 
  Receipt, 
  PieChart, 
  Users, 
  Clock, 
  Lock, 
  Zap, 
  Globe, 
  CheckCircle2,
  Sparkles,
  Heart
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AuthHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-hero py-20 md:py-28">
          <div className="absolute inset-0 bg-mesh opacity-20" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-coral/20 rounded-full blur-3xl animate-float-delayed" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-glass px-4 py-2 text-sm font-medium border border-primary/20 shadow-lg">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-primary font-semibold">About ZAR Ledger</span>
              </div>
              <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-white drop-shadow-lg">
                Built for <span className="text-emerald-300 drop-shadow-md">South Africa</span>
              </h1>
              <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
                Designed for trust. Engineered for precision. The expense settlement platform
                that understands the unique needs of South African users.
              </p>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-16 space-y-20">
          {/* Mission Section */}
          <section className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary mb-4 mx-auto">
              <Heart className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Our Mission</h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              ZAR Ledger is an expense settlements platform tailored specifically for the 
              South African market. We handle the complexity of splitting expenses in Rands 
              and cents, so you can focus on what matters — enjoying time with friends, 
              family, and colleagues without the awkward money conversations.
            </p>
          </section>

          {/* Features Grid */}
          <section className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Why <span className="text-emerald-300 drop-shadow-md">ZAR Ledger</span>?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Unlike other apps, we handle the complexity of South African banking logic 
                and idempotent settlements.
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              <FeatureCard
                icon={PieChart}
                title="Smart Splits"
                description="Split by percentage, shares, or exact amounts. We handle the rounding seamlessly to the last cent."
                gradient="from-indigo-500/10 to-purple-500/10"
                iconColor="text-indigo-500"
              />
              <FeatureCard
                icon={ShieldCheck}
                title="Idempotent Transactions"
                description="Accidental double-clicks never result in double charges. Guaranteed by our settlement logic."
                gradient="from-emerald-500/10 to-teal-500/10"
                iconColor="text-emerald-500"
              />
              <FeatureCard
                icon={Receipt}
                title="Immutable Audit Logs"
                description="Every transaction is recorded permanently. Complete transparency for your group finances."
                gradient="from-amber-500/10 to-orange-500/10"
                iconColor="text-amber-500"
              />
              <FeatureCard
                icon={Lock}
                title="POPIA Compliant"
                description="Your personal information is protected. We follow South African data privacy regulations."
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
              <FeatureCard
                icon={Clock}
                title="Real-Time Updates"
                description="Balances update instantly when expenses are added. No refresh needed."
                gradient="from-violet-500/10 to-purple-500/10"
                iconColor="text-violet-500"
              />
            </div>
          </section>

          {/* Technology Stack */}
          <section className="space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-coral mx-auto">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Built with <span className="text-gradient-coral">Modern Technology</span>
              </h2>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
              <TechCard name="Next.js 16" description="React framework for production-grade applications" />
              <TechCard name="Hono.js" description="Fast, lightweight backend API framework" />
              <TechCard name="PostgreSQL" description="ACID-compliant database for financial data" />
              <TechCard name="Drizzle ORM" description="Type-safe database queries" />
              <TechCard name="JWT Authentication" description="Secure token-based authentication" />
              <TechCard name="Shadcn UI" description="Beautiful, accessible components" />
            </div>
          </section>

          {/* South African Focus */}
          <section className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-emerald mx-auto">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Made for <span className="text-gradient-emerald">South Africa</span> 🇿🇦
              </h2>
            </div>
            
            <Card className="border-0 shadow-xl bg-gradient-card overflow-hidden">
              <CardContent className="p-8 space-y-6">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  ZAR Ledger understands the unique needs of South African users:
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <FeatureListItem text="All amounts stored in cents (integer precision)" />
                  <FeatureListItem text="No floating-point errors in calculations" />
                  <FeatureListItem text="Proper rounding adjustments for splits" />
                  <FeatureListItem text="South African ID number validation" />
                  <FeatureListItem text="South African phone number formats (+27)" />
                  <FeatureListItem text="POPIA-compliant data handling" />
                  <FeatureListItem text="ZAR (Rands) as default currency" />
                  <FeatureListItem text="en-ZA locale for dates and formatting" />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* CTA Section */}
          <section className="max-w-3xl mx-auto text-center space-y-6 py-8">
            <h2 className="text-2xl md:text-3xl font-bold">Get in Touch</h2>
            <p className="text-muted-foreground text-lg">
              Have questions or feedback? We&apos;d love to hear from you.
            </p>
          </section>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-8 border-t bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">ZAR Ledger</p>
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} Built with precision for South Africa.
              </p>
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
    <Card className="group relative overflow-hidden border-0 shadow-lg card-lift bg-card">
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

function TechCard({ name, description }: { name: string; description: string }) {
  return (
    <Card className="border-0 shadow-md bg-card">
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <CardTitle className="text-lg">{name}</CardTitle>
        </div>
        <CardDescription className="text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

function FeatureListItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
      <span className="text-muted-foreground">{text}</span>
    </div>
  );
}
