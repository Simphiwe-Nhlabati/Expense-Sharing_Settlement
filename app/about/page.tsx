import { AuthHeader } from "@/components/auth-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ShieldCheck, Receipt, PieChart, Users, Clock, Lock } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AuthHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero Section */}
          <section className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              About ZAR Ledger
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for South Africa. Designed for trust. Engineered for precision.
            </p>
          </section>

          {/* Mission */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              ZAR Ledger is an expense settlement platform tailored specifically for the South African market. 
              We handle the complexity of splitting expenses in Rands and cents, so you can focus on what matters — 
              enjoying time with friends, family, and colleagues without the awkward money conversations.
            </p>
          </section>

          {/* Features */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Why ZAR Ledger?</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <PieChart className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Smart Splits</CardTitle>
                  <CardDescription>
                    Split by percentage, shares, or exact amounts. We handle the rounding seamlessly to the 
                    last cent.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <ShieldCheck className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Idempotent Transactions</CardTitle>
                  <CardDescription>
                    Accidental double-clicks never result in double charges. Guaranteed by design.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <Receipt className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Immutable Audit Logs</CardTitle>
                  <CardDescription>
                    Every transaction is recorded permanently. Complete transparency for your group.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <Lock className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>POPIA Compliant</CardTitle>
                  <CardDescription>
                    Your personal information is protected. We follow South African data privacy regulations.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <Users className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Group Management</CardTitle>
                  <CardDescription>
                    Create groups with unique invite codes. Only members can view and add expenses.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <Clock className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Real-Time Updates</CardTitle>
                  <CardDescription>
                    Balances update instantly when expenses are added. No refresh needed.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </section>

          {/* Technical */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Built with Modern Technology</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Next.js 16</CardTitle>
                  <CardDescription>
                    React framework for production-grade applications
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Hono.js</CardTitle>
                  <CardDescription>
                    Fast, lightweight backend API framework
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">PostgreSQL</CardTitle>
                  <CardDescription>
                    ACID-compliant database for financial data
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Drizzle ORM</CardTitle>
                  <CardDescription>
                    Type-safe database queries
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">JWT Authentication</CardTitle>
                  <CardDescription>
                    Secure token-based authentication
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Shadcn UI</CardTitle>
                  <CardDescription>
                    Beautiful, accessible components
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </section>

          {/* South African Focus */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Made for South Africa 🇿🇦</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                ZAR Ledger understands the unique needs of South African users:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>All amounts stored in cents (integer precision, no floating-point errors)</li>
                <li>Proper rounding adjustments for splits that don't divide evenly</li>
                <li>Support for South African ID number validation</li>
                <li>Support for South African phone number formats (+27)</li>
                <li>POPIA-compliant data handling and PII protection</li>
                <li>ZAR (Rands) as the default currency</li>
              </ul>
            </div>
          </section>

          {/* Contact */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Get in Touch</h2>
            <p className="text-muted-foreground">
              Have questions or feedback? We'd love to hear from you.
            </p>
          </section>
        </div>
      </main>
      <footer className="py-6 md:px-8 md:py-0 border-t">
        <div className="container mx-auto px-4 flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row text-center md:text-left">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ZAR Ledger. Built with precision for South Africa.
          </p>
        </div>
      </footer>
    </div>
  );
}
