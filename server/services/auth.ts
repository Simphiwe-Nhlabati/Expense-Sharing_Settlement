import { SignJWT, jwtVerify } from "jose";
import { v4 as uuidv4 } from "uuid";
import { hash, verify } from "@node-rs/argon2";

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
 * Hash a password using Argon2id (cross-platform: Node.js and Bun)
 * Uses Argon2id by default (recommended for security)
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    memoryCost: 19456, // 19 MB
    timeCost: 2,       // 2 iterations
    outputLen: 32,     // 32 bytes
    parallelism: 1,    // 1 parallel thread
  });
}

/**
 * Verify a password against a hash using Argon2id (cross-platform)
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return verify(hash, password);
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
