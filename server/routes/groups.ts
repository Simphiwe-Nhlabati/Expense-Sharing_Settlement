import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";
import { groups, groupMembers, users } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { verifyGroupMember } from "../middleware/group-auth";
import { subscriptionMeter } from "../middleware/subscription-meter";
import { logAudit } from "../services/audit";
import { sanitize } from "../middleware/sanitization";
import { v4 as uuidv4 } from "uuid";

import { HonoEnv } from "../types";

const app = new Hono<HonoEnv>();

// Schema for Creating Group
const createGroupSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

// Helper to get internal user ID from authId
async function getUserIdByAuthId(authId: string) {
    const user = await db.query.users.findFirst({
        where: eq(users.authId, authId)
    });
    return user?.id;
}

// GET /groups - List User's Groups
app.get("/", async (c) => {
  const authId = c.get("authId");

  if (!authId) return c.json({ error: "Unauthorized" }, 401);

  const userId = await getUserIdByAuthId(authId);

  if (!userId) return c.json({ error: "User profile not found" }, 404);

  const userGroups = await db.select({
      id: groups.id,
      name: groups.name,
      description: groups.description,
      currency: groups.currency,
      role: groupMembers.role,
  })
  .from(groups)
  .innerJoin(groupMembers, and(
    eq(groups.id, groupMembers.groupId),
    eq(groupMembers.userId, userId)
  ));

  // Add subscription info to response
  const tier = c.get("subscriptionTier");
  const limits = c.get("subscriptionLimits");

  return c.json({
    groups: userGroups,
    subscription: tier ? {
      tier,
      limits,
    } : undefined,
  });
});

// POST /groups - Create Group
app.post("/", subscriptionMeter("CREATE_GROUP"), zValidator("json", createGroupSchema), async (c) => {
  const authId = c.get("authId");
  
  const userId = await getUserIdByAuthId(authId);
  
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const { name, description } = c.req.valid("json");

  const inviteCode = `${name.toUpperCase().slice(0, 2)}-${uuidv4().slice(0, 4).toUpperCase()}`;

  const newGroup = await db.transaction(async (tx) => {
      const [group] = await tx.insert(groups).values({
          name: sanitize(name),
          description: description ? sanitize(description) : null,
          createdBy: userId,
          currency: "ZAR",
          inviteCode,
      }).returning();

      await tx.insert(groupMembers).values({
          groupId: group.id,
          userId: userId,
          role: "OWNER",
      }).returning();

      return group;
  });

  await logAudit({
      userId: userId,
      action: "CREATE",
      entityType: "groups",
      entityId: newGroup.id,
      metadata: { ip: c.req.header("x-forwarded-for"), userAgent: c.req.header("user-agent") },
      changes: { before: null, after: newGroup }
  });

  return c.json(newGroup, 201);
});

// GET /groups/:id - Get Details
app.get("/:id", verifyGroupMember(), async (c) => {
    const id = c.req.param("id");
    const group = await db.query.groups.findFirst({
        where: eq(groups.id, id),
        with: {
            members: {
                with: { user: true }
            },
            expenses: {
                limit: 10,
                orderBy: (expenses, { desc }) => [desc(expenses.createdAt)],
            }
        }
    });

    if (!group) return c.json({ error: "Group not found" }, 404);
    return c.json(group);
});

export default app;
