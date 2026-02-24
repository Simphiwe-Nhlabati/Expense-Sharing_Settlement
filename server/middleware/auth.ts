import { verifyAccessToken } from "@/server/services/auth";
import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";

export const auth = () =>
  createMiddleware(async (c, next) => {
    try {
      const authHeader = c.req.header("Authorization");
      const accessToken = getCookie(c, "access_token");

      let token: string | null = null;

      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      } else if (accessToken) {
        token = accessToken;
      }

      if (!token) {
        return c.json({ error: "Unauthorized", message: "No authentication token provided" }, 401);
      }

      const payload = await verifyAccessToken(token);

      if (!payload) {
        return c.json({ error: "Unauthorized", message: "Invalid or expired token" }, 401);
      }

      c.set("authId", payload.userId);
      c.set("userId", payload.userId);
      c.set("userEmail", payload.email);

      await next();
    } catch (error) {
      return c.json({ error: "Unauthorized", message: "Authentication failed" }, 401);
    }
  });

/**
 * Optional auth - doesn't fail if no token, but sets user context if valid token provided
 */
export const optionalAuth = () =>
  createMiddleware(async (c, next) => {
    try {
      const authHeader = c.req.header("Authorization");
      const accessToken = getCookie(c, "access_token");

      let token: string | null = null;

      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      } else if (accessToken) {
        token = accessToken;
      }

      if (token) {
        const payload = await verifyAccessToken(token);
        if (payload) {
          c.set("authId", payload.userId);
          c.set("userId", payload.userId);
          c.set("userEmail", payload.email);
        }
      }

      await next();
    } catch (error) {
      // Silently continue - optional auth
      await next();
    }
  });
