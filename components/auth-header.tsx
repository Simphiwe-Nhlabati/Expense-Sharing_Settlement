"use client"

import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/stores/auth-store"
import { User, LogOut, LayoutDashboard } from "lucide-react"

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
      <header className="sticky top-0 z-50 w-full border-b bg-glass backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">Z</span>
            </div>
            <h1 className="text-lg font-bold text-gradient">ZAR Ledger</h1>
          </Link>
          <div className="flex items-center gap-4">
            <div className="h-8 w-20 bg-muted animate-pulse rounded-full" />
            <ModeToggle />
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-glass backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-primary/25 group-hover:scale-105 transition-transform">
            <span className="text-xs font-bold text-primary-foreground">Z</span>
          </div>
          <h1 className="text-lg font-bold text-gradient">ZAR Ledger</h1>
        </Link>
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="h-8 w-20 bg-muted animate-pulse rounded-full" />
          ) : isAuthenticated ? (
            <>
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="gap-2 rounded-full">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Profile</span>
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2 rounded-full">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2 rounded-full border-destructive/30 text-destructive hover:bg-destructive/10">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </>
          ) : (
            <>
              <Link href="/sign-in">
                <Button variant="ghost" size="sm" className="rounded-full">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="rounded-full bg-gradient-primary hover:opacity-90 transition-opacity shadow-lg shadow-primary/25">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
