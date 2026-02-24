import { createMiddleware } from "hono/factory";
import { db } from "../db";
import { rateLimitLogs } from "../db/schema";
import { and, eq, gte, sql, lt } from "drizzle-orm";

// Configurable rate limiter window with sensible default (1 minute)
const WINDOW_SIZE_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10);

/**
 * Database-backed rate limiter
 * Uses PostgreSQL for persistent rate limiting across server restarts
 */
export const rateLimiter = (limit = 100) =>
  createMiddleware(async (c, next) => {
    const ip = c.req.header("x-forwarded-for") || "127.0.0.1";
    const now = new Date();
    const windowStart = new Date(now.getTime() - WINDOW_SIZE_MS);

    try {
      // Count requests in the last minute
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(rateLimitLogs)
        .where(and(eq(rateLimitLogs.ip, ip), gte(rateLimitLogs.timestamp, windowStart)));

      const requestCount = Number(result[0]?.count ?? 0);

      if (requestCount >= limit) {
        const retryAfter = Math.ceil(WINDOW_SIZE_MS / 1000);
        return c.json(
          {
            error: "Too many requests",
            retryAfter,
            limit,
          },
          429
        );
      }

      // Log this request
      await db.insert(rateLimitLogs).values({
        ip,
        timestamp: now,
        path: c.req.path,
        method: c.req.method,
      });

      await next();
    } catch (error) {
      // If DB fails, allow the request but log the error
      console.error("Rate limiter DB error:", error);
      await next();
    }
  });

/**
 * Cleanup old rate limit logs (run periodically)
 * Call this from a cron job or background task
 */
export async function cleanupRateLimitLogs(): Promise<void> {
  // Configurable cleanup retention (default: 5 minutes)
  const RETENTION_MINUTES = parseInt(process.env.RATE_LIMIT_RETENTION_MINUTES || "5", 10);
  const cutoff = new Date(Date.now() - RETENTION_MINUTES * 60 * 1000);

  try {
    await db.delete(rateLimitLogs).where(lt(rateLimitLogs.timestamp, cutoff));
  } catch (error) {
    console.error("Failed to cleanup rate limit logs:", error);
  }
}
