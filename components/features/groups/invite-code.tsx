"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Link2, Copy, Check, Users } from "lucide-react"
import { joinGroupByCode } from "@/app/actions/groups"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface InviteCodeCardProps {
  inviteCode: string
  groupId?: string
}

/** Displays the invite code with a copy button — used on the settings page */
export function InviteCodeCard({ inviteCode, groupId }: InviteCodeCardProps) {
  const [copied, setCopied] = useState(false)

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${inviteCode}`
      : `/join/${inviteCode}`

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success("Invite link copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-gradient-primary rounded-xl border-0 shadow-lg justify-center">
        <span className="font-mono text-2xl tracking-widest font-bold text-primary-foreground">
          {inviteCode}
        </span>
      </div>
      <p className="text-sm text-muted-foreground text-center">
        Share this code or the link below with friends to invite them.
      </p>
      <div className="flex gap-3">
        <Input
          readOnly
          value={shareUrl}
          className="font-mono text-xs rounded-xl h-11 bg-muted/50"
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopy}
          title="Copy invite link"
          className={cn(
            "rounded-full transition-all",
            copied && "bg-emerald-500 text-white border-emerald-500"
          )}
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

/** Dialog to join a group by entering an invite code */
export function JoinGroupDialog({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleJoin() {
    if (!code.trim()) return

    startTransition(async () => {
      const result = await joinGroupByCode(code)

      if (result.success) {
        toast.success(
          result.data?.alreadyMember
            ? "You're already a member of this group!"
            : "Joined group successfully!"
        )
        setOpen(false)
        setCode("")
        router.push(`/groups/${result.data?.groupId}`)
      } else {
        toast.error(result.error || "Invalid invite code")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="outline" className="rounded-full border-2" id="join-group-btn">
            <Link2 className="mr-2 h-4 w-4" />
            Join Group
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] rounded-2xl">
        <DialogHeader className="space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary mb-2">
            <Users className="h-6 w-6 text-primary-foreground" />
          </div>
          <DialogTitle className="text-2xl font-bold">Join a Group</DialogTitle>
          <DialogDescription className="text-base">
            Enter the invite code shared with you to join an existing group.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <Label htmlFor="invite-code" className="text-sm font-medium">Invite Code</Label>
          <Input
            id="invite-code"
            placeholder="XXXX-XXXX"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            className="font-mono tracking-widest text-center text-xl uppercase rounded-xl h-14"
            maxLength={9}
            autoFocus
          />
        </div>

        <DialogFooter className="pt-4">
          <Button 
            type="button"
            variant="outline" 
            onClick={() => setOpen(false)}
            className="rounded-full"
          >
            Cancel
          </Button>
          <Button
            onClick={handleJoin}
            disabled={isPending || code.trim().length < 9}
            id="join-group-submit"
            className="rounded-full bg-gradient-primary hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Link2 className="mr-2 h-4 w-4" />
            Join Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
