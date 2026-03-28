# ZAR Ledger SaaS Implementation Guide

## Overview
This document describes the SaaS (Software as a Service) implementation for ZAR Ledger, transforming it from a personal expense-sharing project into a commercial multi-tenant platform with subscription tiers.

**Payment Provider:** Paystack (South Africa) - *Peach Payments and Stripe will be added in future*

---

## Subscription Tiers

### 🍖 BRAAI Tier (FREE)
**Target:** Casual friends and one-off lunch splits

**Limits:**
- Max 2 Active Groups
- 30-day expense history
- Max 10 members per group

**Features:**
- Basic splitting (EQUAL, EXACT, PERCENTAGE)
- Invite codes
- ZAR precision (cents-based)

**Price:** R0/month

---

### 🏠 HOUSEHOLD Tier (PRO)
**Target:** Long-term roommates, travel groups, and couples

**Limits:**
- Unlimited Groups
- Lifetime history
- Max 25 members per group

**Features:**
- All BRAAI features
- Recurring expenses (rent/Netflix)
- PDF export for monthly summaries
- Priority support

**Price:** R49/month

---

### 🤵 AGENT Tier (BUSINESS)
**Target:** Property managers, Airbnb co-hosts, and small event planners

**Limits:**
- Unlimited Groups
- Lifetime history
- Max 50 members per group

**Features:**
- All HOUSEHOLD features
- White-labeling (custom logo on reports)
- CSV/Xero exports
- Automated settlement reminders
- POPIA data vault

**Price:** R299/month

---

## Database Schema Changes

### New Table: `subscriptions`
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE NOT NULL,
  tier TEXT NOT NULL DEFAULT 'BRAAI',  -- BRAAI, HOUSEHOLD, AGENT
  status TEXT NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE, CANCELLED, PAST_DUE, TRIALING
  stripe_subscription_id TEXT UNIQUE,  -- Paystack subscription/reference ID
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

---

## API Endpoints

### Subscription Management

#### GET /api/subscription
Get current subscription details and available tiers.

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "tier": "BRAAI",
  "status": "ACTIVE",
  "limits": {
    "maxGroups": 2,
    "maxMembersPerGroup": 10,
    "historyDays": 30,
    "features": ["basic_splitting", "invite_codes", "zar_precision"],
    "priceZar": 0
  },
  "availableTiers": [...]
}
```

#### POST /api/subscription/upgrade
Upgrade to a higher tier or create Paystack checkout session.

**Request:**
```json
{
  "tier": "HOUSEHOLD",
  "successUrl": "https://app.zarledger.co/subscription/success",
  "cancelUrl": "https://app.zarledger.co/subscription/cancel"
}
```

**Response (Checkout):**
```json
{
  "success": true,
  "checkoutUrl": "https://checkout.paystack.co/xxxxxx",
  "sessionId": "reference_xxxxxx",
  "reference": "zar_ledger_uuid_timestamp",
  "tier": "HOUSEHOLD",
  "price": "R49.00"
}
```

**Response (Direct Upgrade with Reference):**
```json
{
  "success": true,
  "message": "Successfully upgraded to household tier!",
  "subscription": {...}
}
```

#### POST /api/subscription/cancel
Cancel subscription at period end.

**Response:**
```json
{
  "success": true,
  "message": "Your household subscription will remain active until...",
  "subscription": {...}
}
```

#### GET /api/subscription/tiers
List all available tiers (public endpoint).

#### POST /api/subscription/webhook
Paystack webhook handler.

**Configure in Paystack Dashboard:** Settings > API Settings & Webhooks

**Headers:**
- `X-Paystack-Signature`

**Supported Events:**
- `charge.success` - One-time payment successful
- `subscription.create` - Recurring subscription created
- `subscription.update` - Subscription updated
- `subscription.disable` - Subscription cancelled
- `invoice.overdue` - Payment overdue

---

### Feature-Gated Endpoints

#### GET /api/expenses/:groupId/export/pdf
**Requires:** HOUSEHOLD tier or higher

Exports expenses to PDF format.

#### GET /api/expenses/:groupId/export/csv
**Requires:** HOUSEHOLD tier or higher

Exports expenses to CSV format (Xero-compatible).

---

## Middleware

### subscriptionMeter(action, feature?)
Checks if user's subscription allows the requested action.

**Usage:**
```typescript
// Enforce group creation limits
app.post("/", subscriptionMeter("CREATE_GROUP"), async (c) => {...});

// Gate premium features
app.get("/export/pdf", subscriptionMeter("FEATURE", "pdf_export"), async (c) => {...});
```

**Actions:**
- `CREATE_GROUP` - Check group limit
- `ADD_MEMBER` - Check member limit
- `FEATURE` - Check feature access (requires feature name)

### attachSubscriptionContext()
Attaches subscription info to request context for use in responses.

---

## Environment Variables

Add to `.env`:

```bash
# ===========================================
# PAYMENT INTEGRATION (Paystack - South Africa)
# ===========================================
# Sign up at: https://paystack.com

# Paystack Secret Key (from Dashboard > API Keys & Webhooks)
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx  # or sk_live_...

# Paystack Public Key (from Dashboard > API Keys & Webhooks)
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx  # or pk_live_...

# Webhook URL to configure in Paystack Dashboard:
# https://your-domain.com/api/subscription/webhook
# OR for local testing with ngrok:
# https://YOUR-NGROK-ID.ngrok.io/api/subscription/webhook
#
# NOTE: Paystack does NOT use a separate webhook secret.
# Webhook signatures are verified using your Secret Key above.
```

---

## Payment Flow (Paystack)

### 1. User Initiates Upgrade
```
Frontend → POST /api/subscription/upgrade
  Body: { tier: "HOUSEHOLD", successUrl, cancelUrl }
```

### 2. Backend Creates Checkout Session
```typescript
// Calls Paystack API
POST https://api.paystack.co/transaction/initialize
  - email: user@example.com
  - amount: 4900 (R49.00 in cents)
  - reference: zar_ledger_uuid_timestamp
  - metadata: { user_id, subscription_tier }
```

### 3. User Completes Payment
- Redirected to Paystack checkout
- Enters card/EFT details
- Payment processed

### 4. Paystack Sends Webhook
```
POST /api/subscription/webhook
  X-Paystack-Signature: whsec_xxxxx
  Body: {
    event: "charge.success",
    data: {
      reference: "zar_ledger_uuid_timestamp",
      metadata: { user_id, subscription_tier }
    }
  }
```

### 5. Backend Updates Subscription
```typescript
// Verifies signature
// Updates subscriptions table
await upgradeUserSubscription(userId, tier, reference);
```

### 6. User Redirected to Success Page
- `/subscription/success?reference=xxxxx`
- Payment verified
- Subscription activated

---

## Frontend Pages

### `/subscription` - Main Subscription Page
- Displays current subscription status
- Shows all tiers with features
- Upgrade buttons trigger Paystack checkout
- Cancel subscription option

### `/subscription/success` - Payment Success
- Verifies payment reference
- Shows success confirmation
- Redirects to subscription page

### `/subscription/cancel` - Payment Cancelled
- Shows cancellation message
- Options to retry or go back

---

## Testing

### Test Payment Flow (Test Mode)

1. **Use Test Keys**
   - `sk_test_xxxxx`
   - `pk_test_xxxxx`

2. **Test Cards** (Paystack Test Mode)
   - Success: `4084 0840 8408 4084`
   - Decline: `4000 0000 0000 0002`

3. **Test Webhook Locally**
   ```bash
   # Use ngrok to expose local server
   ngrok http 3000
   
   # Configure webhook URL in Paystack Dashboard
   https://xxxx.ngrok.io/api/subscription/webhook
   ```

4. **Test Subscription Limits**
   ```bash
   # Try to create 3rd group on BRAAI tier (should fail)
   curl -X POST /api/groups \
     -H "Authorization: Bearer TOKEN" \
     -d '{"name":"Test Group"}'
   
   # Response: 403 Forbidden - Subscription limit reached
   ```

---

## Webhook Setup (Paystack Dashboard)

1. Go to **Dashboard** > **Settings** > **API Settings & Webhooks**
2. Under **Webhook URL**, enter your ngrok URL (for testing):
   ```
   https://YOUR-NGROK-ID.ngrok.io/api/subscription/webhook
   ```
3. Click **Save**
4. **NOTE:** Paystack does NOT provide a separate webhook secret
5. Webhook signatures are verified using your **Secret Key** (`PAYSTACK_SECRET_KEY`)
6. The signature is sent in the `x-paystack-signature` header

### How Paystack Webhook Signature Works

```
1. Paystack takes the raw request body
2. Hashes it using your Secret Key (SHA-512)
3. Puts the hash in the x-paystack-signature header

Your backend must:
1. Read the raw body BEFORE parsing JSON
2. Hash it with your Secret Key
3. Compare with the x-paystack-signature header
```

### Important: Raw Body Handling

In your Hono.js webhook handler, you MUST:

```typescript
// ✅ CORRECT: Get raw body FIRST
const rawBody = await c.req.text();
const signature = c.req.header("x-paystack-signature");
const isValid = await verifyWebhookSignature(rawBody, signature);

// Then parse JSON (after verification)
const body = await c.req.json();
```

```typescript
// ❌ WRONG: Don't parse JSON first!
const body = await c.req.json();  // This consumes the raw body
const signature = c.req.header("x-paystack-signature");
// Signature verification will FAIL!
```

---

## Compliance Notes

### POPIA (South Africa)
- All PII (email, phone, ID numbers) is treated as sensitive
- Audit logs track all subscription changes
- AGENT tier includes dedicated POPIA data vault
- Paystack is POPIA compliant

### Financial Compliance
- All amounts stored as BigInt (cents) to avoid floating-point errors
- Double-entry bookkeeping via ledger_entries table
- Immutable audit trail for all transactions
- Payment references stored for reconciliation

---

## Migration Guide

### Step 1: Run Database Migrations
```bash
bunx drizzle-kit generate
bunx drizzle-kit migrate
```

### Step 2: Configure Paystack
1. Sign up at [paystack.com](https://paystack.com)
2. Get API keys from Dashboard
3. Add to `.env`:
   ```bash
   PAYSTACK_SECRET_KEY=sk_test_xxxxx
   PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
   PAYSTACK_WEBHOOK_SECRET=whsec_xxxxx
   ```

### Step 3: Set Up Webhook
1. Deploy your application
2. Get your production URL
3. Configure webhook in Paystack Dashboard
4. Test with a small transaction

### Step 4: Seed Default Subscriptions
All existing users will automatically get BRAAI tier subscriptions created on first access to `/api/subscription`.

---

## Troubleshooting

### Payment Not Activating Subscription

1. **Check Webhook Logs**
   ```bash
   # Check server logs for webhook processing
   bun run dev:backend
   ```

2. **Verify Webhook Signature**
   - Ensure `PAYSTACK_WEBHOOK_SECRET` is correct
   - Check Paystack Dashboard for webhook delivery status

3. **Check Transaction Reference**
   - Verify reference format: `zar_ledger_uuid_timestamp`
   - Check metadata contains `user_id` and `subscription_tier`

### Subscription Limits Not Enforcing

1. **Check Middleware**
   - Ensure `subscriptionMeter` is applied to routes
   - Verify `attachSubscriptionContext` is in middleware stack

2. **Check Database**
   ```sql
   SELECT * FROM subscriptions WHERE user_id = 'uuid';
   ```

---

## Future Enhancements

1. **Paystack Subscriptions API** - Recurring billing
2. **Peach Payments Integration** - Alternative SA provider
3. **Stripe Integration** - International expansion
4. **Trial Periods** - 14-day free trial for HOUSEHOLD
5. **Annual Billing** - Discount for yearly payment (e.g., R490/year vs R588)
6. **Referral Program** - Free months for referrals
7. **Coupons/Promo Codes** - Discount system

---

## Support

For implementation questions or issues:
- Check `server/services/payment.ts` for Paystack integration
- Check `server/services/subscription.ts` for subscription logic
- Check `server/middleware/subscription-meter.ts` for enforcement
- Check `server/routes/subscription.ts` for API endpoints
- Check `app/subscription/` for frontend pages
- Paystack Support: [support@paystack.com](mailto:support@paystack.com)
