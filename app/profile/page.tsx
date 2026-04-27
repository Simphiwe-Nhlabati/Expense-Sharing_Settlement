import { AuthHeader } from "@/components/auth-header";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { getAuthenticatedUser } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { User, Mail, Shield, Bell, Globe } from "lucide-react";

export default async function ProfilePage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AuthHeader />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl relative z-10">
        {/* Header */}
        <div className="mb-8">
          <p className="label-mono text-muted-foreground mb-1">Account</p>
          <h1
            className="text-3xl font-bold"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
          >
            Profile
          </h1>
        </div>

        <div className="gold-rule mb-8" />

        <div className="space-y-0 border border-border/60 divide-y divide-border/60">

          {/* Personal Information */}
          <ProfileSection
            icon={<User className="h-4 w-4" />}
            title="Personal Information"
            description="Your contact details and profile."
          >
            <div className="space-y-4">
              <FieldRow
                label="Email Address"
                icon={<Mail className="h-3.5 w-3.5" />}
              >
                <Input
                  value={user.email}
                  disabled
                  className="h-10 rounded-none border-border/60 bg-secondary/40 text-sm"
                />
              </FieldRow>
              <FieldRow
                label="Full Name"
                icon={<User className="h-3.5 w-3.5" />}
              >
                <Input
                  value={user.fullName || ""}
                  disabled
                  className="h-10 rounded-none border-border/60 bg-secondary/40 text-sm"
                />
              </FieldRow>
            </div>
          </ProfileSection>

          {/* Security */}
          <ProfileSection
            icon={<Shield className="h-4 w-4" />}
            title="Security"
            description="Protect your account."
          >
            <div className="flex items-center justify-between p-4 bg-secondary/30 border border-border/40">
              <div>
                <p className="text-sm font-medium">Password</p>
                <p className="text-xs text-muted-foreground mt-0.5">Last changed 30 days ago</p>
              </div>
              <span className="currency text-muted-foreground text-sm tracking-widest">••••••••</span>
            </div>
          </ProfileSection>

          {/* Preferences */}
          <ProfileSection
            icon={<Globe className="h-4 w-4" />}
            title="Preferences"
            description="Customize your experience."
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-secondary/30 border border-border/40">
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    Currency
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Default for new groups.</p>
                </div>
                <span className="label-mono text-accent">ZAR (R)</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-secondary/30 border border-border/40">
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                    Notifications
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Email updates about expenses.</p>
                </div>
                <span className="label-mono text-emerald-500">Enabled</span>
              </div>
            </div>
          </ProfileSection>

          {/* Account Info */}
          <ProfileSection
            icon={<Shield className="h-4 w-4" />}
            title="Account Information"
            description="Details about your account."
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-secondary/30 border border-border/40">
                <p className="label-mono text-muted-foreground mb-1">Account Type</p>
                <p className="text-sm font-semibold">Free</p>
              </div>
              <div className="p-4 bg-secondary/30 border border-border/40">
                <p className="label-mono text-muted-foreground mb-1">Member Since</p>
                <p className="text-sm font-semibold">
                  {new Date().toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
          </ProfileSection>
        </div>
      </main>
    </div>
  );
}

function ProfileSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-8 w-8 flex items-center justify-center border border-border/60 text-accent">
          {icon}
        </div>
        <div>
          <h2
            className="text-sm font-semibold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function FieldRow({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="label-mono text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </Label>
      {children}
    </div>
  );
}
