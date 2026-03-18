"use client"

import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/stores/auth-store"
import { User, LogOut, LayoutDashboard } from "lucide-react"

export function AuthHeader() {
  const { isAuthenticated, isLoading, setUser, logout, accessToken } = useAuthStore()

  useEffect(() => {
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
      } catch {
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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-glass backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md shadow-primary/30 group-hover:scale-110 transition-transform duration-200">
            <span className="text-sm font-bold text-primary-foreground" style={{fontFamily: 'var(--font-display)'}}>Z</span>
          </div>
          <h1 className="text-lg font-bold text-gradient hidden sm:block">ZAR Ledger</h1>
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
