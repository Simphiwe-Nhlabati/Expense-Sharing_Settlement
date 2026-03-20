"use client";

import { AuthHeader } from "@/components/auth-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Sparkles, ShieldCheck, Clock } from "lucide-react";

interface Tier {
  tier: string;
  name: string;
  maxGroups: number;
  maxMembersPerGroup: number;
  historyDays: number;
  features: string[];
  priceZar: number;
  isCurrent: boolean;
  popular?: boolean;
}

const TIER_ICONS: Record<string, React.ElementType> = {
  BRAAI: Zap,
  HOUSEHOLD: ShieldCheck,
  AGENT: Sparkles,
};

const TIER_COLORS: Record<string, string> = {
  BRAAI: "from-gray-500 to-gray-600",
  HOUSEHOLD: "from-blue-500 to-blue-600",
  AGENT: "from-purple-500 to-purple-600",
};

// Tier data is static, no need for state
const TIERS_DATA: Tier[] = [
  {
    tier: "BRAAI",
    name: "Braai",
    maxGroups: 3,
    maxMembersPerGroup: 10,
    historyDays: 30,
    features: ["basic_splitting", "expense_tracking", "settlement_tracking"],
    priceZar: 0,
    isCurrent: true,
    popular: false,
  },
  {
    tier: "HOUSEHOLD",
    name: "Household",
    maxGroups: 10,
    maxMembersPerGroup: 25,
    historyDays: 365,
    features: ["basic_splitting", "expense_tracking", "settlement_tracking", "pdf_export", "csv_xero_export"],
    priceZar: 4900,
    isCurrent: false,
    popular: true,
  },
  {
    tier: "AGENT",
    name: "Agent",
    maxGroups: -1,
    maxMembersPerGroup: -1,
    historyDays: -1,
    features: ["basic_splitting", "expense_tracking", "settlement_tracking", "pdf_export", "csv_xero_export", "api_access", "priority_support"],
    priceZar: 29900,
    isCurrent: false,
    popular: false,
  },
];

export default function SubscriptionPage() {
  function formatPrice(price: number) {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(price);
  }

  function getFeatureText(feature: string) {
    return feature
      .replace("_", " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <AuthHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="mb-10 text-center">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
              Choose Your Plan
            </h1>
            <p className="text-muted-foreground text-lg">
              Upgrade to unlock more features and higher limits
            </p>
          </div>

          {/* Coming Soon Banner */}
          <Card className="mb-8 bg-gradient-to-r from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardHeader className="text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-amber-500" />
              <CardTitle className="text-2xl text-amber-600">Coming Soon</CardTitle>
              <CardDescription className="text-base">
                We&apos;re working on bringing you premium subscription features. 
                Stay tuned for exciting updates!
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                For now, enjoy all the free features of the{" "}
                <span className="font-semibold text-primary">Braai</span> tier.
                When we launch, you&apos;ll be the first to know!
              </p>
            </CardContent>
          </Card>

          {/* Tier Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {TIERS_DATA.map((tier) => {
              const Icon = TIER_ICONS[tier.tier];
              const isCurrent = tier.tier === "BRAAI"; // Everyone is on BRAAI for now
              const isPaid = tier.priceZar > 0;

              return (
                <Card
                  key={tier.tier}
                  className={`relative flex flex-col ${
                    isCurrent ? "border-primary ring-2 ring-primary/20" : ""
                  } ${tier.popular ? "shadow-lg scale-105" : ""} ${
                    isPaid ? "opacity-75" : ""
                  }`}
                >
                  {tier.popular && !isPaid && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      Most Popular
                    </Badge>
                  )}

                  <CardHeader className="text-center">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br ${TIER_COLORS[tier.tier]} mb-4`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl">{tier.name}</CardTitle>
                    <CardDescription>
                      {tier.priceZar === 0 ? "Free forever" : `${formatPrice(tier.priceZar)}/month`}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <ul className="space-y-3">
                      <li className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-green-500" />
                        <span className="text-sm">
                          {tier.maxGroups === -1 ? "Unlimited" : `${tier.maxGroups} Groups`}
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-green-500" />
                        <span className="text-sm">
                          {tier.maxMembersPerGroup === -1 ? "Unlimited" : `${tier.maxMembersPerGroup} Members/Group`}
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-green-500" />
                        <span className="text-sm">
                          {tier.historyDays === -1 ? "Lifetime" : `${tier.historyDays}-Day`} History
                        </span>
                      </li>
                      {tier.features.slice(0, 4).map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{getFeatureText(feature)}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <button
                      className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 cursor-not-allowed"
                      disabled
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      {isCurrent ? "Current Plan" : "Coming Soon"}
                    </button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* Footer Info */}
          <div className="mt-10 text-center text-sm text-muted-foreground">
            <p>
              Need help? Contact{" "}
              <a href="mailto:support@zarledger.co" className="text-primary hover:underline">
                support@zarledger.co
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
