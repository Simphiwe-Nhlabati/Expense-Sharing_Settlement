# ZAR Ledger - Production Monitoring Guide

This guide covers monitoring, alerting, and health checks for the ZAR Ledger production deployment.

## Table of Contents

1. [Health Endpoints](#health-endpoints)
2. [Monitoring Services](#monitoring-services)
3. [Alerting Setup](#alerting-setup)
4. [Database Monitoring](#database-monitoring)
5. [Performance Monitoring](#performance-monitoring)
6. [Security Monitoring](#security-monitoring)
7. [Incident Response](#incident-response)

---

## Health Endpoints

### API Health Check

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-28T10:00:00.000Z",
  "uptime": 3600
}
```

**Usage:**
- Configure uptime monitoring to check this endpoint every 5 minutes
- Alert if response is not HTTP 200 for 3 consecutive checks

### Cron Job Health Check

**Endpoint:** `GET /api/cron/health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-28T10:00:00.000Z",
  "cronEnabled": true
}
```

**Usage:**
- Verify cron jobs are running correctly
- Check database connectivity

---

## Monitoring Services

### Recommended Stack

| Service | Purpose | Integration |
|---------|---------|-------------|
| **Vercel Analytics** | Web vitals, page views | Built-in |
| **Vercel Logs** | Application logs | Built-in |
| **Sentry** | Error tracking | SDK required |
| **UptimeRobot** | Uptime monitoring | External |
| **Neon/Supabase Dashboard** | Database metrics | Provider dashboard |

### Vercel Analytics Setup

1. Go to Vercel Dashboard > Your Project > Analytics
2. Enable "Web Analytics"
3. Enable "Speed Insights"
4. Add to your Next.js app:

```bash
bun add @vercel/analytics @vercel/speed-insights
```

```typescript
// app/layout.tsx
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

### Sentry Error Tracking Setup

1. Create account at [sentry.io](https://sentry.io)
2. Create new project (Next.js)
3. Install SDK:

```bash
bun add @sentry/nextjs
```

4. Configure `sentry.client.config.ts`:

```typescript
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% sampling for performance
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})
```

5. Add environment variable to Vercel:
   - `SENTRY_DSN`: Your Sentry DSN URL

---

## Alerting Setup

### Critical Alerts (Immediate Response Required)

| Alert | Condition | Action |
|-------|-----------|--------|
| **API Down** | Health endpoint returns non-200 for 5 min | Page on-call |
| **Database Down** | Connection errors > 10/min | Page on-call |
| **Error Rate Spike** | Error rate > 5% of requests | Investigate immediately |
| **High Latency** | P95 latency > 3s | Investigate performance |

### Warning Alerts (Investigate Within 24 Hours)

| Alert | Condition | Action |
|-------|-----------|--------|
| **Elevated 4xx Errors** | 4xx rate > 10% | Check for client issues |
| **Rate Limit Hits** | Rate limit blocks > 100/hour | Check for abuse |
| **Slow Database Queries** | Query time > 500ms | Optimize queries |

### UptimeRobot Setup

1. Create account at [uptimerobot.com](https://uptimerobot.com)
2. Add new monitor:
   - **Type:** HTTP(s)
   - **URL:** `https://your-domain.com/api/health`
   - **Interval:** 5 minutes
   - **Alert contacts:** Email, SMS, Slack

3. Configure alert escalation:
   - After 3 failed checks: Email
   - After 5 failed checks: SMS

---

## Database Monitoring

### Key Metrics to Monitor

| Metric | Threshold | Provider |
|--------|-----------|----------|
| **Connection Count** | > 80% of max | Neon/Supabase |
| **Query Duration** | P95 > 500ms | Database logs |
| **Storage Usage** | > 80% of quota | Provider dashboard |
| **Backup Status** | Last backup > 24h | Provider dashboard |

### Neon (Serverless PostgreSQL)

1. Go to Neon Console > Your Project > Metrics
2. Monitor:
   - Active connections
   - CPU usage
   - Storage growth
3. Set up alerts in provider dashboard

### Database Backup Verification

```sql
-- Check last backup time (provider-specific)
-- For Neon, check dashboard
-- For Supabase, check Settings > Database > Backups
```

**Backup Schedule:**
- Automated daily backups (managed by provider)
- Point-in-time recovery (if available)
- Test restore procedure quarterly

---

## Performance Monitoring

### Key Performance Indicators (KPIs)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Page Load Time** | < 2s | Vercel Speed Insights |
| **Time to First Byte (TTFB)** | < 200ms | Vercel Analytics |
| **API Response Time (P95)** | < 500ms | Vercel Logs |
| **Error Rate** | < 1% | Sentry |

### Vercel Performance Dashboard

1. Go to Vercel Dashboard > Your Project > Analytics
2. Monitor:
   - Web Vitals (LCP, FID, CLS)
   - Page views
   - Geographic distribution

### Log Analysis

**Access Vercel Logs:**
```bash
vercel logs <deployment-url> --follow
```

**Key Log Patterns to Monitor:**
- `[ERROR]` - Application errors
- `Unauthorized` - Authentication failures
- `Too many requests` - Rate limiting
- `Transaction error` - Database issues

---

## Security Monitoring

### Security Events to Monitor

| Event | Severity | Response |
|-------|----------|----------|
| **Multiple Failed Logins** | Medium | Check for brute force |
| **Rate Limit Blocks** | Low | Normal operation |
| **CORS Violations** | Medium | Check for unauthorized access |
| **SQL Errors** | High | Potential injection attempt |
| **Unusual Traffic Spikes** | Medium | Check for DDoS |

### Audit Log Review

The application maintains audit logs in the `audit_logs` table:

```sql
-- Review recent audit logs
SELECT action, entity_type, created_at 
FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 100;

-- Check for suspicious activity
SELECT user_id, COUNT(*) as action_count
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id
HAVING COUNT(*) > 100;
```

### POPIA Compliance Monitoring

- Ensure PII data is hashed (check `hashPII` usage)
- Monitor data export requests
- Track data deletion requests
- Review access logs quarterly

---

## Incident Response

### Incident Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| **P0 - Critical** | Complete outage, data loss | Immediate (< 15 min) |
| **P1 - High** | Major feature broken | < 1 hour |
| **P2 - Medium** | Minor feature degraded | < 4 hours |
| **P3 - Low** | Cosmetic issue | < 24 hours |

### Incident Response Checklist

**Immediate Actions (First 15 minutes):**
- [ ] Acknowledge the incident
- [ ] Assess severity and impact
- [ ] Notify stakeholders (Slack, Email)
- [ ] Start incident log document

**Investigation (15-60 minutes):**
- [ ] Check Vercel dashboard for errors
- [ ] Review Sentry for error traces
- [ ] Check database status
- [ ] Review recent deployments
- [ ] Check for external issues (provider outages)

**Resolution:**
- [ ] Implement fix or rollback
- [ ] Verify fix in production
- [ ] Monitor for 30 minutes
- [ ] Communicate resolution to stakeholders

**Post-Incident:**
- [ ] Document root cause
- [ ] Create action items to prevent recurrence
- [ ] Update runbooks if needed
- [ ] Schedule post-mortem meeting (for P0/P1)

### Rollback Procedure

**Via Vercel Dashboard:**
1. Go to Vercel > Your Project > Deployments
2. Find last known good deployment
3. Click "Promote to Production"

**Via Vercel CLI:**
```bash
vercel rollback <deployment-url>
```

**Via GitHub:**
1. Revert the problematic commit
2. Push to main branch
3. Wait for automated deployment

---

## Contact & Escalation

### On-Call Rotation

| Role | Contact | Escalation Time |
|------|---------|-----------------|
| **Primary** | [on-call@example.com](mailto:on-call@example.com) | Immediate |
| **Secondary** | [backup@example.com](mailto:backup@example.com) | 15 minutes |
| **Manager** | [manager@example.com](mailto:manager@example.com) | 30 minutes |

### External Support

| Provider | Support Channel | SLA |
|----------|-----------------|-----|
| **Vercel** | [vercel.com/support](https://vercel.com/support) | 24/7 (Enterprise) |
| **Neon** | [neon.tech/support](https://neon.tech/support) | Business hours |
| **Paystack** | [paystack.com/contact](https://paystack.com/contact) | 24/7 |

---

## Maintenance Windows

### Scheduled Maintenance

- **Cron Job Cleanup:** Every 6 hours (automated)
- **Database Optimization:** Weekly (automated)
- **Dependency Updates:** Monthly (manual)

### Maintenance Communication

1. Announce maintenance 48 hours in advance
2. Post status update at start and end
3. Document any issues in incident log

---

## Runbooks

### Runbook: High Error Rate

1. Check Sentry dashboard for error patterns
2. Review recent deployments
3. Check database connection status
4. Review error logs in Vercel
5. If deployment-related: rollback immediately
6. If database-related: check provider status
7. Document findings and resolution

### Runbook: Slow Performance

1. Check Vercel Speed Insights for page-level metrics
2. Review slow query logs in database
3. Check for high traffic or unusual patterns
4. Review recent code changes
5. Check external service dependencies
6. Consider scaling or caching improvements

### Runbook: Database Connection Issues

1. Check Neon/Supabase dashboard for status
2. Verify connection string in Vercel environment
3. Check connection pool usage
4. Review database logs for errors
5. If provider outage: wait for resolution
6. If connection limit: optimize queries or scale up

---

## Appendix: Environment Variables for Monitoring

Add these to your Vercel environment:

```bash
# Error Tracking
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Analytics (optional - Vercel provides built-in)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX  # Google Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx  # PostHog

# Database Monitoring (provider-specific)
DATABASE_URL=postgresql://...?sslmode=require

# Alerting (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
PAGERDUTY_SERVICE_KEY=your-service-key
```

---

**Last Updated:** March 28, 2026  
**Version:** 1.0
