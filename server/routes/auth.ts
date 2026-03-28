import { Hono, Context } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { generateAccessToken, generateRefreshToken, hashPassword, verifyPassword } from "../services/auth";
import { auth } from "../middleware/auth";
import { v4 as uuidv4 } from "uuid";
import { HonoEnv } from "../types";
import { setCookie } from "hono/cookie";
import { ApiError } from "../middleware/error-handler";

// Configuration from environment
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const COOKIE_SECURE = IS_PRODUCTION;
const ACCESS_TOKEN_MAX_AGE = parseInt(process.env.JWT_ACCESS_TOKEN_MAX_AGE_SECONDS || "900", 10); // 15 minutes
const REFRESH_TOKEN_MAX_AGE = parseInt(process.env.JWT_REFRESH_TOKEN_MAX_AGE_SECONDS || "604800", 10); // 7 days

const app = new Hono<HonoEnv>();

// Schema for Sign Up
const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().optional(),
});

// Schema for Sign In
const signInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

/**
 * Set authentication cookies with secure configuration.
 * Tokens are NOT returned in JSON body to prevent XSS token exfiltration.
 */
function setAuthCookies(c: Context<HonoEnv>, accessToken: string, refreshToken: string) {
  setCookie(c, "access_token", accessToken, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: "Lax",
    maxAge: ACCESS_TOKEN_MAX_AGE,
    path: "/",
  });

  setCookie(c, "refresh_token", refreshToken, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: "Lax",
    maxAge: REFRESH_TOKEN_MAX_AGE,
    path: "/",
  });
}

// POST /auth/sign-up
app.post("/sign-up", zValidator("json", signUpSchema), async (c) => {
  try {
    const { email, password, fullName } = c.req.valid("json");

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (existingUser) {
      throw ApiError.badRequest("User with this email already exists");
    }

    const passwordHash = await hashPassword(password);

    const authId = uuidv4();

    const [newUser] = await db.insert(users).values({
      authId,
      email: email.toLowerCase(),
      fullName: fullName || null,
      passwordHash,
    }).returning();

    const accessToken = await generateAccessToken(authId, email.toLowerCase());
    const refreshToken = await generateRefreshToken(authId);

    // Set secure HTTP-only cookies
    setAuthCookies(c, accessToken, refreshToken);

    // SECURITY: Do NOT return tokens in JSON body
    // Tokens are stored exclusively in HTTP-only cookies to prevent XSS exfiltration
    return c.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error("[AUTH] Sign up error:", error);
    throw ApiError.internal("Failed to create account");
  }
});

// POST /auth/sign-in
app.post("/sign-in", zValidator("json", signInSchema), async (c) => {
  try {
    const { email, password } = c.req.valid("json");

    // Find user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (!user) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    // Verify password
    const validPassword = await verifyPassword(password, user.passwordHash || "");

    if (!validPassword) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    // Generate tokens
    const accessToken = await generateAccessToken(user.authId, user.email);
    const refreshToken = await generateRefreshToken(user.authId);

    // Set secure HTTP-only cookies
    setAuthCookies(c, accessToken, refreshToken);

    // SECURITY: Do NOT return tokens in JSON body
    // Tokens are stored exclusively in HTTP-only cookies to prevent XSS exfiltration
    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error("[AUTH] Sign in error:", error);
    throw ApiError.internal("Failed to sign in");
  }
});

// POST /auth/sign-out
app.post("/sign-out", async (c) => {
  // Clear cookies
  setCookie(c, "access_token", "", {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: "Lax",
    maxAge: 0,
    path: "/",
  });

  setCookie(c, "refresh_token", "", {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: "Lax",
    maxAge: 0,
    path: "/",
  });

  return c.json({ success: true });
});

// GET /auth/me - Get current user (protected route)
app.get("/me", auth(), async (c) => {
  const authId = c.get("authId");

  if (!authId) {
    throw ApiError.unauthorized("Authentication required");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.authId, authId),
  });

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
    },
  });
});

export default app;
