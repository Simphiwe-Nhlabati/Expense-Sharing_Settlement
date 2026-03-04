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
import { Mail, Lock, User, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react"

export default function SignUpPage() {
  const router = useRouter()
  const { setUser, setAccessToken } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  })

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        setAccessToken(data.accessToken)
        toast.success("Account created successfully!")
        router.push("/")
      } else {
        toast.error(data.error || "Failed to create account")
      }
    } catch (error) {
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
          {/* Left side - Visual */}
          <div className="hidden md:flex flex-col items-center justify-center text-center space-y-6 p-8 animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-coral opacity-20 blur-3xl rounded-full" />
              <div className="relative h-48 w-48 rounded-3xl bg-gradient-coral flex items-center justify-center shadow-2xl shadow-brand-coral/30">
                <Sparkles className="h-24 w-24 text-white" />
              </div>
            </div>
            <div className="space-y-3 max-w-md">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Start splitting with{" "}
                <span className="text-gradient-coral">confidence</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Join thousands of South Africans who trust ZAR Ledger for fair expense sharing.
              </p>
            </div>
            
            {/* Benefits list */}
            <div className="space-y-3 pt-4 text-left">
              <BenefitItem text="Track expenses in Rands and cents" />
              <BenefitItem text="Split fairly with smart rounding" />
              <BenefitItem text="Settle debts instantly" />
              <BenefitItem text="POPIA-compliant data protection" />
            </div>
          </div>

          {/* Right side - Form */}
          <div className="order-1 md:order-2 animate-slide-up">
            <Card className="border-0 shadow-2xl bg-card">
              <CardHeader className="space-y-3 pb-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-coral mb-2">
                  <User className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold">Create your account</CardTitle>
                <CardDescription className="text-base">
                  Get started with ZAR Ledger in seconds
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={onSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium">Full Name (Optional)</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="John Doe"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="pl-11 h-12 rounded-xl"
                      />
                    </div>
                  </div>
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
                        minLength={8}
                        className="pl-11 h-12 rounded-xl"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Must be at least 8 characters
                    </p>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 rounded-xl bg-gradient-primary hover:opacity-90 transition-opacity shadow-lg shadow-primary/25" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                        Creating account...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Create Account
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </form>
                <div className="mt-6 text-center text-sm">
                  <span className="text-muted-foreground">Already have an account? </span>
                  <Link href="/sign-in" className="font-semibold text-primary hover:underline underline-offset-4">
                    Sign in
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

function BenefitItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
      </div>
      <span className="text-muted-foreground">{text}</span>
    </div>
  )
}
