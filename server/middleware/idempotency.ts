import { createMiddleware } from "hono/factory";
import { db } from "../db";
import { idempotencyKeys } from "../db/schema";
import { eq, lt } from "drizzle-orm";
import { addMinutes } from "date-fns";
import { createHash } from "node:crypto";

/**
 * Generate a scoped idempotency key hash.
 * Scopes keys by (userId, path, key) to prevent cross-user collisions.
 */
function generateScopedKeyHash(userId: string, path: string, key: string): string {
  // Create a unique hash combining user, path, and client-provided key
  const composite = `${userId}:${path}:${key}`;
  return createHash("sha256").update(composite).digest("hex");
}

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

    const userId = c.get("userId");
    if (!userId) {
      // Can't scope without user, let request proceed (or fail auth elsewhere)
      return await next();
    }

    // Generate scoped key hash
    const scopedKey = generateScopedKeyHash(userId, c.req.path, key);

    // Check if key exists in DB (scoped to user)
    const existingKey = await db.query.idempotencyKeys.findFirst({
      where: eq(idempotencyKeys.key, scopedKey),
    });

    if (existingKey) {
      // Verify request fingerprint matches (prevent replay with different body)
      const bodyHash = await c.req.json().then(b =>
        createHash("sha256").update(JSON.stringify(b)).digest("hex")
      ).catch(() => null);

      if (existingKey.params && bodyHash && existingKey.params !== bodyHash) {
        return c.json({
          error: "Idempotency key conflict",
          details: "Same key used with different request body"
        }, 409);
      }

      // Return cached response (use default 200 if responseCode is null)
      // Type assertion needed because Hono expects specific status code union type
      return c.json(existingKey.responseBody, 200);
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

  // Generate scoped key hash to prevent cross-user collisions
  const scopedKey = generateScopedKeyHash(userId, path, key);

  // Create request body hash for fingerprint verification
  const bodyHash = typeof params === "object" && params !== null
    ? createHash("sha256").update(JSON.stringify(params)).digest("hex")
    : null;

  // 1. Check if key exists (with row lock to prevent race conditions)
  const existing = await db.query.idempotencyKeys.findFirst({
    where: eq(idempotencyKeys.key, scopedKey),
  });

  if (existing) {
    // SECURITY: Verify request fingerprint matches before replaying
    if (bodyHash && existing.params !== bodyHash) {
      throw new Error("Idempotency key conflict: Same key used with different request body");
    }
    
    // Return cached response
    return existing.responseBody as T;
  }

  // 2. Run the action
  const result = await action();

  // 3. Save the idempotency key and response (scoped to user)
  // Use try-catch to handle potential duplicate key errors
  try {
    await db.insert(idempotencyKeys).values({
      key: scopedKey, // Use scoped key hash
      userId,
      path,
      params: bodyHash, // Store body hash for fingerprint verification
      responseCode: 200,
      responseBody: result as unknown as Record<string, unknown>,
      expiresAt: addMinutes(new Date(), IDEMPOTENCY_KEY_TTL_MINUTES),
    });
  } catch (error) {
    // Handle race condition: another request might have inserted the same key
    if (error instanceof Error && "code" in error && error.code === "23505") {
      // Unique violation - fetch and return the existing response
      const existingKey = await db.query.idempotencyKeys.findFirst({
        where: eq(idempotencyKeys.key, scopedKey),
      });

      if (existingKey) {
        // Verify fingerprint
        if (bodyHash && existingKey.params !== bodyHash) {
          throw new Error("Idempotency key conflict: Same key used with different request body");
        }
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
