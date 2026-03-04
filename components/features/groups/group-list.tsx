"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Banknote, ArrowRight } from "lucide-react"
import Link from "next/link"

async function fetchGroups(): Promise<any[]> {
  const response = await fetch("/api/groups", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to fetch groups")
  }

  return response.json()
}

export function GroupList() {
  const { data: groups, isLoading, refetch } = useQuery({
    queryKey: ["groups"],
    queryFn: fetchGroups,
    refetchOnMount: true,
  })

  // Refetch on mount
  React.useEffect(() => {
    refetch()
  }, [refetch])

  if (isLoading) {
    return <GroupListSkeleton />
  }

  if (!groups?.length) {
    return (
       <div className="text-center p-12 border-2 border-dashed rounded-2xl bg-muted/30 animate-scale-in">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Create your first group to start tracking expenses with friends, family, or colleagues.
          </p>
       </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <Link key={group.id} href={`/groups/${group.id}`}>
          <Card className="group relative overflow-hidden border-0 shadow-lg card-lift h-full bg-card">
            {/* Gradient accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <CardHeader className="pb-3 space-y-2">
              <div className="flex justify-between items-start gap-2">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold group-hover:text-primary transition-colors">
                  {group.name}
                </CardTitle>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary whitespace-nowrap">
                  {group.currency}
                </span>
              </div>
              <CardDescription className="line-clamp-2 text-sm">
                {group.description || "No description provided"}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-3">
               <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                     <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                       <Users className="h-4 w-4" />
                     </div>
                     <div>
                       <p className="font-medium text-foreground">{group.members}</p>
                       <p className="text-xs">Members</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                     <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                       <Banknote className="h-4 w-4" />
                     </div>
                     <div className="text-right">
                       <p className="font-medium text-foreground">R{group.balance}</p>
                       <p className="text-xs">Balance</p>
                     </div>
                  </div>
               </div>
               
               {/* Hover arrow indicator */}
               <div className="flex items-center justify-end text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                 <span className="text-sm font-medium mr-1">View Group</span>
                 <ArrowRight className="h-4 w-4" />
               </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

function GroupListSkeleton() {
   return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
         {[1,2,3,4,5,6].map(i => (
             <Skeleton key={i} className="h-[180px] w-full rounded-2xl" />
         ))}
      </div>
   )
}
