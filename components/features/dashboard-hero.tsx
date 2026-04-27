"use client";

import { StatCard } from "@/components/common/stat-card";
import { TrendingUp, ArrowRight, ArrowLeft } from "lucide-react";

interface DashboardHeroProps {
  stats: {
    totalBalance: number;
    youOwe: number;
    owedToYou: number;
  };
}

export function DashboardHero({ stats }: DashboardHeroProps) {
  return (
    <div className="relative mb-10 overflow-hidden border border-border/60 bg-gradient-primary">
      {/* Gold top rule */}
      <div className="h-px bg-gradient-gold opacity-60" />
      {/* Dot mesh */}
      <div className="absolute inset-0 bg-mesh opacity-30" />

      <div className="relative z-10 p-8 md:p-10">
        <div className="mb-8">
          <p className="label-mono text-white/40 mb-2">Dashboard</p>
          <h1
            className="text-3xl md:text-4xl font-bold text-white"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
          >
            Welcome Back
          </h1>
          <p className="text-white/50 text-sm mt-1">Manage your expenses with precision</p>
        </div>

        {/* Stats grid */}
        <div className="grid gap-px md:grid-cols-3 border border-white/10 overflow-hidden">
          <div className="animate-slide-up animate-stagger-1">
            <StatCard
              label="Total Balance"
              amount={stats.totalBalance}
              icon={<TrendingUp className="h-4 w-4" />}
              description="Across all groups"
            />
          </div>
          <div className="animate-slide-up animate-stagger-2">
            <StatCard
              label="You Owe"
              amount={stats.youOwe}
              icon={<ArrowRight className="h-4 w-4" />}
              colorScheme="debt"
              description="Pending settlements"
            />
          </div>
          <div className="animate-slide-up animate-stagger-3">
            <StatCard
              label="Owed to You"
              amount={stats.owedToYou}
              icon={<ArrowLeft className="h-4 w-4" />}
              colorScheme="credit"
              description="From pending settlements"
            />
          </div>
        </div>
      </div>

      {/* Corner geometry */}
      <div className="absolute -bottom-12 -right-12 w-40 h-40 border border-white/5 rotate-45" />
      <div className="absolute -bottom-6 -right-6 w-24 h-24 border border-white/5 rotate-45" />
    </div>
  );
}
