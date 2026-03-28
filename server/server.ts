import { Hono } from "hono";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { bodyLimit } from "hono/body-limit";
import { timeout } from "hono/timeout";
import { logger } from "hono/logger";
import { requestId } from "./middleware/request-id";
import { safeLogger } from "./middleware/safe-logger";
import { rateLimiter } from "./middleware/rate-limiter";
import { auth } from "./middleware/auth";
import { sanitizeBody } from "./middleware/sanitization";
import { errorHandler } from "./middleware/error-handler";
// TEMPORARILY DISABLED: Subscription middleware - Paystack integration coming soon
// import { attachSubscriptionContext } from "./middleware/subscription-meter";
import { HonoEnv } from "./types";

const app = new Hono<HonoEnv>().basePath("/api");

// --- Configuration from Environment Variables ---
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const BODY_LIMIT_BYTES = parseInt(process.env.BODY_LIMIT_BYTES || "1048576", 10); // 1MB default
const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || "30000", 10); // 30s default
const CORS_ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:3001").split(",");

// --- Global Middleware Stack (Ordered for Security) ---

// 0. Error Handler (MUST be first to catch all errors)
app.use("*", errorHandler());

// 1. Request ID (first for tracing all requests)
app.use("*", requestId());

// 2. Body Limit (before parsing to prevent DoS)
app.use(
  "*",
  bodyLimit({
    maxSize: BODY_LIMIT_BYTES,
    onError: (c) => c.json({ error: "Request body too large", limit: `${Math.round(BODY_LIMIT_BYTES / 1024 / 1024)}MB` }, 413),
  })
);

// 3. Timeout (prevent hanging requests)
app.use("*", timeout(REQUEST_TIMEOUT_MS));

// 4. Safe Logger (with PII redaction)
app.use("*", safeLogger());

// 5. CORS (restrict to allowed origins)
// In production, dynamically validate origin against allowed list
app.use(
  "*",
  cors({
    origin: (origin, c) => {
      // In development, allow all localhost origins
      if (!IS_PRODUCTION) {
        if (origin && (origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1"))) {
          return origin;
        }
        return CORS_ORIGINS[0] || "http://localhost:3000";
      }

      // In production, strictly validate against allowed origins
      if (origin && CORS_ORIGINS.includes(origin)) {
        return origin;
      }

      // Default to first allowed origin if no origin provided (same-origin requests)
      return CORS_ORIGINS[0] || "";
    },
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
app.use("/subscription/*", rateLimiter(30)); // 30 requests/minute for subscription operations
app.use("*", rateLimiter(200)); // General limit: 200 requests/minute

// 8. Request Sanitization (sanitize all JSON body inputs)
app.use("*", sanitizeBody());

// 9. Pretty JSON (for readable responses in dev)
app.use("*", prettyJSON());

// 10. Authentication (protected routes only)
// Note: sign-in, sign-up are public - auth is applied inside the route handler where needed
app.use("/auth/me", auth());
app.use("/expenses/*", auth());
app.use("/groups/*", auth());
app.use("/realtime/*", auth());
// TEMPORARILY DISABLED: Subscription context - Paystack integration coming soon
// app.use("/subscription/*", attachSubscriptionContext());
// app.use("/groups/*", attachSubscriptionContext());

// --- Routes ---
import authRoutes from "./routes/auth";
import groupRoutes from "./routes/groups";
import expenseRoutes from "./routes/expenses";
import realtimeRoutes from "./routes/realtime";
import subscriptionRoutes from "./routes/subscription";

app.route("/auth", authRoutes);
app.route("/groups", groupRoutes);
app.route("/expenses", expenseRoutes);
app.route("/realtime", realtimeRoutes);
app.route("/subscription", subscriptionRoutes);

// --- Health Check (public) ---
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default app;
