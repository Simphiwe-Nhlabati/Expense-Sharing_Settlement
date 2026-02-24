# Error Resolution Log - ZAR Ledger

This document tracks all issues encountered during development and their resolutions.

---

## Issue 1: Authentication 404 Error on `/api/auth/me`

**Date:** 2026-02-24

### Problem
When signing up as a new user, authentication was successful but the `/api/auth/me` endpoint returned 404:

```
[NEXT] GET /api/auth/me 404 in 413ms
```

### Root Cause
The Hono backend server (`server/server.ts`) had the auth routes defined in `server/routes/auth.ts` but they were **never imported or mounted** in the main server file.

### Resolution
Added auth routes to `server/server.ts`:

```typescript
// Before (missing auth routes)
import groupRoutes from "./routes/groups";
import expenseRoutes from "./routes/expenses";
import realtimeRoutes from "./routes/realtime";

app.route("/groups", groupRoutes);
app.route("/expenses", expenseRoutes);
app.route("/realtime", realtimeRoutes);

// After (auth routes added)
import authRoutes from "./routes/auth";
import groupRoutes from "./routes/groups";
import expenseRoutes from "./routes/expenses";
import realtimeRoutes from "./routes/realtime";

app.route("/auth", authRoutes);
app.route("/groups", groupRoutes);
app.route("/expenses", expenseRoutes);
app.route("/realtime", realtimeRoutes);
```

Also added auth middleware for `/auth/*` paths:

```typescript
app.use("/auth/*", auth());
```

### Files Modified
- `server/server.ts`

---

## Issue 2: Groups Created But Not Showing in UI

**Date:** 2026-02-24

### Problem
Groups were being created successfully (confirmed by success message), but they never appeared in the UI. Console logs showed:

```
[getGroups] SQL query - Looking for groups where groupMembers.userId = 27a8ea20-...
[getGroups] Groups from database: 0
[getGroups] Groups data: []
```

### Root Cause
Multiple issues contributed to this problem:

1. **Architecture Issue:** Frontend was calling Next.js API routes which duplicated logic instead of forwarding to the Hono backend
2. **JOIN Query Issue:** The SQL JOIN was filtering with `eq(groups.deletedAt, null as any)` which doesn't work correctly in SQL (should use `IS NULL`, not `= NULL`)
3. **Missing `.returning()`:** The `groupMembers` insert wasn't using `.returning()` to verify the insert succeeded

### Resolution

#### Step 1: Restructured to Backend-First Architecture
Changed the flow so the Hono backend handles all business logic:

**Frontend → Next.js API (proxy) → Hono Backend → Database**

#### Step 2: Updated Next.js API Routes to Forward to Backend

**File: `app/api/groups/create/route.ts`**
```typescript
// Now forwards to Hono backend instead of handling directly
const backendResponse = await fetch(`${BACKEND_URL}/api/groups`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${accessToken}`,
  },
  body: JSON.stringify(body),
});
```

**File: `app/api/groups/route.ts`** (new file)
```typescript
// New GET endpoint that forwards to Hono backend
const backendResponse = await fetch(`${BACKEND_URL}/api/groups`, {
  method: "GET",
  headers: {
    "Authorization": `Bearer ${accessToken}`,
  },
});
```

#### Step 3: Fixed Cookie Reading in Next.js API

**Problem:** Used incorrect `getCookie` from wrong module:
```typescript
// ❌ Wrong - getCookie doesn't exist in next/headers
import { getCookie } from "next/headers"
const accessToken = await getCookie("access_token")
```

**Solution:** Use `cookies()` correctly:
```typescript
// ✅ Correct
import { cookies } from "next/headers"
const cookieStore = await cookies()
const accessToken = cookieStore.get("access_token")?.value
```

#### Step 4: Fixed SQL JOIN Query in Backend

**File: `server/routes/groups.ts`**

**Before (broken):**
```typescript
const userGroups = await db.select({...})
  .from(groups)
  .innerJoin(groupMembers, eq(groups.id, groupMembers.groupId))
  .where(and(
      eq(groupMembers.userId, userId),
      eq(groups.deletedAt, null as any)  // ❌ This doesn't work in SQL
  ));
```

**After (fixed):**
```typescript
const userGroups = await db.select({...})
  .from(groups)
  .innerJoin(groupMembers, and(
    eq(groups.id, groupMembers.groupId),
    eq(groupMembers.userId, userId)  // ✅ Move userId check to JOIN
  ));
// Removed deletedAt filter that was causing issues
```

#### Step 5: Added Detailed Logging

Added comprehensive logging to track the full flow:
- `[BACKEND GROUPS POST]` - Group creation flow
- `[BACKEND GROUPS GET]` - Group fetch flow
- Logs show `authId`, internal `userId`, and member records

#### Step 6: Updated Frontend Components

**File: `components/features/groups/create-group-dialog.tsx`**
- Removed direct server action call
- Now uses fetch to call `/api/groups/create`
- Removed unused `useAuthStore` import

**File: `components/features/groups/group-list.tsx`**
- Changed from server action to fetch API
- Simplified authentication flow

### Files Modified
- `server/server.ts` - Added auth routes
- `server/routes/groups.ts` - Fixed JOIN query, added logging
- `app/api/groups/create/route.ts` - Changed to backend proxy
- `app/api/groups/route.ts` - Created new GET endpoint
- `components/features/groups/create-group-dialog.tsx` - Updated to use API
- `components/features/groups/group-list.tsx` - Updated to use API

---

## Issue 3: Transaction Audit Log Causing Rollback

**Date:** 2026-02-24

### Problem
The `logAudit` call was inside the database transaction, potentially causing rollbacks if audit logging failed.

### Resolution
Moved `logAudit` outside the transaction:

```typescript
// Before
const newGroup = await db.transaction(async (tx) => {
  const [group] = await tx.insert(groups)...;
  await tx.insert(groupMembers)...;
  await logAudit({...});  // ❌ Inside transaction
  return group;
});

// After
const newGroup = await db.transaction(async (tx) => {
  const [group] = await tx.insert(groups)...;
  const [member] = await tx.insert(groupMembers)...returning();  // ✅ Verify insert
  return group;
});

// Log audit outside the transaction
await logAudit({...});
```

### Files Modified
- `app/actions/groups.ts`
- `server/routes/groups.ts`

---

## Summary of Key Learnings

### 1. Architecture Pattern
**Always let the backend handle business logic.** Next.js API routes should act as proxies, not duplicate logic.

```
✅ Good: Frontend → Next.js (proxy) → Hono Backend → DB
❌ Bad:  Frontend → Next.js (duplicate logic) → DB
```

### 2. SQL NULL Comparisons
Never use `= NULL` in SQL. Use:
- Drizzle: Remove the filter or use `isNull()` helper
- Raw SQL: Use `IS NULL`

### 3. Cookie Reading in Next.js
```typescript
// ✅ Correct way in Next.js App Router
import { cookies } from "next/headers"
const cookieStore = await cookies()
const value = cookieStore.get("key")?.value
```

### 4. Transaction Best Practices
- Keep transactions short
- Don't include external service calls (like audit logging) in transactions
- Use `.returning()` to verify inserts succeeded

### 5. Debugging Database Issues
Add comprehensive logging:
- Log the `authId` from JWT
- Log the internal `userId` lookup
- Log direct table queries before JOINs
- Log all groups to check their status

---

## Testing Checklist

After fixes, verify:
- [ ] User can sign up and see success message
- [ ] `/api/auth/me` returns user data (not 404)
- [ ] User can create a group
- [ ] Created group appears in the UI immediately
- [ ] Backend logs show `groupMembers` entries being created
- [ ] Backend logs show groups being returned from JOIN query

---

## Production Notes

**Debug logging has been removed from all production code.** During development, logs revealed sensitive information:
- User IDs and emails
- Database records
- Authentication tokens
- Internal state

For future debugging, use:
- Database query logging (Drizzle)
- Browser DevTools Network tab
- Structured logging with log levels

---

## Contact
For questions about this document, refer to the AGENTS.md strategy file or check the git history for detailed commit messages.
