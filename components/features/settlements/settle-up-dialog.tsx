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
import { Loader2, Check, ArrowRightLeft, User, DollarSign } from "lucide-react"
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
          toast.success("Settlement recorded successfully!")
          setOpen(false)
          if (onSuccess) onSuccess()
      } else {
          toast.error("Failed to record settlement.")
      }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full border-2">Settle Up</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[475px] rounded-2xl">
        <DialogHeader className="space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-emerald mb-2">
            <ArrowRightLeft className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold">Settle Debts</DialogTitle>
          <DialogDescription className="text-base">
            Record a payment to clear your balance.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
             <div className="flex justify-center p-8">
               <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
        ) : debts.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
               <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                 <Check className="h-8 w-8 text-emerald-500" />
               </div>
               <p className="text-muted-foreground">You don&apos;t owe anyone in this group!</p>
             </div>
        ) : (
            <div className="grid gap-5 py-2">
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Pay To</Label>
                    <Select onValueChange={setSelectedDebtId} value={selectedDebtId}>
                        <SelectTrigger className="h-12 rounded-xl">
                            <SelectValue placeholder="Select who to pay" />
                        </SelectTrigger>
                        <SelectContent>
                            {debts.map(debt => (
                                <SelectItem key={debt.userId} value={debt.userId}>
                                    <span className="flex items-center gap-2">
                                      <User className="h-4 w-4" />
                                      {debt.name}
                                      <span className="text-muted-foreground ml-1">
                                        (Owe {formatCurrency(debt.amount)})
                                      </span>
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Amount</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                          type="number"
                          value={amount}
                          onChange={e => setAmount(parseFloat(e.target.value))}
                          placeholder="0.00"
                          className="pl-10 h-12 rounded-xl"
                      />
                    </div>
                </div>
            </div>
        )}

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
            onClick={handleSettle} 
            disabled={isSubmitting || debts.length === 0}
            className="rounded-full bg-gradient-emerald hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/25"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Check className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
