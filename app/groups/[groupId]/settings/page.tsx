import { AuthHeader } from "@/components/auth-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Trash2, Save, ArrowLeft, Share2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGroup } from "@/app/actions/groups";
import { InviteCodeCard } from "@/components/features/groups/invite-code";

export default async function GroupSettingsPage(props: { params: Promise<{ groupId: string }> }) {
  const params = await props.params;
  const { groupId } = params;
  const group = await getGroup(groupId);

  if (!group) return notFound();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AuthHeader />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
            <Link href={`/groups/${groupId}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Group
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Group Settings</h1>
            <p className="text-muted-foreground">Manage settings for {group.name}</p>
        </div>

        <div className="space-y-6">
            {/* General Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>General</CardTitle>
                    <CardDescription>Update group details and information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Group Name</Label>
                        <Input id="name" defaultValue={group.name} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" defaultValue={group.description || ""} />
                    </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
                </CardFooter>
            </Card>

            {/* ✅ Feature 2: Invite Code */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Share2 className="h-5 w-5 text-primary" />
                        <CardTitle>Invite Members</CardTitle>
                    </div>
                    <CardDescription>
                        Share the invite code or link below. Anyone with this code can join your group.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <InviteCodeCard inviteCode={group.inviteCode} />
                </CardContent>
            </Card>

            {/* Members List */}
            <Card>
                <CardHeader>
                    <CardTitle>Members</CardTitle>
                    <CardDescription>Current members of this group.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                   {group.members.map((member) => (
                       <div key={member.id} className="flex items-center justify-between p-3 border rounded-md">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">
                                    {member.fullName?.substring(0, 2).toUpperCase() || "U"}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{member.fullName}</span>
                                    <span className="text-xs text-muted-foreground">{member.role} • {member.email}</span>
                                </div>
                            </div>
                        </div>
                   ))}
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>Irreversible actions for this group.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="destructive" className="w-full">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Group
                    </Button>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
