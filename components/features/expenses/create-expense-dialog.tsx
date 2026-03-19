"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon, Loader2, Plus, Receipt, User, DollarSign } from "lucide-react"
import { format } from "date-fns"

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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { createExpenseSchema, type CreateExpenseInput } from "@/lib/schemas"
import { createExpense } from "@/app/actions/expenses"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CreateExpenseDialogProps {
    groupId: string;
    members?: { id: string; fullName: string | null }[];
}

export function CreateExpenseDialog({ groupId, members = [] }: CreateExpenseDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const form = useForm<CreateExpenseInput>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      description: "",
      amount: 0,
      groupId: groupId,
      paidBy: "",
      date: new Date(),
    } as CreateExpenseInput,
  })

  async function onSubmit(data: CreateExpenseInput) {
    setIsPending(true)
    try {
      const result = await createExpense(data)
       if (result.success) {
        toast.success("Expense added successfully")
        setOpen(false)
        form.reset()
      } else {
        toast.error(result.error as string)
      }
    } catch {
       toast.error("Something went wrong")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full bg-gradient-primary hover:opacity-90 transition-opacity shadow-lg shadow-primary/25">
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[475px] rounded-2xl">
        <DialogHeader className="space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary mb-2">
            <Receipt className="h-6 w-6 text-primary-foreground" />
          </div>
          <DialogTitle className="text-2xl font-bold">Add Expense</DialogTitle>
          <DialogDescription className="text-base">
            Record a new expense for this group.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Dinner at Moyo" 
                      {...field} 
                      className="h-12 rounded-xl"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (R)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                            className="pl-10 h-12 rounded-xl"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal h-12 rounded-xl",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
                control={form.control}
                name="paidBy"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Paid By</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger className="h-12 rounded-xl">
                            <SelectValue placeholder="Select who paid" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {members.map(member => (
                                <SelectItem key={member.id} value={member.id}>
                                    <span className="flex items-center gap-2">
                                      <User className="h-4 w-4" />
                                      {member.fullName || "Unknown Member"}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
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
                type="submit" 
                disabled={isPending}
                className="rounded-full bg-gradient-primary hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Expense
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
