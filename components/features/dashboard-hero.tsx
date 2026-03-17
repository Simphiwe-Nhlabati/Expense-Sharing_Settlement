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
    <div className="relative mb-12 overflow-hidden rounded-3xl bg-gradient-primary p-8 md:p-12">
      <div className="absolute inset-0 bg-mesh opacity-50" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="heading-section text-white drop-shadow-lg">
            Welcome Back
          </h1>
          <p className="text-white/80 text-base font-medium">
            Manage your expenses with precision
          </p>
        </div>

        {/* Stats Grid with Staggered Animation */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="animate-slide-up animate-stagger-1">
            <StatCard
              label="Total Balance"
              amount={stats.totalBalance}
              icon={<TrendingUp className="h-5 w-5" />}
              description="Across all groups"
            />
          </div>
          
          <div className="animate-slide-up animate-stagger-2">
            <StatCard
              label="You Owe"
              amount={stats.youOwe}
              icon={<ArrowRight className="h-5 w-5" />}
              colorScheme="debt"
              description="Pending settlements"
            />
          </div>
          
          <div className="animate-slide-up animate-stagger-3">
            <StatCard
              label="Owed to You"
              amount={stats.owedToYou}
              icon={<ArrowLeft className="h-5 w-5" />}
              colorScheme="credit"
              description="From pending settlements"
            />
          </div>
        </div>
      </div>

      {/* Decorative background elements */}
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
    </div>
  );
}
