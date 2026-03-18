"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Users } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

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
import { createGroupSchema, type CreateGroupInput } from "@/lib/schemas"

export function CreateGroupDialog() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<CreateGroupInput>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      currency: "ZAR",
    },
  })

  async function onSubmit(data: CreateGroupInput) {
    try {
      const response = await fetch("/api/groups/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: ["groups"] })
        toast.success("Group created successfully")
        setOpen(false)
        form.reset()
      } else {
        toast.error(result.error || "Failed to create group")
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-full bg-gradient-primary hover:opacity-90 transition-opacity shadow-lg shadow-primary/25">
          <Plus className="h-4 w-4" /> New Group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[475px] rounded-2xl">
        <DialogHeader className="space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary mb-2">
            <Users className="h-6 w-6 text-primary-foreground" />
          </div>
          <DialogTitle className="text-2xl font-bold">Create Group</DialogTitle>
          <DialogDescription className="text-base">
            Start a new group to split expenses with friends, family, or colleagues.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Cape Town Trip 2026" 
                      {...field} 
                      className="h-12 rounded-xl"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="What's this group for?" 
                      {...field} 
                      className="h-12 rounded-xl"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ZAR">🇿🇦 South African Rand (ZAR)</SelectItem>
                      <SelectItem value="USD">🇺🇸 US Dollar (USD)</SelectItem>
                      <SelectItem value="EUR">🇪🇺 Euro (EUR)</SelectItem>
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
                disabled={form.formState.isSubmitting}
                className="rounded-full bg-gradient-primary hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
              >
                {form.formState.isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Creating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Group
                  </span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
