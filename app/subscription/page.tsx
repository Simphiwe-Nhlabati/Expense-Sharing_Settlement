"use client";

import { useState, useEffect } from "react";
import { AuthHeader } from "@/components/auth-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Zap, ShieldCheck, Loader2 } from "lucide-react";
import { subscriptionApi } from "@/lib/api/subscription";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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

interface Subscription {
  id: string;
  userId: string;
  tier: string;
  status: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  limits: {
    maxGroups: number;
    maxMembersPerGroup: number;
    historyDays: number;
    features: string[];
    priceZar: number;
  };
}

const TIER_ICONS: Record<string, any> = {
  BRAAI: Zap,
  HOUSEHOLD: ShieldCheck,
  AGENT: Sparkles,
};

const TIER_COLORS: Record<string, string> = {
  BRAAI: "from-gray-500 to-gray-600",
  HOUSEHOLD: "from-blue-500 to-blue-600",
  AGENT: "from-purple-500 to-purple-600",
};

export default function SubscriptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);

  useEffect(() => {
    loadSubscription();
  }, []);

  async function loadSubscription() {
    try {
      setLoading(true);
      const data = await subscriptionApi.getSubscription();
      setSubscription(data);
      
      const tiersData = await subscriptionApi.getTiers();
      setTiers(tiersData.tiers);
    } catch (error) {
      console.error("Failed to load subscription:", error);
      toast.error("Failed to load subscription details");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade(tier: string) {
    try {
      setUpgrading(tier);
      
      const result = await subscriptionApi.upgrade({
        tier: tier as "BRAAI" | "HOUSEHOLD" | "AGENT",
        successUrl: `${window.location.origin}/subscription/success`,
        cancelUrl: `${window.location.origin}/subscription/cancel`,
      });

      if (result.checkoutUrl) {
        // Redirect to Paystack checkout
        window.location.href = result.checkoutUrl;
      } else {
        toast.success(`Successfully upgraded to ${tier} tier!`);
        loadSubscription();
      }
    } catch (error: any) {
      console.error("Upgrade failed:", error);
      toast.error(error.message || "Failed to upgrade subscription");
    } finally {
      setUpgrading(null);
    }
  }

  async function handleCancel() {
    if (!confirm("Are you sure? Your subscription will remain active until the end of the billing period.")) {
      return;
    }

    try {
      setCancelling(true);
      const result = await subscriptionApi.cancel();
      toast.success(result.message);
      loadSubscription();
    } catch (error: any) {
      console.error("Cancel failed:", error);
      toast.error(error.message || "Failed to cancel subscription");
    } finally {
      setCancelling(false);
    }
  }

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

  if (loading) {
    return (
      <div className="relative flex min-h-screen flex-col bg-background">
        <AuthHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading subscription...</p>
          </div>
        </main>
      </div>
    );
  }

  const currentTier = subscription?.tier || "BRAAI";

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

          {/* Current Subscription Status */}
          {subscription && (
            <Card className="mb-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Current Subscription
                  <Badge variant={subscription.status === "ACTIVE" ? "default" : "secondary"}>
                    {subscription.status}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  You're currently on the{" "}
                  <span className="font-semibold text-primary">{currentTier}</span> tier
                  {subscription.cancelAtPeriodEnd && (
                    <span className="text-destructive ml-2">
                      • Cancels on {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "period end"}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Groups</p>
                    <p className="font-semibold">
                      {subscription.limits.maxGroups === -1 ? "Unlimited" : subscription.limits.maxGroups}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Members per Group</p>
                    <p className="font-semibold">
                      {subscription.limits.maxMembersPerGroup === -1 ? "Unlimited" : subscription.limits.maxMembersPerGroup}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">History</p>
                    <p className="font-semibold">
                      {subscription.limits.historyDays === -1 ? "Lifetime" : `${subscription.limits.historyDays} days`}
                    </p>
                  </div>
                </div>
              </CardContent>
              {subscription.status === "ACTIVE" && subscription.tier !== "BRAAI" && !subscription.cancelAtPeriodEnd && (
                <CardFooter>
                  <Button variant="outline" size="sm" onClick={handleCancel} disabled={cancelling}>
                    {cancelling ? "Cancelling..." : "Cancel Subscription"}
                  </Button>
                </CardFooter>
              )}
            </Card>
          )}

          {/* Tier Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map((tier) => {
              const Icon = TIER_ICONS[tier.tier];
              const isCurrent = tier.tier === currentTier;
              const isUpgrading = upgrading === tier.tier;

              return (
                <Card
                  key={tier.tier}
                  className={`relative flex flex-col ${
                    isCurrent ? "border-primary ring-2 ring-primary/20" : ""
                  } ${tier.popular ? "shadow-lg scale-105" : ""}`}
                >
                  {tier.popular && (
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
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">
                          {tier.maxGroups === -1 ? "Unlimited" : `${tier.maxGroups} Groups`}
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">
                          {tier.maxMembersPerGroup === -1 ? "Unlimited" : `${tier.maxMembersPerGroup} Members/Group`}
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">
                          {tier.historyDays === -1 ? "Lifetime" : `${tier.historyDays}-Day`} History
                        </span>
                      </li>
                      {tier.features.slice(0, 4).map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{getFeatureText(feature)}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={isCurrent ? "outline" : "default"}
                      disabled={isCurrent || isUpgrading}
                      onClick={() => handleUpgrade(tier.tier)}
                    >
                      {isUpgrading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : isCurrent ? (
                        "Current Plan"
                      ) : (
                        "Upgrade"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* Footer Info */}
          <div className="mt-10 text-center text-sm text-muted-foreground">
            <p>Payments securely processed by{" "}
              <a href="https://paystack.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Paystack
              </a>
            </p>
            <p className="mt-1">
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
