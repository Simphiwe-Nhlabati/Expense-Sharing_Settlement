# 🚀 ZAR Ledger - Production Deployment Guide

## Overview

This guide covers deploying ZAR Ledger to production on Vercel with a PostgreSQL database.

## Pre-Deployment Checklist

### 1. Environment Variables

Create a `.env.local` file based on `.env.example`:

```bash
cp .env.example .env.local
```

**Critical Production Settings:**

| Variable | Production Value | Notes |
|----------|-----------------|-------|
| `JWT_SECRET` | Generate with `openssl rand -base64 32` | Must be cryptographically secure |
| `DATABASE_URL` | Production PostgreSQL connection string | Use Neon, Supabase, or AWS RDS |
| `CORS_ORIGINS` | `https://yourdomain.co.za` | Your production domain only |
| `NODE_ENV` | `production` | Set automatically by Vercel |
| `PAYSTACK_SECRET_KEY` | `sk_live_...` | Use live keys for production |
| `PAYSTACK_PUBLIC_KEY` | `pk_live_...` | Use live keys for production |

### 2. Database Setup

#### Option A: Neon (Recommended)

1. Visit [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Set as `DATABASE_URL` in Vercel

#### Option B: Supabase

1. Visit [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Project Settings > Database
4. Copy the "Connection string (URI)"
5. Set as `DATABASE_URL` in Vercel

#### Option C: AWS RDS

1. Create a PostgreSQL instance
2. Configure security groups to allow Vercel IPs
3. Copy the endpoint and credentials
4. Set as `DATABASE_URL` in Vercel

### 3. Run Database Migrations

```bash
# Install dependencies
bun install

# Run migrations
bunx drizzle-kit migrate
```

## Deployment Steps

### Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

### Step 2: Link to Vercel Project

```bash
vercel link
```

### Step 3: Set Environment Variables in Vercel

```bash
# Set each environment variable
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
vercel env add CORS_ORIGINS production
vercel env add PAYSTACK_SECRET_KEY production
vercel env add PAYSTACK_PUBLIC_KEY production
# ... repeat for all variables
```

Or use the Vercel Dashboard:
1. Go to your project in Vercel
2. Navigate to **Settings** > **Environment Variables**
3. Add all variables from `.env.example`

### Step 4: Deploy to Production

```bash
vercel --prod
```

### Step 5: Configure Custom Domain (Optional)

1. Go to Vercel Dashboard > Your Project > **Settings** > **Domains**
2. Add your domain (e.g., `zarledger.co.za`)
3. Update DNS records as instructed
4. Wait for SSL certificate provisioning (~5 minutes)

### Step 6: Update CORS Origins

After deploying, update the CORS origins:

```bash
vercel env add CORS_ORIGINS "https://yourdomain.co.za,https://www.yourdomain.co.za" production
```

### Step 7: Redeploy

```bash
vercel --prod
```

## Post-Deployment Verification

### 1. Health Check

Visit: `https://yourdomain.co.za/api/health`

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

### 2. Database Connection

Visit: `https://yourdomain.co.za/api/cron/health`

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "cronEnabled": true
}
```

### 3. Test Authentication

1. Visit `https://yourdomain.co.za/sign-up`
2. Create a test account
3. Verify cookies are set correctly
4. Check browser console for errors

### 4. Test Expense Creation

1. Create a group
2. Add an expense with an `Idempotency-Key` header
3. Verify the expense is created
4. Retry with the same key - should return cached response

## Monitoring

### Vercel Analytics

Enable Vercel Analytics in your project settings:
1. Go to **Analytics** tab
2. Enable **Web Analytics**
3. Enable **Speed Insights**

### Error Tracking (Recommended)

Install Sentry for error tracking:

```bash
bun add @sentry/nextjs
```

Configure in `sentry.client.config.ts`:

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% sampling
});
```

### Database Monitoring

Set up monitoring for your PostgreSQL database:
- **Neon**: Built-in monitoring dashboard
- **Supabase**: Database > Settings > Monitoring
- **AWS RDS**: CloudWatch metrics

## Security Hardening

### 1. Rate Limiting

The application includes database-backed rate limiting:
- General: 200 requests/minute
- Expenses: 50 requests/minute
- Groups: 100 requests/minute

Adjust in `server/server.ts` if needed.

### 2. CORS Configuration

Ensure `CORS_ORIGINS` only includes your production domains:

```bash
CORS_ORIGINS=https://zarledger.co.za,https://www.zarledger.co.za
```

### 3. Security Headers

All security headers are configured in `vercel.json`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy` (configured in `server.ts`)

### 4. JWT Secret Rotation

Rotate your JWT secret periodically:

```bash
# Generate new secret
openssl rand -base64 32

# Update in Vercel
vercel env add JWT_SECRET production

# Redeploy
vercel --prod
```

**Note:** This will invalidate all existing sessions.

## Backup Strategy

### Database Backups

Configure automatic backups:

#### Neon
- Automatic daily backups (included)
- Point-in-time recovery (Pro plan)

#### Supabase
- Automatic daily backups (Pro plan)
- Manual backups via dashboard

#### AWS RDS
- Configure automated backups
- Set retention period (7-35 days)

### Environment Variables Backup

Export your environment variables:

```bash
vercel env ls > env-backup.txt
```

## Troubleshooting

### Build Fails

Check build logs in Vercel dashboard:
```bash
vercel logs
```

Common issues:
- Missing environment variables
- TypeScript errors
- Dependency issues

### Database Connection Errors

1. Verify `DATABASE_URL` is correct
2. Check database is accessible from Vercel IPs
3. Ensure SSL is enabled (most managed DBs require SSL)

### CORS Errors

1. Verify `CORS_ORIGINS` includes your domain
2. Check for trailing slashes
3. Ensure no spaces in the comma-separated list

### Rate Limiting Issues

If legitimate users are being rate-limited:
1. Check `RATE_LIMIT_WINDOW_MS` value
2. Increase limits in `server/server.ts`
3. Consider IP-based vs user-based limiting

## Performance Optimization

### 1. Enable Edge Caching

Static assets are cached automatically by Vercel.

### 2. Database Connection Pooling

Use a connection pooler like PgBouncer:
- **Neon**: Built-in connection pooling
- **Supabase**: Built-in connection pooling
- **AWS RDS**: Install PgBouncer

### 3. API Response Caching

Consider adding Redis for caching:
- User sessions
- Frequently accessed group data
- Expense calculations

## Scaling Considerations

### When to Scale

Monitor these metrics:
- Response time > 500ms
- Database connections > 80% capacity
- Error rate > 1%

### Scaling Options

1. **Vertical**: Upgrade Vercel plan (Pro, Enterprise)
2. **Horizontal**: Use multiple regions (Enterprise)
3. **Database**: Upgrade PostgreSQL instance

## Support

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Hono Docs](https://hono.dev/docs)
- [Drizzle Docs](https://orm.drizzle.team/docs)

### Community
- [GitHub Issues](https://github.com/your-org/zar-ledger/issues)
- [Discord](https://discord.gg/your-server)

## Deployment Automation (GitHub Actions)

The project includes a GitHub Actions workflow for automated deployments:

1. Push to `main` branch
2. Security scan runs
3. Build verification
4. Automatic deployment to Vercel

### Required GitHub Secrets

Set these in your repository settings:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### Manual Deployment

Trigger a deployment from GitHub Actions:
1. Go to **Actions** > **Deploy**
2. Click **Run workflow**
3. Select branch (usually `main`)

---

**Last Updated:** 2026-03-28  
**Version:** 1.0.0
