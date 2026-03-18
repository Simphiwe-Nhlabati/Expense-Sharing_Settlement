/**
 * Standalone Hono Backend Server
 * Runs independently from Next.js for development purposes
 *
 * Security features:
 * - Body size limit (1MB)
 * - Request timeout (30s)
 * - Rate limiting (database-backed)
 * - XSS protection
 * - PII redaction in logs
 * - Enhanced security headers
 * - CORS restriction
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { bodyLimit } from "hono/body-limit";
import { timeout } from "hono/timeout";
import { requestId } from "./middleware/request-id";
import { safeLogger } from "./middleware/safe-logger";
import { rateLimiter } from "./middleware/rate-limiter";
import { auth } from "./middleware/auth";
import { sanitizeBody } from "./middleware/sanitization";
import { HonoEnv } from "./types";

const app = new Hono<HonoEnv>().basePath("/api");

// --- Configuration from Environment Variables ---
const BODY_LIMIT_BYTES = parseInt(process.env.BODY_LIMIT_BYTES || "1048576", 10); // 1MB default
const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || "30000", 10); // 30s default
const CORS_ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:3001").split(",");

// --- Global Middleware Stack (Ordered for Security) ---

// 1. Request ID (first for tracing all requests)
app.use("*", requestId());

// 2. Body Limit (before parsing to prevent DoS)
app.use(
  "*",
  bodyLimit({
    maxSize: BODY_LIMIT_BYTES,
    onError: (c) => c.json({ error: "Request body too large", limit: `${BODY_LIMIT_BYTES / 1024 / 1024}MB` }, 413),
  })
);

// 3. Timeout (prevent hanging requests)
app.use("*", timeout(REQUEST_TIMEOUT_MS));

// 4. Safe Logger (with PII redaction)
app.use("*", safeLogger());

// 5. CORS (restrict to allowed origins)
app.use(
  "*",
  cors({
    origin: CORS_ORIGINS,
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "Idempotency-Key",
      "X-Request-ID",
      "X-Forwarded-For",
    ],
    exposeHeaders: ["X-Request-ID"],
    maxAge: 86400, // 24 hours
  })
);

// 6. Secure Headers (enhanced security headers)
app.use(
  "*",
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
    xFrameOptions: "DENY",
    xContentTypeOptions: "nosniff",
    referrerPolicy: "strict-origin-when-cross-origin",
    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: [],
      payment: [],
    },
    crossOriginEmbedderPolicy: "require-corp",
    crossOriginOpenerPolicy: "same-origin",
    crossOriginResourcePolicy: "same-origin",
  })
);

// 7. Rate Limiter (database-backed)
app.use("/expenses/*", rateLimiter(50)); // 50 requests/minute for expense operations
app.use("/groups/*", rateLimiter(100)); // 100 requests/minute for group operations
app.use("*", rateLimiter(200)); // General limit: 200 requests/minute

// 8. Request Sanitization (sanitize all JSON body inputs)
app.use("*", sanitizeBody());

// 9. Pretty JSON (for readable responses in dev)
app.use("*", prettyJSON());

// 10. Authentication (protected routes only)
app.use("/expenses/*", auth());
app.use("/groups/*", auth());
app.use("/realtime/*", auth());

// --- Routes ---
import authRoutes from "./routes/auth";
import groupRoutes from "./routes/groups";
import expenseRoutes from "./routes/expenses";
import realtimeRoutes from "./routes/realtime";

app.route("/auth", authRoutes);
app.route("/groups", groupRoutes);
app.route("/expenses", expenseRoutes);
app.route("/realtime", realtimeRoutes);

// --- Health Check (public) ---
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// --- Start Server ---
const port = process.env.BACKEND_PORT || 3001;

console.log(`🚀 Backend server starting on http://localhost:${port}`);
console.log(`   Health check: http://localhost:${port}/api/health`);

const server = {
  port,
  fetch: app.fetch,
};

export { server };
export default server;
