"use client"

import { useState, useEffect } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Check } from "lucide-react"
import { settleDebt, getDebts } from "@/app/actions/settlements"
import { formatCurrency } from "@/lib/utils"

interface SettleUpDialogProps {
    groupId: string;
    onSuccess?: () => void;
}

export function SettleUpDialog({ groupId, onSuccess }: SettleUpDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [debts, setDebts] = useState<{ userId: string, name: string, amount: number }[]>([])
  const [selectedDebtId, setSelectedDebtId] = useState<string>("")
  const [amount, setAmount] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch debts when dialog opens
  useEffect(() => {
    if (open) {
        setLoading(true)
        getDebts(groupId).then((data) => {
            setDebts(data)
            setLoading(false)
        })
    }
  }, [open, groupId])

  // Update amount when debt selected
  useEffect(() => {
      if (selectedDebtId) {
          const debt = debts.find(d => d.userId === selectedDebtId)
          if (debt) setAmount(debt.amount / 100)
      }
  }, [selectedDebtId, debts])

  async function handleSettle() {
      if (!selectedDebtId || amount <= 0) return

      setIsSubmitting(true)
      const result = await settleDebt(groupId, selectedDebtId, amount)
      setIsSubmitting(false)

      if (result.success) {
          toast.success("Settlement recorded!")
          setOpen(false)
          if (onSuccess) onSuccess()
      } else {
          toast.error("Failed to record settlement.")
      }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Settle Up</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settle Debts</DialogTitle>
          <DialogDescription>
            Record a payment to clear your balance.
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
             <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
        ) : debts.length === 0 ? (
             <p className="text-center text-muted-foreground p-4">You don't owe anyone in this group!</p>
        ) : (
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label>Pay To</Label>
                    <Select onValueChange={setSelectedDebtId} value={selectedDebtId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select who to pay" />
                        </SelectTrigger>
                        <SelectContent>
                            {debts.map(debt => (
                                <SelectItem key={debt.userId} value={debt.userId}>
                                    {debt.name} (Owe {formatCurrency(debt.amount)})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input 
                        type="number" 
                        value={amount} 
                        onChange={e => setAmount(parseFloat(e.target.value))} 
                        placeholder="0.00"
                    />
                </div>
            </div>
        )}

        <DialogFooter>
          <Button onClick={handleSettle} disabled={isSubmitting || debts.length === 0}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
