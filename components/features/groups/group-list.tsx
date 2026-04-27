"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Banknote, ArrowRight } from "lucide-react"
import Link from "next/link"
import { formatZarAmount } from "@/lib/utils"

interface Group {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  members: number;
  balance: number;
}

async function fetchGroups(): Promise<Group[]> {
  const response = await fetch("/api/groups", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  })
  if (!response.ok) {
    if (response.status === 401) return []
    const error = await response.json().catch(() => ({ error: "Failed to fetch groups" }))
    throw new Error(error.error || "Failed to fetch groups")
  }
  const data = await response.json()
  return data.groups || []
}

export function GroupList() {
  const { data: groups, isLoading, error } = useQuery({
    queryKey: ["groups"],
    queryFn: fetchGroups,
    refetchOnMount: true,
  })

  if (isLoading) return <GroupListSkeleton />

  if (error) {
    return (
      <div className="border border-dashed border-destructive/40 p-12 text-center animate-scale-in">
        <div className="inline-flex h-10 w-10 items-center justify-center border border-destructive/30 text-destructive mb-4">
          <Users className="h-5 w-5" />
        </div>
        <p className="label-mono text-destructive mb-2">Failed to load groups</p>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-4">
          {error instanceof Error ? error.message : "An unexpected error occurred"}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-xs font-medium text-accent hover:underline underline-offset-4"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!groups?.length) {
    return (
      <div className="border border-dashed border-border/60 p-16 text-center animate-scale-in">
        <div className="inline-flex h-10 w-10 items-center justify-center border border-border/60 text-muted-foreground mb-4">
          <Users className="h-5 w-5" />
        </div>
        <p className="label-mono text-muted-foreground mb-2">No groups yet</p>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Create your first group to start tracking expenses with friends, family, or colleagues.
        </p>
      </div>
    )
  }

  return (
    <div className="border border-border/60 divide-y divide-border/60 md:grid md:grid-cols-2 md:divide-y-0 md:divide-x lg:grid-cols-3">
      {groups.map((group, i) => (
        <Link key={group.id} href={`/groups/${group.id}`}>
          <div
            className="group relative p-6 hover:bg-secondary/40 transition-colors animate-scale-in overflow-hidden h-full"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            {/* Gold top accent on hover */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-gold opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Group initial */}
            <div className="flex items-start justify-between mb-4">
              <div className="relative h-10 w-10 flex items-center justify-center border border-border/60 group-hover:border-accent/40 transition-colors">
                <div className="absolute inset-1 border border-border/30 group-hover:border-accent/20 transition-colors" />
                <span
                  className="relative text-sm font-bold text-muted-foreground group-hover:text-accent transition-colors"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {group.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="label-mono text-muted-foreground">{group.currency}</span>
            </div>

            {/* Name & description */}
            <h3
              className="text-base font-semibold mb-1 group-hover:text-accent transition-colors"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {group.name}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-5">
              {group.description || "No description provided"}
            </p>

            {/* Stats row */}
            <div className="flex items-center justify-between pt-4 border-t border-border/40">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span className="font-medium text-foreground">{group.members}</span>
                <span>members</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Banknote className="h-3.5 w-3.5" />
                <span className="currency font-medium text-foreground">{formatZarAmount(group.balance)}</span>
              </div>
            </div>

            {/* Hover arrow */}
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
              <ArrowRight className="h-4 w-4 text-accent" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

function GroupListSkeleton() {
  return (
    <div className="border border-border/60 divide-y divide-border/60 md:grid md:grid-cols-2 md:divide-y-0 md:divide-x lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="p-6 space-y-3">
          <Skeleton className="h-10 w-10 rounded-none" />
          <Skeleton className="h-4 w-3/4 rounded-none" />
          <Skeleton className="h-3 w-full rounded-none" />
          <Skeleton className="h-3 w-2/3 rounded-none" />
        </div>
      ))}
    </div>
  )
}
