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
// TEMPORARILY DISABLED: Subscription middleware - Paystack integration coming soon
// import { attachSubscriptionContext } from "./middleware/subscription-meter";
import { HonoEnv } from "./types";

const app = new Hono<HonoEnv>().basePath("/api");

// --- Global Middleware Stack (Ordered for Security) ---

// 1. Request ID (first for tracing all requests)
app.use("*", requestId());

// 2. Body Limit (before parsing to prevent DoS)
app.use(
  "*",
  bodyLimit({
    maxSize: 1024 * 1024, // 1MB limit
    onError: (c) => c.json({ error: "Request body too large", limit: "1MB" }, 413),
  })
);

// 3. Timeout (prevent hanging requests - 30 seconds)
app.use("*", timeout(30000));

// 4. Safe Logger (with PII redaction)
app.use("*", safeLogger());

// 5. CORS (restrict to allowed origins)
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
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
