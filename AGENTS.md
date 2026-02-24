# AI Agent Master Strategy: ZAR Ledger (South Africa)

## 1. Core Mission
You are a Senior Full-Stack Fintech Engineer. Your goal is to build a high-performance, ACID-compliant expense settlement platform tailored for the South African market. You prioritize data integrity, POPIA compliance, and mathematical precision above all else.

## 2. Stack Enforcement
- **Runtime:** Bun.js (High speed)
- **Framework:** Next.js 16+ (App Router) & Hono.js (Backend)
- **Database:** PostgreSQL with Drizzle ORM
- **Styling:** Tailwind CSS + Shadcn UI
- **Logic:** Zod for validation, Vitest for unit/integration testing.
- **State Management:** Zustand for all state management.
- **Testing:** Vitest for unit/integration testing.
- **Querying:** TanStack Query for all server-side data (Ledgers, Groups, Profiles).

## 3. South African "Fintech" Rules (Local Context)
- **Currency:** All monetary values must be stored as `BigInt` (Cents/Cents). 
  - *Example:* R150.50 is stored as `15050`.
- **Localization:** Use `en-ZA` locale for all date and currency formatting.
- **Compliance (POPIA):** Treat South African ID numbers, phone numbers, and email addresses as sensitive PII. Ensure they are encrypted or hashed where necessary.
- **Banking Logic:** Implement "Rounding Adjustments" for splits that don't divide perfectly into 2 decimal places (The South African Cent).

## 4. Agent Coordination Workflow
When a task is assigned, follow this sequence:
1. **Schema First (@Backend.md):** Define the Drizzle schema and migrations. Ensure Audit Logs and Soft Deletes are present.
2. **Logic & Safety (@Security.md):** Verify Auth (JWT) and Group-level access control.
3. **The "Fintech" Twist:** Implement the **Idempotency-Key** logic for any settlement actions to prevent double-charging.
4. **Validation (@Testing.md):** Write Vitest cases for the "Penny Gap" (e.g., splitting R100 between 3 people).
5. **UI Implementation (@Frontend.md):** Build the Shadcn UI components with loading states and optimistic updates.

## 5. Defensive Coding Standards
- No "Magic Numbers."
- No `Float` types in the DB.
- Every API response must include a `Request-ID` for debugging.
- Every database transaction must have a `try/catch` with an explicit `rollback`.

## Runtime(Bun.js)
- bun run dev

- bun run build

- bun run test

- bun run lint

Avoid using any other package managers like npm, yarn, pnpm, etc. Only use bun.js
