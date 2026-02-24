import { createMiddleware } from "hono/factory";

/**
 * Safe Logger with PII Redaction
 * Prevents sensitive data from being logged to comply with POPIA
 */
export const safeLogger = () => createMiddleware(async (c, next) => {
  const start = Date.now();

  // Get request info
  const method = c.req.method;
  const path = c.req.path;
  const requestId = c.get("requestId") || "unknown";

  // Redact sensitive query parameters
  const safeQuery = redactSensitiveData(c.req.query());

  // Log request start (without sensitive data)
  console.log(`[${requestId}] <-- ${method} ${path}`);
  if (safeQuery && Object.keys(safeQuery).length > 0) {
    console.log(`[${requestId}]     Query: ${JSON.stringify(safeQuery)}`);
  }

  await next();

  // Log response
  const duration = Date.now() - start;
  const status = c.res.status;
  console.log(`[${requestId}] --> ${status} ${duration}ms`);
});

/**
 * Redact sensitive data from objects
 */
function redactSensitiveData(data?: Record<string, string | undefined>): Record<string, string> | undefined {
  if (!data) return undefined;

  const sensitiveKeys = [
    "password",
    "secret",
    "token",
    "api_key",
    "apikey",
    "authorization",
    "email",
    "id_number",
    "idnumber",
    "sa_id",
    "phone",
    "telephone",
    "credit_card",
    "card_number",
    "cvv",
  ];

  const redacted: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (!value) continue;

    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive));

    if (isSensitive) {
      redacted[key] = "[REDACTED]";
    } else {
      redacted[key] = value;
    }
  }

  return Object.keys(redacted).length > 0 ? redacted : undefined;
}

/**
 * Redact sensitive data from any object
 */
export function redactObject(obj: unknown): unknown {
  if (!obj || typeof obj !== "object") return obj;

  const sensitiveKeys = [
    "password",
    "secret",
    "token",
    "api_key",
    "apikey",
    "authorization",
    "email",
    "id_number",
    "idnumber",
    "sa_id",
    "phone",
    "telephone",
    "credit_card",
    "card_number",
    "cvv",
    "authId",
    "auth_id",
  ];

  if (Array.isArray(obj)) {
    return obj.map((item) => redactObject(item));
  }

  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive));

    if (isSensitive && typeof value === "string" && value.length > 0) {
      // Show first 2 chars and last 2 chars for debugging, redact middle
      redacted[key] = value.length <= 4 ? "[REDACTED]" : `${value.slice(0, 2)}...${value.slice(-2)}`;
    } else if (typeof value === "object" && value !== null) {
      redacted[key] = redactObject(value);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}
