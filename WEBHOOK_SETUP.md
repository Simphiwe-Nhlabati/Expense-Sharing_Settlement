# Paystack Webhook Setup Guide

## Quick Setup (5 minutes)

### Step 1: Start Your Backend
```bash
cd C:\Users\Simphiwe\Desktop\expense-sharing_settlement
bun run dev:backend
```

### Step 2: Start ngrok
In a NEW terminal window:
```bash
ngrok http 3001
```

You'll see something like:
```
Forwarding  https://a1b2-c3d4.ngrok.io -> http://localhost:3001
```

**Copy the ngrok URL** (e.g., `https://a1b2-c3d4.ngrok.io`)

### Step 3: Configure Paystack Dashboard

1. Go to https://dashboard.paystack.com
2. Click **Settings** (gear icon)
3. Click **API Settings & Webhooks**
4. Under **Webhook URL**, paste:
   ```
   https://YOUR-NGROK-ID.ngrok.io/api/subscription/webhook
   ```
   (Replace `YOUR-NGROK-ID` with your actual ngrok URL)
5. Click **Save**

### Step 4: Update Your .env File

Create or edit `.env` in your project root:

```bash
# Paystack Keys
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**IMPORTANT:** Paystack does NOT use a separate webhook secret. The signature is verified using your Secret Key above.

### Step 5: Test the Webhook

1. **Make a test payment:**
   - Go to `http://localhost:3000/subscription`
   - Click "Upgrade" on HOUSEHOLD tier
   - Complete payment with test card: `4084 0840 8408 4084`

2. **Watch ngrok inspector:**
   - Open http://localhost:4040 in your browser
   - You should see a POST request to `/api/subscription/webhook`
   - Click on it to see the webhook payload

3. **Check your backend logs:**
   - You should see "Webhook processed successfully"

### Step 6: Verify Subscription Updated

After the webhook is processed:
- Refresh your subscription page
- You should see "HOUSEHOLD" tier as current

---

## Troubleshooting

### Webhook Not Received

1. **Check ngrok is running** - The URL expires when ngrok stops
2. **Check webhook URL** - Must end with `/api/subscription/webhook`
3. **Check Paystack dashboard** - Verify the URL is saved correctly

### Signature Verification Fails

This means the hash doesn't match. Common causes:

1. **Wrong Secret Key** - Make sure you're using `sk_test_...` not `pk_test_...`
2. **Body parsed before verification** - The raw body must be read BEFORE calling `c.req.json()`
3. **Extra whitespace** - The body must be exactly what Paystack sent

### Test Card Numbers

| Card | Result |
|------|--------|
| `4084 0840 8408 4084` | Success |
| `4000 0000 0000 0002` | Decline |
| `4187 7579 4944 4983` | Requires OTP |

- Use any future expiry date (e.g., `12/25`)
- Use any 3-digit CVV (e.g., `123`)

---

## Webhook Events

Your webhook handler processes these Paystack events:

| Event | Action |
|-------|--------|
| `charge.success` | Upgrades user subscription based on metadata |
| `subscription.create` | Creates recurring subscription |
| `subscription.update` | Updates subscription status |
| `subscription.disable` | Cancels subscription |
| `invoice.overdue` | Marks subscription as past due |

---

## Production Deployment

When deploying to production:

1. **Update webhook URL** in Paystack Dashboard to your production URL:
   ```
   https://your-domain.com/api/subscription/webhook
   ```

2. **Use live keys** in production `.env`:
   ```bash
   PAYSTACK_SECRET_KEY=sk_live_xxxxx
   PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
   ```

3. **Test with small amount first** before going live

---

## Code Reference

Your webhook handler is in: `server/routes/subscription.ts`

Key implementation details:

```typescript
// 1. Get raw body FIRST (before any JSON parsing)
const rawBody = await c.req.text();

// 2. Get signature from header (lowercase)
const signature = c.req.header("x-paystack-signature");

// 3. Verify using Secret Key
const isValid = await verifyWebhookSignature(rawBody, signature);

// 4. Only then parse JSON
const body = await c.req.json();
```

The verification function is in: `server/services/payment.ts`

---

## Need Help?

- **Paystack Support:** https://paystack.com/contact
- **ngrok Dashboard:** http://localhost:4040 (when running)
- **Your Webhook Logs:** Check backend terminal for logs
