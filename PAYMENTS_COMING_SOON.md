# Payment Integration - Coming Soon

## Current Status

**Subscription payments are currently disabled.** The application is in free mode with all users on the **Braai (Free)** tier.

## What's Available Now

All users have access to:
- ✅ Up to 3 groups
- ✅ Up to 10 members per group
- ✅ 30-day expense history
- ✅ Basic expense splitting
- ✅ Expense tracking
- ✅ Settlement tracking

## When You're Ready to Enable Payments

### Step 1: Complete Business Registration

Before enabling live payments, you need to:
1. Complete your business registration
2. Fill in compliance requirements
3. Obtain live API keys from your payment provider

### Step 2: Choose a Payment Provider

Consider these South African payment providers:
- **Paystack** (Recommended for South Africa)
  - Sign up: https://paystack.com
  - Good for subscriptions and recurring billing
  - POPIA compliant

- **Peach Payments**
  - South African based
  - Enterprise features

- **Stripe**
  - Global provider
  - Now available in South Africa

### Step 3: Re-enable Payment Integration

Once you have live API keys (`pk_live_*` and `sk_live_*`), follow these steps:

#### 3.1 Update Environment Variables

```env
# Payment Provider Keys (Get these from your provider's dashboard)
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxx

# Webhook URL (Update with your production domain)
NEXT_PUBLIC_WEBHOOK_URL=https://yourdomain.com/api/subscription/webhook
```

#### 3.2 Restore Payment Service

Update `server/services/payment.ts`:
- Remove the `PaymentNotAvailableError` throws
- Restore the actual Paystack API calls
- Update webhook signature verification

#### 3.3 Restore Subscription Routes

Update `server/routes/subscription.ts`:
- Remove the "Coming Soon" error returns
- Restore actual upgrade/cancel logic
- Re-enable webhook handlers

#### 3.4 Update Frontend

Update these files to remove "Coming Soon" UI:
- `app/subscription/page.tsx` - Enable upgrade buttons
- `app/subscription/success/page.tsx` - Restore payment verification
- `app/subscription/cancel/page.tsx` - Restore cancel messaging
- `components/common/tier-badge.tsx` - Remove "Coming Soon" labels

#### 3.5 Update API Client

Update `lib/api/subscription.ts`:
- Restore payment verification logic
- Remove "Coming Soon" comments

### Step 4: Configure Webhooks

1. Deploy your application to production
2. Get your production webhook URL
3. Configure the webhook URL in your payment provider dashboard
4. Test webhook delivery using the provider's test tools

### Step 5: Testing

Before going live:
1. Test with test mode keys first (`sk_test_*`, `pk_test_*`)
2. Verify upgrade flow works end-to-end
3. Test webhook delivery
4. Test cancellation flow
5. Verify database updates correctly

### Step 6: Go Live

1. Switch to live API keys
2. Monitor initial transactions closely
3. Have support ready for any issues

## Code Files to Update When Re-enabling

| File | What to Change |
|------|----------------|
| `server/services/payment.ts` | Remove error throws, restore API calls |
| `server/routes/subscription.ts` | Remove "Coming Soon" errors |
| `app/subscription/page.tsx` | Enable upgrade buttons |
| `app/subscription/success/page.tsx` | Restore verification |
| `app/subscription/cancel/page.tsx` | Restore messaging |
| `lib/api/subscription.ts` | Remove "Coming Soon" comments |
| `components/common/tier-badge.tsx` | Remove "Coming Soon" labels |

## Support Contacts

- **Paystack Support:** https://paystack.com/contact
- **Peach Payments Support:** https://peachpayments.com/support
- **Stripe Support:** https://stripe.com/support

## Notes

- The subscription database schema is already in place
- All users default to the BRAAI (Free) tier
- The subscription meter middleware is active but not enforcing limits for paid tiers
- Audit logging for subscription changes is implemented but inactive

---

**Last Updated:** March 2026
**Status:** Coming Soon - Awaiting Business Registration
