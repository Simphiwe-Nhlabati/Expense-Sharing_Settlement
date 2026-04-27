"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AuthHeader } from "@/components/auth-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Mail, Lock, ArrowRight } from "lucide-react"

export default function SignInPage() {
  const router = useRouter()
  const { setUser, setAccessToken } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({ email: "", password: "" })

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (response.ok) {
        setUser(data.user)
        setAccessToken(data.accessToken)
        toast.success("Welcome back!")
        router.push("/")
      } else {
        toast.error(data.error || "Failed to sign in")
      }
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AuthHeader />
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-0 border border-border/60 overflow-hidden">

          {/* Left — branding panel */}
          <div className="hidden md:flex flex-col justify-between bg-gradient-primary p-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-mesh opacity-30" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-gold opacity-60" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-12">
                <div className="relative h-8 w-8 flex items-center justify-center">
                  <div className="absolute inset-0 rotate-45 border-2 border-accent" />
                  <span className="relative text-xs font-bold text-accent" style={{ fontFamily: "var(--font-display)" }}>Z</span>
                </div>
                <span className="label-mono text-white/60">ZAR Ledger</span>
              </div>

              <h2
                className="text-3xl font-bold text-white mb-4 leading-tight"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
              >
                Manage your<br />expenses with<br />
                <span className="text-accent">precision.</span>
              </h2>
              <p className="text-white/50 text-sm leading-relaxed max-w-xs">
                Track Rands, split fairly, and settle instantly. Built for South Africa, designed for trust.
              </p>
            </div>

            <div className="relative z-10 space-y-3">
              {["POPIA Compliant", "Bank-Grade Security", "Real-time Sync"].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span className="text-xs text-white/50">{item}</span>
                </div>
              ))}
            </div>

            {/* Corner geometry */}
            <div className="absolute -bottom-10 -right-10 w-36 h-36 border border-white/5 rotate-45" />
          </div>

          {/* Right — form */}
          <div className="bg-card p-8 md:p-10 animate-slide-up">
            <div className="mb-8">
              <p className="label-mono text-muted-foreground mb-2">Welcome back</p>
              <h1
                className="text-2xl font-bold"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
              >
                Sign In
              </h1>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="label-mono text-muted-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="pl-10 h-11 rounded-none border-border/60 focus:border-accent focus-visible:ring-0 focus-visible:border-accent transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="label-mono text-muted-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="pl-10 h-11 rounded-none border-border/60 focus:border-accent focus-visible:ring-0 focus-visible:border-accent transition-colors"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-none bg-accent text-accent-foreground hover:bg-accent/90 transition-colors text-sm font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent-foreground border-t-transparent" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border/60 text-sm text-center">
              <span className="text-muted-foreground">Don&apos;t have an account? </span>
              <Link href="/sign-up" className="font-semibold text-accent hover:underline underline-offset-4">
                Sign up free
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
