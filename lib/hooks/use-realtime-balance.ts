"use client"

import { useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface UseRealtimeBalanceOptions {
  groupId: string
  /** Called when `balance_updated` event is received */
  onUpdate?: () => void
  enabled?: boolean
}

/**
 * useRealtimeBalance
 *
 * Connects to the SSE endpoint at /api/realtime/:groupId and listens
 * for `balance_updated` events. When received, it calls `onUpdate`
 * (defaults to router.refresh() to re-fetch Server Component data).
 *
 * Auto-reconnects with exponential back-off (capped at 30s) if the
 * connection is lost.
 */
export function useRealtimeBalance({
  groupId,
  onUpdate,
  enabled = true,
}: UseRealtimeBalanceOptions) {
  const router = useRouter()
  const esRef = useRef<EventSource | null>(null)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryDelay = useRef(2000)

  const connect = useCallback(() => {
    if (!enabled || !groupId) return

    // Clean up any existing connection
    esRef.current?.close()

    const url = `/api/realtime/${groupId}`
    const es = new EventSource(url)
    esRef.current = es

    es.addEventListener("connected", () => {
      retryDelay.current = 2000 // reset back-off on successful connection
    })

    es.addEventListener("balance_updated", () => {
      router.refresh() // Always re-run Server Components for fresh data
      if (onUpdate) {
        onUpdate()
      }
      toast.info("Balance updated", {
        description: "A new transaction was recorded in this group.",
        duration: 3000,
      })
    })

    es.addEventListener("error", () => {
      es.close()
      esRef.current = null

      // Exponential back-off reconnect (max 30s)
      const delay = Math.min(retryDelay.current, 30000)
      retryDelay.current = delay * 2
      retryRef.current = setTimeout(connect, delay)
    })
  }, [groupId, enabled, onUpdate, router])

  useEffect(() => {
    connect()

    return () => {
      esRef.current?.close()
      esRef.current = null
      if (retryRef.current) clearTimeout(retryRef.current)
    }
  }, [connect])
}
