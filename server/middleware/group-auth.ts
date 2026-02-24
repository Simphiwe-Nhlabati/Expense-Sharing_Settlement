import { createMiddleware } from "hono/factory";
import { db } from "../db";
import { groupMembers, users } from "../db/schema";
import { eq, and } from "drizzle-orm";

export const verifyGroupMember = () => createMiddleware(async (c, next) => {
  const authId = c.get("authId");
  if (!authId) return c.json({ error: "Unauthorized" }, 401);

  // Try to find Group ID from param, query, or body
  const groupId = c.req.param("id") || c.req.query("groupId");

  if (!groupId) {
    // If not in param/query, maybe it's in the body (for POST/PUT)
    // But we avoid reading body if we can help it, or use it only for specific routes
    return await next();
  }

  const member = await db.select()
    .from(groupMembers)
    .innerJoin(users, eq(users.id, groupMembers.userId))
    .where(and(
      eq(groupMembers.groupId, groupId),
      eq(users.authId, authId)
    ))
    .limit(1);

  if (!member.length) {
    return c.json({ error: "Forbidden: You are not a member of this group" }, 403);
  }

  // Optionally store internal user ID in context
  c.set("userId", member[0].users.id);

  await next();
});
