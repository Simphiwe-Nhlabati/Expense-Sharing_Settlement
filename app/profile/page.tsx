import { AuthHeader } from "@/components/auth-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { getAuthenticatedUser } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { User, Mail, Shield, Bell, Globe } from "lucide-react";

export default async function ProfilePage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AuthHeader />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-10 space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
            <p className="text-muted-foreground">Manage your account and preferences.</p>
        </div>

        <div className="space-y-6">
            {/* Personal Information */}
            <Card className="border-0 shadow-lg bg-card">
                <CardHeader className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                      <User className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>Your contact details and profile information.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="grid gap-2">
                        <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          Email Address
                        </Label>
                        <Input 
                          id="email"
                          value={user.email} 
                          disabled 
                          className="h-12 rounded-xl bg-muted/50"
                        />
                    </div>
                    <Separator />
                    <div className="grid gap-2">
                        <Label htmlFor="fullName" className="text-sm font-medium flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          Full Name
                        </Label>
                        <Input 
                          id="fullName"
                          value={user.fullName || ""} 
                          disabled 
                          className="h-12 rounded-xl bg-muted/50"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Security */}
            <Card className="border-0 shadow-lg bg-card">
                <CardHeader className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-coral flex items-center justify-center">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle>Security</CardTitle>
                      <CardDescription>Protect your account with strong security.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                         <div className="space-y-0.5">
                              <Label className="text-base font-medium">Password</Label>
                              <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
                         </div>
                         <span className="text-xs text-muted-foreground">••••••••</span>
                    </div>
                </CardContent>
            </Card>

            {/* Preferences */}
            <Card className="border-0 shadow-lg bg-card">
                <CardHeader className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-emerald flex items-center justify-center">
                      <Globe className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle>Preferences</CardTitle>
                      <CardDescription>Customize your experience.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                         <div className="space-y-0.5 flex-1">
                              <Label className="text-base font-medium flex items-center gap-2">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                Currency
                              </Label>
                              <p className="text-sm text-muted-foreground">Default currency for new groups.</p>
                         </div>
                         <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary">
                           ZAR (R)
                         </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                         <div className="space-y-0.5 flex-1">
                              <Label className="text-base font-medium flex items-center gap-2">
                                <Bell className="h-4 w-4 text-muted-foreground" />
                                Notifications
                              </Label>
                              <p className="text-sm text-muted-foreground">Receive email updates about expenses.</p>
                         </div>
                         <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-500/10 text-emerald-600">
                           Enabled
                         </span>
                    </div>
                </CardContent>
            </Card>

            {/* Account Info */}
            <Card className="border-0 shadow-lg bg-card">
                <CardHeader className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle>Account Information</CardTitle>
                      <CardDescription>Details about your account.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-muted/30">
                        <Label className="text-xs text-muted-foreground">Account Type</Label>
                        <p className="text-sm font-semibold mt-1">Free</p>
                      </div>
                      <div className="p-4 rounded-xl bg-muted/30">
                        <Label className="text-xs text-muted-foreground">Member Since</Label>
                        <p className="text-sm font-semibold mt-1">
                          {new Date().toLocaleDateString("en-ZA", { month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
