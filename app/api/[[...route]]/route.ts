import { handle } from "hono/vercel";
import app from "@/server/server";

// Node.js runtime required for SSE (Server-Sent Events) long-lived connections.
// Edge runtime doesn't support streaming keep-alive for the /api/realtime/* route.
export const runtime = "nodejs";

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
