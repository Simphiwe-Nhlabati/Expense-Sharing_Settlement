"use server"

import { cookies } from "next/headers"
import { db } from "@/server/db"
import { users } from "@/server/db/schema"
import { eq } from "drizzle-orm"
import { verifyAccessToken } from "@/server/services/auth"

export interface AuthUser {
  id: string;
  authId: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
}

/**
 * Get the current authenticated user from JWT cookie
 */
export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("access_token")?.value

    if (!accessToken) {
      return null
    }

    const payload = await verifyAccessToken(accessToken)

    if (!payload) {
      return null
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.authId, payload.userId),
    })

    if (!dbUser) {
      return null
    }

    return {
      id: dbUser.id,
      authId: dbUser.authId,
      email: dbUser.email,
      fullName: dbUser.fullName,
      avatarUrl: dbUser.avatarUrl,
    }
  } catch {
    return null
  }
}

/**
 * Ensure the current user is synced to the database.
 * Call this before any operation that requires a user record.
 */
export async function ensureUserSynced(): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("access_token")?.value

    if (!accessToken) {
      return { success: false, error: "Not authenticated" }
    }

    const payload = await verifyAccessToken(accessToken)
    if (!payload) {
      return { success: false, error: "Invalid token" }
    }

    // Check if user exists in DB
    const dbUser = await db.query.users.findFirst({
      where: eq(users.authId, payload.userId),
    })

    if (!dbUser) {
      // User not in DB - this shouldn't happen in normal flow
      // but we can create a minimal record if needed
      return { success: false, error: "User not found in database" }
    }

    return {
      success: true,
      user: {
        id: dbUser.id,
        authId: dbUser.authId,
        email: dbUser.email,
        fullName: dbUser.fullName,
        avatarUrl: dbUser.avatarUrl,
      },
    }
  } catch (error) {
    console.error("[AUTH] Error ensuring user synced:", error)
    return { success: false, error: "Failed to sync user" }
  }
}

/**
 * Create a new user in the database
 */
export async function createUser(userData: {
  authId: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
}): Promise<AuthUser | null> {
  try {
    const [newUser] = await db.insert(users).values({
      authId: userData.authId,
      email: userData.email,
      fullName: userData.fullName || null,
      avatarUrl: userData.avatarUrl || null,
    }).returning()

    return {
      id: newUser.id,
      authId: newUser.authId,
      email: newUser.email,
      fullName: newUser.fullName,
      avatarUrl: newUser.avatarUrl,
    }
  } catch (error) {
    console.error("[AUTH] Error creating user:", error)
    return null
  }
}
