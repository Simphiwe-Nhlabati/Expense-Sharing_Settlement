import { createMiddleware } from "hono/factory";
import { db } from "../db";
import { groupMembers, users } from "../db/schema";
import { eq, and } from "drizzle-orm";

interface VerifyGroupMemberOptions {
  /**
   * Name of the URL parameter containing the group ID.
   * Defaults to "groupId" but can be "id" for legacy routes.
   */
  groupIdParam?: string;
  /**
   * If true, fail closed when groupId is absent (return 403).
   * If false, allow request to proceed (for optional group context).
   * Default: true (fail closed for security).
   */
  failClosed?: boolean;
}

/**
 * Middleware to verify that the authenticated user is a member of the specified group.
 * 
 * Security features:
 * - Normalized parameter lookup (configurable param name)
 * - Fail-closed by default when groupId is absent
 * - Stores both userId and groupId in context for downstream handlers
 */
export const verifyGroupMember = (options: VerifyGroupMemberOptions = {}) => {
  const {
    groupIdParam = "groupId",
    failClosed = true,
  } = options;

  return createMiddleware(async (c, next) => {
    const authId = c.get("authId");
    
    // Require authentication first
    if (!authId) {
      return c.json({ error: "Unauthorized: Authentication required" }, 401);
    }

    // Try to find Group ID from URL params (primary source)
    const groupIdFromParams = c.req.param(groupIdParam);
    
    // Fallback to query parameter for GET requests
    const groupIdFromQuery = c.req.query("groupId");
    
    const groupId = groupIdFromParams || groupIdFromQuery;

    if (!groupId) {
      if (failClosed) {
        // Security: fail closed - reject request when groupId is missing
        return c.json({ 
          error: "Forbidden: Group ID required",
          details: `Expected group ID in URL param ':${groupIdParam}' or query parameter 'groupId'`
        }, 403);
      }
      // Optional group context - allow but don't set userId
      return await next();
    }

    // Validate groupId format (UUID)
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(groupId)) {
      return c.json({ error: "Forbidden: Invalid group ID format" }, 403);
    }

    // Check group membership in database
    const member = await db.select()
      .from(groupMembers)
      .innerJoin(users, eq(users.id, groupMembers.userId))
      .where(and(
        eq(groupMembers.groupId, groupId),
        eq(users.authId, authId)
      ))
      .limit(1);

    if (!member.length) {
      // Log potential unauthorized access attempt
      console.warn("[GROUP-AUTH] Unauthorized access attempt:", {
        authId,
        groupId,
        path: c.req.path,
        method: c.req.method,
        timestamp: new Date().toISOString(),
      });
      
      return c.json({ error: "Forbidden: You are not a member of this group" }, 403);
    }

    // Store both internal user ID and group ID in context for downstream handlers
    c.set("userId", member[0].users.id);
    c.set("verifiedGroupId", groupId);

    await next();
  });
};
