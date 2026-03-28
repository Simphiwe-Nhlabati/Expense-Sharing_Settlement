# ZAR Ledger - Production Deployment Checklist

A comprehensive checklist for deploying ZAR Ledger to production on Vercel.

---

## Pre-Deployment Preparation

### 1. Environment Configuration

- [ ] **Copy `.env.example` to `.env.local`**
  ```bash
  cp .env.example .env.local
  ```

- [ ] **Generate JWT_SECRET** (minimum 32 characters)
  ```bash
  # Using Bun
  bun -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
  
  # Using OpenSSL
  openssl rand -base64 32
  ```
  - [ ] Update `JWT_SECRET` in environment variables

- [ ] **Generate PII_HMAC_SECRET** (for POPIA compliance)
  ```bash
  bun -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
  ```
  - [ ] Update `PII_HMAC_SECRET` in environment variables

- [ ] **Configure DATABASE_URL**
  - [ ] Choose PostgreSQL provider (Neon, Supabase, AWS RDS, Vercel Postgres)
  - [ ] Create production database
  - [ ] Enable SSL/TLS connection (`?sslmode=require`)
  - [ ] Update `DATABASE_URL` in environment variables
  - [ ] Test connection locally

- [ ] **Configure CORS_ORIGINS**
  - [ ] Add production domain(s):
    ```
    CORS_ORIGINS=https://zarledger.co.za,https://www.zarledger.co.za
    ```
  - [ ] Do NOT include wildcards when using credentials

- [ ] **Configure Paystack Keys** (for payments)
  - [ ] Get live keys from Paystack Dashboard
  - [ ] Update `PAYSTACK_SECRET_KEY` (sk_live_...)
  - [ ] Update `PAYSTACK_PUBLIC_KEY` (pk_live_...)
  - [ ] Configure webhook URL in Paystack Dashboard

### 2. Vercel Project Setup

- [ ] **Create Vercel Account** (if not already done)
  - [ ] Go to [vercel.com](https://vercel.com)
  - [ ] Sign up with GitHub

- [ ] **Create New Project**
  - [ ] Import from GitHub repository
  - [ ] Select correct framework: **Next.js**
  - [ ] Configure root directory (if not root)

- [ ] **Configure Build Settings**
  - [ ] Build Command: `bun run build`
  - [ ] Install Command: `bun install --frozen-lockfile`
  - [ ] Output Directory: `.next`

- [ ] **Set Environment Variables in Vercel Dashboard**
  
  Navigate to: **Settings > Environment Variables**
  
  Add the following variables (Production scope):
  
  | Variable | Value | Scope |
  |----------|-------|-------|
  | `DATABASE_URL` | Your production PostgreSQL URL | Production |
  | `JWT_SECRET` | Your generated JWT secret | Production |
  | `PII_HMAC_SECRET` | Your generated PII secret | Production |
  | `CORS_ORIGINS` | Your production domains | Production |
  | `PAYSTACK_SECRET_KEY` | Your live Paystack secret | Production |
  | `PAYSTACK_PUBLIC_KEY` | Your live Paystack public key | Production |
  | `NODE_ENV` | `production` | Production |
  | `NEXT_PUBLIC_APP_URL` | `https://your-domain.com` | Production |
  | `NEXT_PUBLIC_API_URL` | `https://your-domain.com/api` | Production |

- [ ] **Configure Region**
  - [ ] Go to **Settings > Functions**
  - [ ] Select region: **Cape Town (cpt1)** (for South African users)

### 3. GitHub Secrets Configuration

Required for automated CI/CD deployment:

- [ ] **Get Vercel Token**
  - [ ] Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
  - [ ] Create new token with scope: **Full Access**
  - [ ] Copy token

- [ ] **Get Vercel Organization ID**
  - [ ] Go to Vercel Dashboard
  - [ ] Click on your account/organization
  - [ ] Copy Organization ID from URL or settings

- [ ] **Get Vercel Project ID**
  - [ ] Go to your project in Vercel
  - [ ] Go to **Settings > General**
  - [ ] Copy Project ID

- [ ] **Add GitHub Secrets**
  
  Navigate to: **GitHub Repo > Settings > Secrets and variables > Actions**
  
  Add these secrets:
  
  | Secret Name | Value |
  |-------------|-------|
  | `VERCEL_TOKEN` | Your Vercel API token |
  | `VERCEL_ORG_ID` | Your Vercel Organization ID |
  | `VERCEL_PROJECT_ID` | Your Vercel Project ID |

### 4. Database Setup

- [ ] **Run Database Migrations**
  ```bash
  # Install drizzle-kit globally (if not already installed)
  bun add -d drizzle-kit
  
  # Run migrations
  bunx drizzle-kit migrate
  ```

- [ ] **Verify Database Schema**
  - [ ] Check all tables are created:
    - `users`
    - `groups`
    - `group_members`
    - `expenses`
    - `ledger_entries`
    - `rate_limit_logs`
    - `idempotency_keys`
    - `audit_logs`
    - `subscriptions`

- [ ] **Configure Database Backups**
  - [ ] Enable automated daily backups (provider-dependent)
  - [ ] Set up point-in-time recovery (if available)
  - [ ] Test restore procedure

- [ ] **Database Security**
  - [ ] Restrict database access to Vercel IPs only
  - [ ] Use strong database password
  - [ ] Enable SSL/TLS for connections

---

## Deployment

### 5. Pre-Deployment Testing

- [ ] **Run Local Production Build**
  ```bash
  bun run build
  bun run start
  ```
  - [ ] Verify no build errors
  - [ ] Test locally at `http://localhost:3000`

- [ ] **Run Tests**
  ```bash
  bun run test
  ```
  - [ ] All unit tests pass
  - [ ] All integration tests pass

- [ ] **Run Type Check**
  ```bash
  bun run typecheck
  ```
  - [ ] No TypeScript errors

- [ ] **Run Linter**
  ```bash
  bun run lint
  ```
  - [ ] No critical linting errors

### 6. Deploy to Vercel

**Option A: Automated Deployment (Recommended)**

- [ ] **Push to Main Branch**
  ```bash
  git add .
  git commit -m "Prepare for production deployment"
  git push origin main
  ```
  - [ ] GitHub Actions workflow triggers automatically
  - [ ] Monitor deployment in **GitHub Actions** tab
  - [ ] Wait for deployment to complete

**Option B: Manual Deployment**

- [ ] **Install Vercel CLI**
  ```bash
  bun install -g vercel
  ```

- [ ] **Login to Vercel**
  ```bash
  vercel login
  ```

- [ ] **Deploy to Production**
  ```bash
  vercel deploy --prod
  ```

- [ ] **Verify Deployment**
  - [ ] Check deployment logs in Vercel Dashboard
  - [ ] Verify no errors in build output

### 7. Post-Deployment Verification

- [ ] **Health Check**
  ```bash
  curl https://your-domain.com/api/health
  ```
  Expected response:
  ```json
  {
    "status": "ok",
    "timestamp": "...",
    "uptime": ...
  }
  ```

- [ ] **Test Authentication**
  - [ ] Sign up a new user
  - [ ] Sign in with credentials
  - [ ] Verify cookies are set correctly
  - [ ] Access protected `/api/auth/me` endpoint

- [ ] **Test Core Features**
  - [ ] Create a group
  - [ ] Add members to group
  - [ ] Create an expense
  - [ ] View expense splits
  - [ ] Test settlement flow

- [ ] **Test Rate Limiting**
  - [ ] Make multiple rapid requests
  - [ ] Verify 429 response after limit

- [ ] **Test CORS**
  - [ ] Access API from production domain
  - [ ] Verify CORS headers are correct
  - [ ] Test from unauthorized domain (should fail)

- [ ] **Check Security Headers**
  ```bash
  curl -I https://your-domain.com
  ```
  Verify headers:
  - [ ] `Strict-Transport-Security`
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `X-Frame-Options: DENY`
  - [ ] `X-XSS-Protection`
  - [ ] `Content-Security-Policy`

- [ ] **Verify Database Connection**
  - [ ] Check Vercel logs for database errors
  - [ ] Create test data and verify persistence

- [ ] **Check Cron Jobs**
  - [ ] Verify cron endpoint: `/api/cron/health`
  - [ ] Check Vercel > Settings > Cron Jobs
  - [ ] Confirm schedule: `0 */6 * * *` (every 6 hours)

---

## Post-Deployment

### 8. Monitoring Setup

- [ ] **Enable Vercel Analytics**
  - [ ] Go to Vercel Dashboard > Project > Analytics
  - [ ] Enable Web Analytics
  - [ ] Enable Speed Insights

- [ ] **Set Up Error Tracking (Optional)**
  - [ ] Create Sentry account
  - [ ] Add `SENTRY_DSN` to Vercel environment variables
  - [ ] Install Sentry SDK: `bun add @sentry/nextjs`
  - [ ] Configure Sentry in Next.js

- [ ] **Configure Uptime Monitoring**
  - [ ] Set up UptimeRobot or similar service
  - [ ] Monitor: `https://your-domain.com/api/health`
  - [ ] Set check interval: 5 minutes
  - [ ] Configure alert notifications

- [ ] **Set Up Log Alerts**
  - [ ] Monitor for ERROR logs in Vercel
  - [ ] Set up email/Slack notifications for critical errors

### 9. Domain Configuration

- [ ] **Add Custom Domain**
  - [ ] Go to Vercel Dashboard > Project > Settings > Domains
  - [ ] Add domain: `zarledger.co.za`
  - [ ] Add www subdomain: `www.zarledger.co.za`

- [ ] **Configure DNS Records**
  
  At your domain registrar:
  
  | Type | Name | Value |
  |------|------|-------|
  | A | @ | `76.76.21.21` |
  | CNAME | www | `cname.vercel-dns.com` |

- [ ] **Verify SSL Certificate**
  - [ ] Vercel automatically provisions SSL
  - [ ] Verify HTTPS works for all domains
  - [ ] Check certificate expiration

- [ ] **Update CORS_ORIGINS**
  - [ ] Add new domain to `CORS_ORIGINS` in Vercel environment
  - [ ] Redeploy if necessary

### 10. Payment Integration (Paystack)

- [ ] **Configure Webhook in Paystack Dashboard**
  - [ ] Webhook URL: `https://your-domain.com/api/subscription/webhook`
  - [ ] Events to subscribe:
    - `charge.success`
    - `charge.failed`
    - `subscription.create`
    - `subscription.disable`

- [ ] **Test Webhook**
  - [ ] Use Paystack test mode first
  - [ ] Verify webhook endpoint receives events
  - [ ] Check webhook signature verification

- [ ] **Switch to Live Mode**
  - [ ] Update Paystack keys to live keys
  - [ ] Test with real transaction (small amount)
  - [ ] Verify payment flow end-to-end

### 11. POPIA Compliance

- [ ] **Privacy Policy**
  - [ ] Publish privacy policy page
  - [ ] Include data collection practices
  - [ ] Include data retention policies
  - [ ] Include user rights (access, deletion)

- [ ] **Data Protection**
  - [ ] Verify PII is hashed (SA ID numbers, phone numbers)
  - [ ] Check `hashPII` function is used for sensitive data
  - [ ] Verify HTTPS is enforced everywhere

- [ ] **User Data Rights**
  - [ ] Implement data export feature
  - [ ] Implement account deletion feature
  - [ ] Document process for data requests

- [ ] **Data Processing Agreement**
  - [ ] Document third-party processors (Vercel, Database provider, Paystack)
  - [ ] Ensure processors are POPIA-compliant

### 12. Documentation & Runbooks

- [ ] **Update README.md**
  - [ ] Add production URL
  - [ ] Update setup instructions
  - [ ] Add deployment instructions

- [ ] **Create Incident Response Runbook**
  - [ ] Document escalation procedures
  - [ ] List contact information
  - [ ] Create troubleshooting guides

- [ ] **Document Known Issues**
  - [ ] List any known bugs or limitations
  - [ ] Document workarounds

---

## Ongoing Maintenance

### 13. Regular Tasks

**Daily:**
- [ ] Check uptime monitoring dashboard
- [ ] Review error logs

**Weekly:**
- [ ] Review performance metrics
- [ ] Check database storage usage
- [ ] Review audit logs for suspicious activity

**Monthly:**
- [ ] Update dependencies
- [ ] Review and rotate secrets (quarterly recommended)
- [ ] Test backup restoration
- [ ] Review and optimize slow queries

**Quarterly:**
- [ ] Security audit
- [ ] POPIA compliance review
- [ ] Performance optimization
- [ ] Update documentation

### 14. Dependency Updates

```bash
# Check for outdated packages
bun outdated

# Update packages
bun update

# Run tests after updates
bun run test

# Rebuild and verify
bun run build
```

### 15. Security Best Practices

- [ ] **Regular Secret Rotation**
  - [ ] Rotate `JWT_SECRET` every 90 days
  - [ ] Rotate `PII_HMAC_SECRET` every 90 days
  - [ ] Rotate database credentials every 90 days
  - [ ] Rotate Paystack keys annually

- [ ] **Monitor for Vulnerabilities**
  - [ ] Enable GitHub Dependabot
  - [ ] Review security advisories for dependencies
  - [ ] Apply security patches promptly

- [ ] **Access Control**
  - [ ] Limit Vercel dashboard access to essential personnel
  - [ ] Use 2FA for all accounts
  - [ ] Review access logs periodically

---

## Troubleshooting

### Common Issues

**Build Fails:**
- Check build logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Run `bun run build` locally to reproduce

**Database Connection Errors:**
- Verify `DATABASE_URL` is correct
- Check database provider status
- Ensure SSL mode is set (`?sslmode=require`)

**CORS Errors:**
- Verify `CORS_ORIGINS` includes the production domain
- Check that credentials are set correctly in requests
- Ensure no wildcard (*) is used with credentials

**Rate Limiting Issues:**
- Check `RATE_LIMIT_WINDOW_MS` configuration
- Review rate limit logs in database
- Adjust limits if too restrictive

**Payment Failures:**
- Verify Paystack keys are correct (test vs live)
- Check webhook configuration in Paystack Dashboard
- Review Paystack transaction logs

---

## Contact & Support

- **Vercel Support:** [vercel.com/support](https://vercel.com/support)
- **Paystack Support:** [paystack.com/contact](https://paystack.com/contact)
- **Neon Support:** [neon.tech/support](https://neon.tech/support)
- **Supabase Support:** [supabase.com/support](https://supabase.com/support)

---

**Last Updated:** March 28, 2026  
**Version:** 1.0
