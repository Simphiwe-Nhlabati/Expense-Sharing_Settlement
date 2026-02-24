import { AuthHeader } from "@/components/auth-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { getAuthenticatedUser } from "@/app/actions/auth";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AuthHeader />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
            <p className="text-muted-foreground">Manage your account and preferences.</p>
        </div>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Your contact details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Email</Label>
                        <Input value={user.email} disabled />
                    </div>
                    <div className="grid gap-2">
                        <Label>Full Name</Label>
                        <Input value={user.fullName || ""} disabled />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                    <CardDescription>Customize your experience.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                         <div className="space-y-0.5">
                              <Label>Currency</Label>
                              <div className="text-sm text-muted-foreground">Default currency for new groups.</div>
                         </div>
                         <Button variant="outline" size="sm">ZAR (R)</Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                         <div className="space-y-0.5">
                              <Label>Notifications</Label>
                              <div className="text-sm text-muted-foreground">Receive email updates about expenses.</div>
                         </div>
                         <Button variant="outline" size="sm">Enabled</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
