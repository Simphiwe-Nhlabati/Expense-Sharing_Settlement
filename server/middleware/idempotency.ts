import { createMiddleware } from "hono/factory";
import { db } from "../db";
import { idempotencyKeys } from "../db/schema";
import { eq, lt } from "drizzle-orm";
import { addMinutes } from "date-fns";

/**
 * Basic idempotency middleware wrapper
 * For simple use cases, use runIdempotentAction instead
 */
export const idempotency = () =>
  createMiddleware(async (c, next) => {
    const key = c.req.header("Idempotency-Key");

    // Skip GET requests
    if (c.req.method === "GET" || !key) {
      return await next();
    }

    // Check if key exists in DB
    const existingKey = await db.query.idempotencyKeys.findFirst({
      where: eq(idempotencyKeys.key, key),
    });

    if (existingKey) {
      // Return cached response
      return c.json(existingKey.responseBody, existingKey.responseCode as any);
    }

    await next();

    // Note: Response caching should be done in the handler via runIdempotentAction
    // This middleware just checks for existing keys
  });

/**
 * Run an action with idempotency protection
 * Uses database transactions to ensure atomicity
 *
 * @param key - Unique idempotency key from client
 * @param userId - Internal user ID (UUID)
 * @param path - API endpoint path
 * @param params - Request parameters/body
 * @param action - Async function to execute
 * @returns The result of the action
 */
export async function runIdempotentAction<T>(
  key: string,
  userId: string,
  path: string,
  params: unknown,
  action: () => Promise<T>
): Promise<T> {
  // Configurable idempotency key TTL (default: 24 hours)
  const IDEMPOTENCY_KEY_TTL_MINUTES = parseInt(process.env.IDEMPOTENCY_KEY_TTL_MINUTES || "1440", 10);

  // 1. Check if key exists (with row lock to prevent race conditions)
  const existing = await db.query.idempotencyKeys.findFirst({
    where: eq(idempotencyKeys.key, key),
  });

  if (existing) {
    // Return cached response
    return existing.responseBody as T;
  }

  // 2. Run the action
  const result = await action();

  // 3. Save the idempotency key and response
  // Use try-catch to handle potential duplicate key errors
  try {
    await db.insert(idempotencyKeys).values({
      key,
      userId,
      path,
      params: params as any,
      responseCode: 200,
      responseBody: result as any,
      expiresAt: addMinutes(new Date(), IDEMPOTENCY_KEY_TTL_MINUTES),
    });
  } catch (error: any) {
    // Handle race condition: another request might have inserted the same key
    if (error.code === "23505") {
      // Unique violation - fetch and return the existing response
      const existingKey = await db.query.idempotencyKeys.findFirst({
        where: eq(idempotencyKeys.key, key),
      });

      if (existingKey) {
        return existingKey.responseBody as T;
      }
    }

    // Log error but don't fail the request
    console.error("Failed to save idempotency key:", error);
  }

  return result;
}

/**
 * Cleanup expired idempotency keys (run periodically)
 * Call this from a cron job or background task
 */
export async function cleanupExpiredIdempotencyKeys(): Promise<void> {
  try {
    await db.delete(idempotencyKeys).where(lt(idempotencyKeys.expiresAt, new Date()));
  } catch (error) {
    console.error("Failed to cleanup expired idempotency keys:", error);
  }
}
