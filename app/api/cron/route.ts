/**
 * Cron Job Handler for Background Cleanup Tasks
 *
 * This endpoint is called periodically by Vercel Cron Jobs
 * to perform maintenance tasks:
 * - Clean up expired rate limit logs
 * - Clean up expired idempotency keys
 *
 * Security: Protected by Vercel Cron header verification
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { rateLimitLogs, idempotencyKeys } from "@/server/db/schema";
import { lt, sql } from "drizzle-orm";

// Verify Vercel cron header
function verifyCronAuth(request: NextRequest): boolean {
  const cronHeader = request.headers.get("x-vercel-protection-bypass");
  const cronSecret = process.env.CRON_SECRET;

  // In production, verify the cron secret
  if (process.env.NODE_ENV === "production") {
    if (!cronHeader || (cronSecret && cronHeader !== cronSecret)) {
      return false;
    }
  }

  return true;
}

// POST /api/cron/cleanup
export async function POST(request: NextRequest) {
  // Verify authentication
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  try {
    // 1. Clean up old rate limit logs (older than 5 minutes)
    const RETENTION_MINUTES = parseInt(process.env.RATE_LIMIT_RETENTION_MINUTES || "5", 10);
    const rateLimitCutoff = new Date(Date.now() - RETENTION_MINUTES * 60 * 1000);

    const rateLimitResult = await db
      .delete(rateLimitLogs)
      .where(lt(rateLimitLogs.timestamp, rateLimitCutoff))
      .returning({ count: sql<number>`count(*)` });

    results.rateLimitLogsDeleted = Number(rateLimitResult[0]?.count ?? 0);

    // 2. Clean up expired idempotency keys
    const idempotencyResult = await db
      .delete(idempotencyKeys)
      .where(lt(idempotencyKeys.expiresAt, new Date()))
      .returning({ count: sql<number>`count(*)` });

    results.idempotencyKeysDeleted = Number(idempotencyResult[0]?.count ?? 0);

    // 3. Log cleanup completion
    console.log("[CRON] Cleanup completed:", results);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...results,
    });
  } catch (error) {
    console.error("[CRON] Cleanup failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Cleanup failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET /api/cron/health - Health check for cron endpoint
export async function GET(request: NextRequest) {
  try {
    // Quick database connectivity check
    await db.select({ count: sql<number>`count(*)` }).from(rateLimitLogs);

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      cronEnabled: process.env.NODE_ENV === "production",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Database check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
