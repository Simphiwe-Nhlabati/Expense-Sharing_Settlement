import { redirect } from "next/navigation"
import { JoinGroupDialog } from "@/components/features/groups/invite-code"
import { AuthHeader } from "@/components/auth-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"
import { getAuthenticatedUser } from "@/app/actions/auth"

/**
 * /join/[code] — Public invite landing page.
 *
 * - Unauthenticated → redirect to sign-in with this URL as callback.
 * - Authenticated → show invite code and "Join Group" dialog.
 */
export default async function JoinPage(props: {
  params: Promise<{ code: string }>
}) {
  const user = await getAuthenticatedUser()
  const { code } = await props.params
  const upperCode = code.toUpperCase()

  if (!user) {
    redirect(`/sign-in?redirect_url=/join/${upperCode}`)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AuthHeader />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl">You&apos;ve been invited!</CardTitle>
            <CardDescription>
              Use the code below to join this group on ZAR Ledger.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <div className="font-mono text-3xl font-black tracking-widest text-primary bg-primary/10 px-6 py-3 rounded-lg border border-primary/20">
              {upperCode}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Click below to join the group. If you&apos;re already a member, you&apos;ll be taken to the group page.
            </p>
            {/* JoinGroupDialog is a client component — it opens pre-filled */}
            <JoinGroupDialog />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
