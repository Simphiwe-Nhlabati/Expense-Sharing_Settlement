"use server"

import { revalidatePath } from "next/cache"
import { createGroupSchema, type CreateGroupInput } from "@/lib/schemas"
import { db } from "@/server/db"
import { groups, groupMembers, users } from "@/server/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { getAuthenticatedUser } from "./auth"
import { generateInviteCode } from "@/lib/invite-code"
import { logAudit } from "@/server/services/audit"

export async function getGroups() {
  const user = await getAuthenticatedUser()

  if (!user) {
    return []
  }

  const userGroups = await db.select({
      id: groups.id,
      name: groups.name,
      description: groups.description,
      currency: groups.currency,
      inviteCode: groups.inviteCode,
      role: groupMembers.role,
  })
  .from(groups)
  .innerJoin(groupMembers, and(
    eq(groups.id, groupMembers.groupId),
    eq(groupMembers.userId, user.id)
  ))
  .orderBy(desc(groups.createdAt));

  return userGroups.map(g => ({
      ...g,
      members: 1,
      balance: 0,
  }));
}

export async function getGroup(id: string) {
  const user = await getAuthenticatedUser()
  if (!user) return null

  // Ensure user is a member
  const memberCheck = await db.query.groupMembers.findFirst({
      where: and(eq(groupMembers.groupId, id), eq(groupMembers.userId, user.id))
  })
  
  if (!memberCheck) return null

  const group = await db.query.groups.findFirst({
      where: eq(groups.id, id),
  })

  if (!group) return null;

  // Fetch members with user details
  const members = await db.select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      avatarUrl: users.avatarUrl,
      role: groupMembers.role,
  })
  .from(groupMembers)
  .innerJoin(users, eq(groupMembers.userId, users.id))
  .where(eq(groupMembers.groupId, id));

  return {
      ...group,
      members
  };
}

export async function createGroup(input: CreateGroupInput) {
  const user = await getAuthenticatedUser()

  if (!user) {
      return { success: false, error: "Unauthorized. Please sign in and try again." }
  }

  const result = createGroupSchema.safeParse(input)

  if (!result.success) {
    return { success: false, error: "Invalid input. Please check your entries." }
  }

  try {
      let inviteCode = generateInviteCode();
      let attempts = 0;
      while (attempts < 5) {
          const existing = await db.query.groups.findFirst({
              where: eq(groups.inviteCode, inviteCode)
          });
          if (!existing) break;
          inviteCode = generateInviteCode();
          attempts++;
      }

      const newGroup = await db.transaction(async (tx) => {
          const [group] = await tx.insert(groups).values({
              name: result.data.name,
              description: result.data.description,
              createdBy: user.id,
              currency: "ZAR",
              inviteCode,
          }).returning();

          await tx.insert(groupMembers).values({
              groupId: group.id,
              userId: user.id,
              role: "OWNER",
          }).returning();

          return group;
      });

      await logAudit({
          userId: user.id,
          action: "CREATE",
          entityType: "groups",
          entityId: newGroup.id,
          metadata: { inviteCode },
          changes: { before: null, after: newGroup }
      });

      revalidatePath("/")
      revalidatePath("/groups")
      return { success: true, data: newGroup }
  } catch {
      return { success: false, error: "Failed to create group. Please try again." }
  }
}

/**
 * Join a group using a unique invite code.
 * Idempotent: If already a member, returns success.
 */
export async function joinGroupByCode(inviteCode: string) {
  const user = await getAuthenticatedUser()
  if (!user) return { success: false, error: "Unauthorized" }

  const code = inviteCode.trim().toUpperCase();
  if (!code) return { success: false, error: "Invalid invite code" }

  // Find the group
  const group = await db.query.groups.findFirst({
      where: and(
          eq(groups.inviteCode, code),
          eq(groups.deletedAt, null)
      )
  });

  if (!group) return { success: false, error: "Group not found. Check the invite code and try again." }

  // Idempotency: check if already a member
  const existingMembership = await db.query.groupMembers.findFirst({
      where: and(
          eq(groupMembers.groupId, group.id),
          eq(groupMembers.userId, user.id)
      )
  });

  if (existingMembership) {
      return { success: true, data: { groupId: group.id, alreadyMember: true } }
  }

  // Add member
  await db.insert(groupMembers).values({
      groupId: group.id,
      userId: user.id,
      role: "MEMBER",
  });

  await logAudit({
      userId: user.id,
      action: "CREATE",
      entityType: "group_members",
      entityId: group.id,
      metadata: { inviteCode: code, joinedAs: "MEMBER" },
      changes: { before: null, after: { groupId: group.id, userId: user.id } }
  });

  revalidatePath("/")
  return { success: true, data: { groupId: group.id, alreadyMember: false } }
}
