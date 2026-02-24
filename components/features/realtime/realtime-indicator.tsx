"use client"

import { useRealtimeBalance } from "@/lib/hooks/use-realtime-balance"
import { Wifi, WifiOff } from "lucide-react"
import { useState } from "react"

interface RealtimeIndicatorProps {
  groupId: string
}

/**
 * A thin client component that subscribes to the SSE feed and shows
 * a live indicator dot. No props passed down — it triggers router.refresh()
 * internally (via the hook), which re-runs the parent Server Component.
 */
export function RealtimeIndicator({ groupId }: RealtimeIndicatorProps) {
  const [connected, setConnected] = useState(false)

  useRealtimeBalance({
    groupId,
    onUpdate: () => {
      // balance_updated event received — the hook already calls router.refresh()
      // We just update UI state here
      setConnected(true)
    },
  })

  return (
    <div
      className="flex items-center gap-1.5 text-xs text-muted-foreground"
      title={connected ? "Live updates active" : "Connecting to live updates..."}
    >
      <span className={`h-2 w-2 rounded-full animate-pulse ${connected ? "bg-green-500" : "bg-yellow-400"}`} />
      <span className="hidden sm:inline">
        {connected ? "Live" : "Connecting..."}
      </span>
    </div>
  )
}
