import { SignJWT, jwtVerify } from "jose";
import { v4 as uuidv4 } from "uuid";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-this-in-production"
);

// Configurable token expiry times with sensible defaults
const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_TOKEN_EXPIRY || "15m";
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_TOKEN_EXPIRY || "7d";

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Hash a password using Bun.password (Bun runtime)
 * Uses Argon2id by default (recommended for security)
 */
export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password);
}

/**
 * Verify a password against a hash using Bun.password (Bun runtime)
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return Bun.password.verify(password, hash);
}

/**
 * Generate an access token (short-lived)
 */
export async function generateAccessToken(userId: string, email: string): Promise<string> {
  return new SignJWT({ userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setJti(uuidv4())
    .sign(JWT_SECRET);
}

/**
 * Generate a refresh token (long-lived)
 */
export async function generateRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .setJti(uuidv4())
    .sign(JWT_SECRET);
}

/**
 * Verify an access token
 */
export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      iat: payload.iat as number | undefined,
      exp: payload.exp as number | undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Verify a refresh token
 */
export async function verifyRefreshToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { userId: payload.userId as string };
  } catch {
    return null;
  }
}
