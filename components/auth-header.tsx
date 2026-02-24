"use client"

import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/stores/auth-store"

export function AuthHeader() {
  const { isAuthenticated, isLoading, setUser, logout, accessToken } = useAuthStore()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    // Check authentication status on mount
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          headers: {
            ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
          },
        })

        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        } else {
          setUser(null)
        }
      } catch (error) {
        setUser(null)
      }
    }

    checkAuth()
  }, [setUser, accessToken])

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/sign-out", { method: "POST" })
      logout()
      window.location.reload()
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  // During SSR or before mount, show loading state
  if (!isMounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">ZAR Ledger</h1>
          </Link>
          <div className="flex items-center gap-4">
            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            <ModeToggle />
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">ZAR Ledger</h1>
        </Link>
        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
          ) : isAuthenticated ? (
            <>
              <Link href="/profile">
                <Button variant="ghost" size="sm">Profile</Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/sign-in">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button variant="default" size="sm">Sign Up</Button>
              </Link>
            </>
          )}
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
