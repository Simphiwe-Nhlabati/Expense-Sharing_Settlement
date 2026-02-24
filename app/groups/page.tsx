import { AuthHeader } from "@/components/auth-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreateGroupDialog } from "@/components/features/groups/create-group-dialog";
import { GroupList } from "@/components/features/groups/group-list";
import { Search } from "lucide-react";

export default async function GroupsIndexPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AuthHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Your Groups</h1>
                <p className="text-muted-foreground">Manage your shared expenses.</p>
            </div>
            <CreateGroupDialog />
        </div>

        <div className="relative mb-6">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search groups..." className="pl-9 max-w-sm" />
        </div>

        <GroupList />
      </main>
    </div>
  );
}
