# Comprehensive Codebase Review

## Scope
This review focuses on:
1. Security posture and fintech/POPIA risk
2. Feature ideas that add business value
3. UI/UX upgrades
4. Performance optimization opportunities

---

## Security Review

### Critical findings

1. **Group membership authorization bypass risk on expense endpoints**
   - `verifyGroupMember` reads `c.req.param("id")` while expense routes use `/:groupId`.
   - On routes like `GET /expenses/:groupId`, membership checks can be skipped because `groupId` is not read from params.
   - Recommendation:
     - Normalize param lookup (`id`, `groupId`) or pass param name to middleware.
     - Make authorization *fail closed* when expected `groupId` is absent.
     - Add integration tests for unauthorized access across all group-scoped endpoints.

2. **Expense creation endpoint does not enforce group membership at route level**
   - `POST /expenses` does not include `verifyGroupMember()` middleware even though it accepts `groupId` from payload.
   - Recommendation:
     - Enforce group membership before transaction.
     - Validate every split participant belongs to the same group.

3. **Tokens returned in JSON body despite HTTP-only cookie storage**
   - Auth routes set secure cookie strategy but also return `accessToken` and `refreshToken` in response body.
   - This increases token exfiltration surface (XSS, browser extensions, logs, replay tooling).
   - Recommendation:
     - Stop returning tokens in JSON for browser clients.
     - Keep session exclusively cookie-based for web app.

4. **Global idempotency key namespace can create cross-user key collisions**
   - `idempotency_keys.key` is the PK, and lookup is by `key` only.
   - Recommendation:
     - Scope key uniqueness by `(user_id, key)` or hash(`user_id:path:key`).
     - Verify request fingerprint (method/path/body hash) before replaying cached response.

### High findings

5. **PII hashing strategy is deterministic SHA-256 without keyed salt**
   - `hashPII` uses plain SHA-256.
   - Recommendation:
     - Use HMAC-SHA256 with environment-managed secret, or Argon2id if reversible lookup is not needed.
     - Add key rotation/versioning in stored records.

6. **PII protection utilities appear unused in request flow**
   - `pii-protection.ts` exports validation/hash helpers but no route uses them.
   - Recommendation:
     - Add a mandatory PII handling service layer for profile and onboarding flows.

7. **Sanitization middleware parses JSON but sanitized payload is not enforced downstream**
   - Middleware stores `sanitizedBody` in context, but handlers read `c.req.valid("json")` directly.
   - Recommendation:
     - Either (a) sanitize in schema transform, or (b) enforce reading from sanitized context in all handlers.

---

## Feature Recommendations (High Impact)

1. **Settlement Approval Workflow + Dual Confirmation**
   - Add optional “confirm by creditor + debtor” before marking settlement final.
   - Increases trust, reduces disputes in shared households.

2. **Recurring Expense Engine with drift-safe schedule rules**
   - Monthly rent/utilities templates with holiday/weekend adjustment and idempotent execution.

3. **POPIA Data Vault + Right-to-Erasure workflow**
   - Encrypted PII vault, exportable data subject report, and redaction jobs with audit entries.

4. **Smart Nudge System for settlements**
   - WhatsApp/SMS/email nudges with anti-spam limits and multilingual templates (`en-ZA`, optional `af-ZA`, `zu-ZA`).

5. **Dispute & Evidence module**
   - Receipt attachments, comment trail, and timeline locking after settlement close.

---

## UI/UX Upgrade Opportunities

1. **Improve error/empty/loading parity in group list**
   - `GroupList` has loading and empty states but no explicit error state rendering.
   - Add retry CTA and context-specific copy.

2. **Monetary formatting consistency**
   - Standardize to `Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" })` across all visible amounts.
   - Avoid displaying raw `R{balance}` strings.

3. **Accessibility and trust indicators**
   - Add keyboard focus states to interactive cards.
   - Add explicit “secured by audit trail / request ID” trust chips on sensitive flows.

4. **Transaction feedback UX**
   - Add optimistic UI with rollback toast for create-expense and settle-up flows.
   - Display idempotency status (e.g., “duplicate request safely ignored”).

---

## Performance Optimization Opportunities

1. **Rate limiter hot-path DB overhead**
   - Current implementation performs read+write to DB per request on protected routes.
   - Recommendation:
     - Use in-memory/Redis token bucket for primary check, async persist only for audit trail.
     - Keep DB fallback only for degraded mode.

2. **Potential query over-fetching for group details**
   - `GET /groups/:id` returns members + recent expenses in one call.
   - Recommendation:
     - Paginate expenses, lazy-load members, and add selected columns only.

3. **Avoid duplicate network fetch on mount**
   - `GroupList` uses `refetchOnMount: true` and an immediate `useEffect(refetch)` causing double fetch patterns.
   - Recommendation:
     - Remove manual `useEffect` refetch and rely on query options.

4. **BigInt precision strategy in ORM mode**
   - Monetary fields use `bigint(..., { mode: "number" })`.
   - Recommendation:
     - Use `mode: "bigint"` end-to-end for strict fintech safety, with serializer boundaries in API layer.

---

## Validation Snapshot

- `bun run test` currently fails with multiple test suite failures.
- `bun run lint` currently fails with a large set of lint/type issues.

---

## Suggested Execution Plan (Prioritized)

### Phase 1: Security hardening (Immediate)
1. Fix group authorization middleware + route coverage.
2. Remove token echoing from auth JSON responses.
3. Rework idempotency uniqueness and fingerprint validation.
4. Add mandatory tests for unauthorized group resource access.

### Phase 2: Correctness and reliability
1. Enforce split semantics (`EQUAL`, `EXACT`, `PERCENTAGE`) server-side.
2. Validate split user membership and sum constraints.
3. Add explicit transaction error handling and rollback logging standards.

### Phase 3: UX and performance
1. Improve error states and currency formatting consistency.
2. Remove duplicate fetches and add pagination.
3. Move rate limiting to a faster store with DB fallback.

### Phase 4: Product differentiation
1. Recurring expenses + reminders.
2. POPIA vault workflows.
3. Dispute/evidence subsystem.
