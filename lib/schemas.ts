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
  date: z.date().optional().default(() => new Date()),
})

// Use z.input for form input types (what the user types)
// Use z.output for output types (what the schema returns after parsing)
export type CreateGroupInput = z.input<typeof createGroupSchema>
export type CreateGroupOutput = z.output<typeof createGroupSchema>
export type CreateExpenseInput = z.input<typeof createExpenseSchema>
export type CreateExpenseOutput = z.output<typeof createExpenseSchema>
