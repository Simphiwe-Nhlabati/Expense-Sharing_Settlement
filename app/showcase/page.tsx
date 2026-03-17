"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { StatCard, EmptyState, CurrencyDisplay, TierBadge, TransactionRow } from "@/components/common";
import { Users, Plus, TrendingUp, ArrowRight } from "lucide-react";

export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="heading-display">Design System Showcase</h1>
          <p className="text-lg text-muted-foreground">
            Interactive examples of all ZAR Ledger UI components and patterns
          </p>
        </div>

        {/* Typography */}
        <section className="space-y-6">
          <h2 className="heading-section">Typography</h2>
          
          <div className="space-y-4">
            <div>
              <p className="label-mono mb-2">Heading Display</p>
              <h1 className="heading-display">Split Expenses with Precision</h1>
            </div>
            
            <div>
              <p className="label-mono mb-2">Heading Section</p>
              <h2 className="heading-section">Your Groups and Expenses</h2>
            </div>
            
            <div>
              <p className="label-mono mb-2">Heading Subsection</p>
              <h3 className="heading-subsection">Manage your balance</h3>
            </div>
            
            <div>
              <p className="label-mono mb-2">Body Text</p>
              <p className="text-base text-foreground">
                This is regular body text. It's used for descriptions, explanations, and content that needs to be read carefully.
              </p>
            </div>
            
            <div>
              <p className="label-mono mb-2">Currency Display</p>
              <p className="currency text-3xl font-bold text-primary">R 1 245,50</p>
            </div>
          </div>
        </section>

        {/* Colors */}
        <section className="space-y-6">
          <h2 className="heading-section">Semantic Colors</h2>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="h-24 rounded-lg bg-red-500/20 border border-red-500/30" />
              <p className="label-mono text-xs">Debt</p>
              <p className="text-sm text-muted-foreground">You Owe</p>
            </div>
            
            <div className="space-y-2">
              <div className="h-24 rounded-lg bg-emerald-500/20 border border-emerald-500/30" />
              <p className="label-mono text-xs">Credit</p>
              <p className="text-sm text-muted-foreground">Owed to You</p>
            </div>
            
            <div className="space-y-2">
              <div className="h-24 rounded-lg bg-yellow-500/20 border border-yellow-500/30" />
              <p className="label-mono text-xs">Tier Braai</p>
              <p className="text-sm text-muted-foreground">Free</p>
            </div>
            
            <div className="space-y-2">
              <div className="h-24 rounded-lg bg-blue-500/20 border border-blue-500/30" />
              <p className="label-mono text-xs">Tier Household</p>
              <p className="text-sm text-muted-foreground">Paid</p>
            </div>
          </div>
        </section>

        {/* Stat Cards */}
        <section className="space-y-6">
          <h2 className="heading-section">Stat Cards</h2>
          
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              label="Total Balance"
              amount={24550}
              icon={<TrendingUp className="h-5 w-5" />}
              description="Across all groups"
            />
            
            <StatCard
              label="You Owe"
              amount={12550}
              icon={<ArrowRight className="h-5 w-5" />}
              colorScheme="debt"
              description="Pending settlements"
            />
            
            <StatCard
              label="Owed to You"
              amount={180250}
              icon={<ArrowRight className="h-5 w-5" />}
              colorScheme="credit"
              description="From pending settlements"
            />
          </div>
        </section>

        {/* Currency Display */}
        <section className="space-y-6">
          <h2 className="heading-section">Currency Display</h2>
          
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <CurrencyDisplay
                amount={24550}
                label="Total Balance"
                type="balance"
                variant="large"
              />
            </div>
            
            <div>
              <CurrencyDisplay
                amount={12550}
                label="You Owe"
                type="debt"
                variant="large"
              />
            </div>
            
            <div>
              <CurrencyDisplay
                amount={180250}
                label="Owed to You"
                type="credit"
                variant="large"
              />
            </div>
          </div>
        </section>

        {/* Tier Badges */}
        <section className="space-y-6">
          <h2 className="heading-section">Subscription Tiers</h2>
          
          <div className="flex flex-wrap gap-4">
            <TierBadge tier="BRAAI" />
            <TierBadge tier="HOUSEHOLD" />
            <TierBadge tier="AGENT" />
          </div>
        </section>

        {/* Transaction Rows */}
        <section className="space-y-6">
          <h2 className="heading-section">Transaction Rows</h2>
          
          <div className="space-y-3">
            <TransactionRow
              id="tx-1"
              date={new Date("2026-03-15")}
              type="expense"
              direction="paid"
              amount={12550}
              description="Braai supplies"
              otherParty="Thabo"
              group="March Braai"
            />
            
            <TransactionRow
              id="tx-2"
              date={new Date("2026-03-14")}
              type="expense"
              direction="received"
              amount={8550}
              description="Concert tickets"
              otherParty="Lerato"
              group="Social Club"
            />
            
            <TransactionRow
              id="tx-3"
              date={new Date("2026-03-13")}
              type="settlement"
              direction="settled"
              amount={50000}
              description="Settlement"
              otherParty="James"
              group="House Rent"
            />
          </div>
        </section>

        {/* Empty State */}
        <section className="space-y-6">
          <h2 className="heading-section">Empty State</h2>
          
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="No groups yet"
            description="Create your first group and start splitting expenses. No braai bills here yet 🔥"
            action={
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Group
              </Button>
            }
          />
        </section>

        {/* Buttons */}
        <section className="space-y-6">
          <h2 className="heading-section">Buttons</h2>
          
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button>Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="destructive">Destructive Button</Button>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Button size="sm">Small</Button>
              <Button size="lg">Large</Button>
              <Button size="icon"><Plus className="h-4 w-4" /></Button>
            </div>
            
            <div className="flex gap-4">
              <Button disabled>Disabled Button</Button>
            </div>
          </div>
        </section>

        {/* Cards */}
        <section className="space-y-6">
          <h2 className="heading-section">Cards</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="card-lift">
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card description goes here</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Card content with any content you want.</p>
              </CardContent>
            </Card>
            
            <Card className="card-lift">
              <CardHeader>
                <CardTitle>Another Card</CardTitle>
                <CardDescription>With hover lift effect</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Hover over this card to see the lift effect.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Animations */}
        <section className="space-y-6">
          <h2 className="heading-section">Animations</h2>
          
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary animate-fade-in" />
              <div className="h-12 w-12 rounded-lg bg-accent animate-slide-up" />
              <div className="h-12 w-12 rounded-lg bg-destructive animate-scale-in" />
              <div className="h-12 w-12 rounded-lg bg-primary animate-float" />
            </div>
            
            <p className="text-sm text-muted-foreground">
              Hover over or view the animation definitions in globals.css
            </p>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t pt-8 text-center text-sm text-muted-foreground">
          <p>ZAR Ledger Design System Showcase</p>
          <p>For full documentation, see DESIGN_SYSTEM.md</p>
        </div>
      </div>
    </div>
  );
}
