import { z } from "zod"

export const createGroupSchema = z.object({
  name: z.string().min(2, "Group name must be at least 2 characters."),
  description: z.string().optional(),
  currency: z.enum(["ZAR", "USD", "EUR"]).default("ZAR"),
})

export const createExpenseSchema = z.object({
  groupId: z.string().uuid("Valid group ID is required"),
  description: z.string().min(2, "Description is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  paidBy: z.string().min(1, "Payer is required"),
  date: z.date().default(() => new Date()),
})

export type CreateGroupInput = z.infer<typeof createGroupSchema>
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
