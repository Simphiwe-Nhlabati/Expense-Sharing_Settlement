"use client"

import { useRealtimeBalance } from "@/lib/hooks/use-realtime-balance"
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
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
      title={connected ? "Live updates active" : "Connecting to live updates..."}
    >
      <span className={`relative flex h-2.5 w-2.5`}>
        {connected && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${connected ? "bg-emerald-500" : "bg-yellow-400"}`} />
      </span>
      <span className="hidden sm:inline">
        {connected ? "Live Updates" : "Connecting..."}
      </span>
    </div>
  )
}
