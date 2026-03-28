# 🔒 ZAR Ledger - Security Policy

## Security Features Overview

ZAR Ledger implements comprehensive security measures to protect user data and financial transactions.

## Implemented Security Controls

### 1. Authentication & Authorization

#### JWT Token Security
- **Access Tokens**: Short-lived (15 minutes)
- **Refresh Tokens**: Long-lived (7 days) with secure storage
- **Algorithm**: HS256 with strong secret (minimum 256 bits)
- **Token Storage**: HTTP-only, Secure, SameSite cookies
- **Password Hashing**: Argon2id with optimized parameters:
  - Memory cost: 19 MB
  - Time cost: 2 iterations
  - Parallelism: 1
  - Output length: 32 bytes

#### Implementation
```typescript
// server/services/auth.ts
export async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
}
```

### 2. Input Validation & Sanitization

#### XSS Protection
- **Library**: `xss` with strict whitelist (no HTML allowed)
- **Coverage**: All user-provided text fields
- **Implementation**: Middleware-based sanitization

```typescript
// server/middleware/sanitization.ts
const xssFilter = new FilterXSS({
  whiteList: {}, // No HTML tags allowed
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style"],
});
```

#### Schema Validation
- **Library**: Zod for runtime type checking
- **Coverage**: All API endpoints
- **Benefits**: Type safety + runtime validation

```typescript
// server/routes/auth.ts
const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().optional(),
});
```

### 3. Rate Limiting

#### Database-Backed Rate Limiting
- **General**: 200 requests/minute
- **Expenses**: 50 requests/minute (financial operations)
- **Groups**: 100 requests/minute
- **Subscription**: 30 requests/minute

#### Implementation
```typescript
// server/middleware/rate-limiter.ts
export const rateLimiter = (limit = 100) =>
  createMiddleware(async (c, next) => {
    const ip = c.req.header("x-forwarded-for") || "127.0.0.1";
    const windowStart = new Date(Date.now() - WINDOW_SIZE_MS);
    
    // Count requests in database
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(rateLimitLogs)
      .where(and(eq(rateLimitLogs.ip, ip), gte(rateLimitLogs.timestamp, windowStart)));
  });
```

#### Cleanup
Automated cleanup every 6 hours via Vercel Cron:
```bash
0 */6 * * *  # Every 6 hours
```

### 4. Idempotency Protection

#### Purpose
Prevents duplicate financial transactions from:
- Network retries
- Double-clicks
- Request replays

#### Implementation
```typescript
// server/middleware/idempotency.ts
export async function runIdempotentAction<T>(
  key: string,
  userId: string,
  path: string,
  params: unknown,
  action: () => Promise<T>
): Promise<T> {
  // 1. Check if key exists (scoped to user)
  // 2. Verify request fingerprint
  // 3. Execute action
  // 4. Cache response
}
```

#### Usage
```typescript
// Client must include header
Idempotency-Key: <unique-uuid>
```

### 5. CORS (Cross-Origin Resource Sharing)

#### Configuration
- **Allowed Origins**: Environment-based (strict whitelist)
- **Credentials**: Enabled (for cookie-based auth)
- **Methods**: GET, POST, PUT, DELETE, PATCH, OPTIONS
- **Headers**: Content-Type, Authorization, Idempotency-Key, X-Request-ID
- **Max Age**: 24 hours

```typescript
// server/server.ts
app.use(
  "*",
  cors({
    origin: CORS_ORIGINS, // From environment variable
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    maxAge: 86400,
  })
);
```

### 6. Security Headers

#### HTTP Security Headers
All responses include:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Content-Type-Options` | `nosniff` | Prevent MIME type sniffing |
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-XSS-Protection` | `1; mode=block` | Enable XSS filter |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Control referrer leakage |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disable browser features |
| `Cross-Origin-Embedder-Policy` | `require-corp` | Prevent Spectre attacks |
| `Cross-Origin-Opener-Policy` | `same-origin` | Prevent cross-origin leaks |
| `Cross-Origin-Resource-Policy` | `same-origin` | Prevent cross-origin reads |

#### Content Security Policy
```typescript
// server/server.ts
secureHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:", "blob:"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'", "https:", "data:"],
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"],
  },
})
```

### 7. Request Body Protection

#### Body Size Limit
- **Limit**: 1MB (1,048,576 bytes)
- **Purpose**: Prevent DoS attacks
- **Error**: 413 Payload Too Large

```typescript
// server/server.ts
app.use(
  "*",
  bodyLimit({
    maxSize: BODY_LIMIT_BYTES,
    onError: (c) => c.json({ error: "Request body too large" }, 413),
  })
);
```

#### Request Timeout
- **Timeout**: 30 seconds
- **Purpose**: Prevent hanging requests
- **Error**: 408 Request Timeout

```typescript
// server/server.ts
app.use("*", timeout(REQUEST_TIMEOUT_MS));
```

### 8. Logging & Audit

#### Safe Logger
- **PII Redaction**: Automatically redacts sensitive data
- **Redacted Fields**: Passwords, tokens, personal information
- **Format**: Structured JSON logs

```typescript
// server/middleware/safe-logger.ts
app.use("*", safeLogger());
```

#### Audit Trail
All financial operations are logged:
- User ID
- Action (CREATE, UPDATE, DELETE)
- Entity type and ID
- Timestamp
- IP address
- User agent
- Changes (before/after)

```typescript
// server/services/audit.ts
await logAudit({
  userId: userId,
  action: "CREATE",
  entityType: "expenses",
  entityId: newExpense.id,
  metadata: { ip, userAgent },
  changes: { before: null, after: newExpense }
});
```

### 9. Database Security

#### Transaction Safety
All financial operations use database transactions:
```typescript
await db.transaction(async (tx) => {
  try {
    // 1. Create expense
    // 2. Create ledger entries
    // 3. Log audit
  } catch (error) {
    // Automatic rollback on error
    throw error;
  }
});
```

#### Soft Deletes
Sensitive data uses soft deletes:
- `deletedAt` timestamp instead of permanent deletion
- Audit trail preservation
- Compliance with data retention policies

### 10. POPIA Compliance (South Africa)

#### Personal Information Protection
- **Encryption**: All PII encrypted at rest
- **Access Control**: Role-based access to sensitive data
- **Data Minimization**: Only collect necessary information
- **Retention**: Automated cleanup of old data

#### User Rights
- **Access**: Users can export their data
- **Correction**: Users can update their information
- **Deletion**: Account deletion with audit trail

## Security Best Practices

### For Developers

1. **Never log sensitive data**
   ```typescript
   // ❌ Bad
   console.log("User login:", email, password);
   
   // ✅ Good
   console.log("User login attempt:", { email, success });
   ```

2. **Always validate input**
   ```typescript
   // ❌ Bad
   const description = body.description;
   
   // ✅ Good
   const { description } = c.req.valid("json");
   const sanitized = sanitize(description);
   ```

3. **Use parameterized queries**
   ```typescript
   // ✅ Good (Drizzle ORM handles this)
   await db.query.users.findFirst({
     where: eq(users.email, email),
   });
   ```

4. **Implement idempotency for financial operations**
   ```typescript
   // ✅ Good
   const result = await runIdempotentAction(
     idempotencyKey,
     userId,
     "/expenses",
     body,
     async () => { /* create expense */ }
   );
   ```

### For Operations

1. **Rotate secrets regularly**
   - JWT_SECRET: Every 90 days
   - Database passwords: Every 90 days
   - API keys: Every 90 days

2. **Monitor for suspicious activity**
   - Failed login attempts
   - Rate limit violations
   - Unusual transaction patterns

3. **Keep dependencies updated**
   ```bash
   bun update
   bunx npm-check-updates -u
   ```

4. **Regular security audits**
   - Monthly dependency vulnerability scans
   - Quarterly penetration testing
   - Annual security review

## Incident Response

### Security Vulnerability Reporting

If you discover a security vulnerability:

1. **DO NOT** create a public GitHub issue
2. Email: security@zarledger.co.za
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Assessment**: Within 7 days
- **Fix**: Within 30 days (depending on severity)
- **Disclosure**: Coordinated with reporter

## Security Checklist for Production

Before deploying to production:

- [ ] JWT_SECRET is cryptographically secure
- [ ] DATABASE_URL uses SSL/TLS
- [ ] CORS_ORIGINS only includes production domains
- [ ] All environment variables are set in Vercel
- [ ] Rate limiting is enabled
- [ ] Security headers are configured
- [ ] Database backups are configured
- [ ] Monitoring/alerting is set up
- [ ] SSL certificate is valid
- [ ] Dependencies are up to date
- [ ] Security scan passes (GitHub Actions)

## Compliance

### South African Regulations

- **POPIA**: Protection of Personal Information Act
- **FICA**: Financial Intelligence Centre Act (for payments)
- **CPA**: Consumer Protection Act

### International Standards

- **OWASP Top 10**: All common vulnerabilities addressed
- **CWE/SANS Top 25**: Common weakness enumeration
- **GDPR**: General Data Protection Regulation (for EU users)

## Contact

Security questions or concerns:
- Email: security@zarledger.co.za
- GitHub: [Security Advisories](https://github.com/your-org/zar-ledger/security/advisories)

---

**Last Updated:** 2026-03-28  
**Version:** 1.0.0
