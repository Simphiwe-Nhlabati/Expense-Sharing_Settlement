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
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-glass backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative h-8 w-8 flex items-center justify-center">
            {/* Gold diamond mark */}
            <div className="absolute inset-0 rotate-45 border-2 border-accent group-hover:scale-110 transition-transform duration-200" />
            <span
              className="relative text-xs font-bold text-accent"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Z
            </span>
          </div>
          <span
            className="text-sm font-semibold tracking-widest uppercase hidden sm:block"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "0.15em" }}
          >
            ZAR Ledger
          </span>
        </Link>

        {/* Nav */}
        <div className="flex items-center gap-1">
          {isLoading ? (
            <div className="h-7 w-24 bg-muted animate-pulse rounded" />
          ) : isAuthenticated ? (
            <>
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="gap-2 text-xs rounded-none border-b-2 border-transparent hover:border-accent hover:bg-transparent transition-all">
                  <User className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Profile</span>
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2 text-xs rounded-none border-b-2 border-transparent hover:border-accent hover:bg-transparent transition-all">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="gap-2 text-xs rounded-none border-b-2 border-transparent hover:border-destructive hover:text-destructive hover:bg-transparent transition-all"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </>
          ) : (
            <>
              <Link href="/sign-in">
                <Button variant="ghost" size="sm" className="text-xs rounded-none border-b-2 border-transparent hover:border-accent hover:bg-transparent transition-all">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button
                  size="sm"
                  className="ml-2 text-xs rounded-none bg-accent text-accent-foreground hover:bg-accent/90 transition-colors shadow-none"
                >
                  Get Started
                </Button>
              </Link>
            </>
          )}
          <div className="ml-2 pl-2 border-l border-border/60">
            <ModeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
