"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Banknote } from "lucide-react"
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
       <div className="text-center p-8 border border-dashed rounded-lg bg-muted/50">
          <p className="text-muted-foreground">No groups found. Create one to get started.</p>
       </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <Link key={group.id} href={`/groups/${group.id}`}>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center text-base">
                 {group.name}
                 <span className="text-xs font-normal px-2 py-1 bg-primary/10 text-primary rounded-full">{group.currency}</span>
              </CardTitle>
              <CardDescription className="line-clamp-1">{group.description || "No description"}</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                     <Users className="h-4 w-4" /> {group.members}
                  </div>
                  <div className="flex items-center gap-1">
                     <Banknote className="h-4 w-4" /> R{group.balance}
                  </div>
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
         {[1,2,3].map(i => (
             <Skeleton key={i} className="h-[120px] w-full rounded-xl" />
         ))}
      </div>
   )
}
