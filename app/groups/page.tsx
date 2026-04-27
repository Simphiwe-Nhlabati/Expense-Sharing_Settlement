import { AuthHeader } from "@/components/auth-header";
import { CreateGroupDialog } from "@/components/features/groups/create-group-dialog";
import { GroupList } from "@/components/features/groups/group-list";

export default async function GroupsIndexPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AuthHeader />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-6xl relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="label-mono text-muted-foreground mb-1">Shared Ledgers</p>
            <h1
              className="text-3xl font-bold"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
            >
              Your Groups
            </h1>
          </div>
          <CreateGroupDialog />
        </div>

        <div className="gold-rule mb-8" />
        <GroupList />
      </main>
    </div>
  );
}
