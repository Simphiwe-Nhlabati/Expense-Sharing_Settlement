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
import { Loader2, Link2, Copy, Check } from "lucide-react"
import { joinGroupByCode } from "@/app/actions/groups"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface InviteCodeCardProps {
  inviteCode: string
  groupId: string
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
    <div className="space-y-3">
      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border font-mono text-lg tracking-widest justify-center font-bold text-primary">
        {inviteCode}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Share this code or the link below with friends to invite them.
      </p>
      <div className="flex gap-2">
        <Input
          readOnly
          value={shareUrl}
          className="font-mono text-xs"
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopy}
          title="Copy invite link"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
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
            ? "You are already a member of this group!"
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
          <Button variant="outline" id="join-group-btn">
            <Link2 className="mr-2 h-4 w-4" />
            Join Group
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Join a Group</DialogTitle>
          <DialogDescription>
            Enter the invite code shared with you (e.g.{" "}
            <span className="font-mono font-bold">ABCD-EFGH</span>).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          <Label htmlFor="invite-code">Invite Code</Label>
          <Input
            id="invite-code"
            placeholder="XXXX-XXXX"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            className="font-mono tracking-widest text-center text-lg uppercase"
            maxLength={9}
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button
            onClick={handleJoin}
            disabled={isPending || code.trim().length < 9}
            id="join-group-submit"
            className="w-full"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Join Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
