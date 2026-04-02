"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AuthHeader } from "@/components/auth-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Mail, Lock, ArrowRight } from "lucide-react"

export default function SignInPage() {
  const router = useRouter()
  const { setUser, setAccessToken } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

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
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
          {/* Left side - Form */}
          <div className="order-2 md:order-1 animate-slide-up">
            <Card className="border-0 shadow-2xl bg-card">
              <CardHeader className="space-y-3 pb-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary mb-2">
                  <Lock className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle className="text-3xl font-bold">Welcome back</CardTitle>
                <CardDescription className="text-base">
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={onSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="pl-11 h-12 rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        className="pl-11 h-12 rounded-xl"
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 rounded-xl bg-gradient-primary hover:opacity-90 transition-opacity shadow-lg shadow-primary/25" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
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
                <div className="mt-6 text-center text-sm">
                  <span className="text-muted-foreground">Don&apos;t have an account? </span>
                  <Link href="/sign-up" className="font-semibold text-primary hover:underline underline-offset-4">
                    Sign up for free
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right side - Visual */}
          <div className="order-1 md:order-2 hidden md:flex flex-col items-center justify-center text-center space-y-6 p-8 animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl rounded-full" />
              <div className="relative h-48 w-48 rounded-3xl bg-gradient-primary flex items-center justify-center shadow-2xl shadow-primary/30">
                <Lock className="h-24 w-24 text-primary-foreground" />
              </div>
            </div>
            <div className="space-y-3 max-w-md">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Manage your expenses with{" "}
                <span className="text-emerald-300 drop-shadow-md">precision</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Track Rands, split fairly, and settle instantly. Built for South Africa, designed for trust.
              </p>
            </div>
            
            {/* Feature badges */}
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                POPIA Compliant
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Bank-Grade Security
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Real-time Sync
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
