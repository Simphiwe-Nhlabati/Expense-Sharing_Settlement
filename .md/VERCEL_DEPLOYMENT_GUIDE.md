# ZAR Ledger - Vercel Deployment Guide

Complete guide for deploying ZAR Ledger to Vercel.

---

## Quick Start

### First-Time Setup

```bash
# 1. Install Vercel CLI
bun install -g vercel

# 2. Login to Vercel
vercel login

# 3. Link your project
vercel link

# 4. Deploy to production
bun run deploy:prod
```

### Subsequent Deployments

```bash
# Deploy to production
bun run deploy:prod

# Or deploy to preview
bun run deploy
```

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Vercel Account Setup](#vercel-account-setup)
3. [Project Configuration](#project-configuration)
4. [Environment Variables](#environment-variables)
5. [Database Setup](#database-setup)
6. [Deployment Methods](#deployment-methods)
7. [Post-Deployment](#post-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- [Bun.js](https://bun.sh) installed (v1.2.21 or later)
- [Vercel account](https://vercel.com) (free or paid)
- [GitHub account](https://github.com) (for CI/CD)
- PostgreSQL database (Neon, Supabase, or Vercel Postgres)
- Domain name (optional, for production)

---

## Vercel Account Setup

### 1. Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Sign up with GitHub (recommended) or email

### 2. Install Vercel CLI

```bash
bun install -g vercel
```

### 3. Login

```bash
vercel login
```

This will open a browser window for authentication.

---

## Project Configuration

### 1. Link Project

```bash
cd expense-sharing_settlement
vercel link
```

This creates/updates `.vercel/project.json` with your project IDs.

### 2. Configure Project Settings

The project is pre-configured with:

- **Framework:** Next.js
- **Build Command:** `bun run build`
- **Install Command:** `bun install --frozen-lockfile`
- **Output Directory:** `.next`
- **Region:** Cape Town (cpt1)

### 3. Verify Configuration

Check `vercel.json` in the project root:

```json
{
  "framework": "nextjs",
  "regions": ["cpt1"],
  "buildCommand": "bun run build",
  ...
}
```

---

## Environment Variables

### Required Variables

Set these in **Vercel Dashboard > Settings > Environment Variables**:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | `super-secret-random-string...` |
| `PII_HMAC_SECRET` | PII hashing secret | `another-secret-string...` |
| `CORS_ORIGINS` | Allowed origins | `https://zarledger.co.za` |
| `NEXT_PUBLIC_APP_URL` | App URL | `https://zarledger.co.za` |
| `NEXT_PUBLIC_API_URL` | API URL | `https://zarledger.co.za/api` |

### Optional Variables

| Variable | Description |
|----------|-------------|
| `PAYSTACK_SECRET_KEY` | Paystack live secret (sk_live_...) |
| `PAYSTACK_PUBLIC_KEY` | Paystack public key (pk_live_...) |
| `SENTRY_DSN` | Sentry error tracking |
| `CRON_SECRET` | Cron job authentication |

### Set Environment Variables via CLI

```bash
# Pull existing env vars
vercel env pull

# Add new variable
vercel env add DATABASE_URL postgresql://...
```

### Generate Secrets

```bash
# JWT Secret
bun -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"

# PII HMAC Secret (same command)
bun -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

---

## Database Setup

### Recommended: Neon (Serverless PostgreSQL)

1. Go to [neon.tech](https://neon.tech)
2. Create account (use GitHub)
3. Create new project
4. Copy connection string
5. Add to Vercel environment variables

**Connection String Format:**
```
postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

### Alternative: Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings > Database
4. Copy connection string (URI mode)
5. Add to Vercel environment variables

### Run Migrations

After setting up the database:

```bash
# Install drizzle-kit if not already installed
bun add -d drizzle-kit

# Run migrations
bunx drizzle-kit migrate
```

---

## Deployment Methods

### Method 1: Automated Deployment (Recommended)

Set up GitHub Actions for automatic deployment on push to `main`:

1. **Configure GitHub Secrets:**

   Go to GitHub Repo > Settings > Secrets and variables > Actions

   Add these secrets:
   - `VERCEL_TOKEN` - From [vercel.com/account/tokens](https://vercel.com/account/tokens)
   - `VERCEL_ORG_ID` - From Vercel project settings
   - `VERCEL_PROJECT_ID` - From Vercel project settings

2. **Push to Main:**

   ```bash
   git add .
   git commit -m "Prepare deployment"
   git push origin main
   ```

3. **Monitor Deployment:**

   - GitHub Actions tab shows deployment progress
   - Vercel Dashboard shows deployment details

### Method 2: Manual Deployment

```bash
# Deploy to preview
bun run deploy

# Deploy to production
bun run deploy:prod

# Or using Vercel CLI directly
vercel deploy --prod
```

### Method 3: Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click "Redeploy" on any deployment
4. Or connect Git repository for automatic deployments

---

## Post-Deployment

### 1. Verify Deployment

```bash
# Health check
curl https://your-domain.com/api/health

# Expected response:
# {"status":"ok","timestamp":"...","uptime":...}
```

### 2. Test Core Features

- [ ] Sign up a test user
- [ ] Create a group
- [ ] Add an expense
- [ ] Verify expense splits
- [ ] Test settlement flow

### 3. Configure Custom Domain (Optional)

1. Go to Vercel Dashboard > Project > Settings > Domains
2. Add your domain: `zarledger.co.za`
3. Add www subdomain: `www.zarledger.co.za`
4. Update DNS records at your registrar:
   - A record: `@` → `76.76.21.21`
   - CNAME: `www` → `cname.vercel-dns.com`

### 4. Set Up Monitoring

See [PRODUCTION_MONITORING.md](./PRODUCTION_MONITORING.md) for:
- Vercel Analytics setup
- Sentry error tracking
- Uptime monitoring
- Alert configuration

### 5. Configure Paystack Webhook (for payments)

1. Go to Paystack Dashboard
2. Settings > API Keys & Webhooks
3. Add webhook URL: `https://your-domain.com/api/subscription/webhook`
4. Subscribe to events:
   - `charge.success`
   - `charge.failed`
   - `subscription.create`
   - `subscription.disable`

---

## Troubleshooting

### Build Fails

**Error: TypeScript errors**
```bash
bun run typecheck
```

Fix TypeScript errors before deploying.

**Error: Module not found**
```bash
bun install --frozen-lockfile
```

Ensure all dependencies are in `package.json`.

### Environment Variables Not Found

1. Check variables in Vercel Dashboard > Settings > Environment Variables
2. Ensure scope is set to "Production"
3. Redeploy after adding variables

### CORS Errors

Update `CORS_ORIGINS` in Vercel environment:
```
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### Database Connection Errors

1. Verify connection string includes `?sslmode=require`
2. Check database provider status
3. Ensure database allows connections from Vercel IPs

### Deployment Stuck

```bash
# Check deployment logs
vercel logs <deployment-url>

# Cancel deployment
vercel rm <deployment-url>
```

### Rollback to Previous Deployment

1. Go to Vercel Dashboard > Project > Deployments
2. Find last working deployment
3. Click "Promote to Production"

---

## Useful Commands

```bash
# Link project
vercel link

# Pull environment variables
vercel env pull

# List deployments
vercel ls

# View logs
vercel logs <deployment-url>

# Remove deployment
vercel rm <deployment-url>

# Check whoami
vercel whoami

# Logout
vercel logout
```

---

## CI/CD with GitHub Actions

The project includes a GitHub Actions workflow for automated deployment.

### Workflow: `.github/workflows/deploy.yml`

**Triggers:**
- Push to `main` branch
- Manual trigger (workflow_dispatch)

**Steps:**
1. Pre-deploy checks (build, test, lint)
2. Deploy to Vercel
3. Post-deployment health checks

### Enable GitHub Actions

1. Go to GitHub Repo > Settings > Actions
2. Enable actions
3. Add required secrets

---

## Cost Estimation

### Vercel Free Tier

- Unlimited deployments
- 100GB bandwidth/month
- 1,000 serverless function executions/day
- Automatic SSL

### Vercel Pro ($20/month)

- Everything in Free
- 1TB bandwidth/month
- 1,000,000 serverless function executions/month
- Preview deployments
- Analytics

### Database Costs

- **Neon Free:** 0.5 GB storage, 500 MB compute
- **Neon Pro:** $19/month for 50 GB storage
- **Supabase Free:** 500 MB storage
- **Supabase Pro:** $25/month for 8 GB storage

---

## Security Checklist

- [ ] All secrets rotated from defaults
- [ ] `JWT_SECRET` is cryptographically secure
- [ ] `PII_HMAC_SECRET` is unique
- [ ] Database uses SSL/TLS
- [ ] CORS configured for production domains only
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] Security headers configured (see `vercel.json`)
- [ ] Rate limiting enabled
- [ ] Audit logging enabled

---

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Neon Documentation](https://neon.tech/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Paystack Documentation](https://paystack.com/docs)

---

## Support

For deployment issues:

1. Check [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)
2. Review [PRODUCTION_MONITORING.md](./PRODUCTION_MONITORING.md)
3. Check Vercel status: [status.vercel.com](https://www.status.vercel.com)
4. Contact Vercel support: [vercel.com/support](https://vercel.com/support)

---

**Last Updated:** March 28, 2026  
**Version:** 1.0
