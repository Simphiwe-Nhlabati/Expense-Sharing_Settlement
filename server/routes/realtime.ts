import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { db } from "../db";
import { ledgerEntries, groupMembers } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "../middleware/auth";
import { HonoEnv } from "../types";
import { users } from "../db/schema";

const app = new Hono<HonoEnv>();

/**
 * GET /api/realtime/:groupId
 *
 * Server-Sent Events (SSE) endpoint.
 * The client connects once and receives live `balance_updated` events
 * whenever a new ledger entry is created for the group.
 *
 * Protocol: text/event-stream (W3C EventSource standard)
 * Events pushed: `balance_updated` with { groupId, timestamp }
 *
 * Why SSE over WebSockets?
 * - Works natively with Next.js App Router (no extra server)
 * - No upgrade handshake — simpler infra
 * - One-directional (server → client) which is all we need
 *
 * Polling interval: 5 seconds (configurable via POLL_INTERVAL_MS env)
 */

const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || "5000", 10);

// Helper to get internal user from auth ID
async function getUserIdByAuthId(authId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.authId, authId),
  });
  return user?.id;
}

app.get("/:groupId", auth(), async (c) => {
  const groupId = c.req.param("groupId");
  const authId = c.get("authId");

  const userId = await getUserIdByAuthId(authId);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  // Verify group membership before streaming
  const membership = await db.query.groupMembers.findFirst({
    where: and(
      eq(groupMembers.groupId, groupId),
      eq(groupMembers.userId, userId)
    ),
  });

  if (!membership) return c.json({ error: "Forbidden" }, 403);

  return streamSSE(c, async (stream) => {
    // Track the latest ledger entry ID we've seen
    const latestEntry = await db.query.ledgerEntries.findFirst({
      where: eq(ledgerEntries.groupId, groupId),
      orderBy: [desc(ledgerEntries.createdAt)],
    });

    let lastSeenId = latestEntry?.id ?? null;

    // Send initial heartbeat so client knows connection is alive
    await stream.writeSSE({
      event: "connected",
      data: JSON.stringify({ groupId, timestamp: new Date().toISOString() }),
    });

    // Poll for new ledger entries every POLL_INTERVAL_MS
    while (!stream.closed) {
      await stream.sleep(POLL_INTERVAL_MS);

      try {
        const newest = await db.query.ledgerEntries.findFirst({
          where: eq(ledgerEntries.groupId, groupId),
          orderBy: [desc(ledgerEntries.createdAt)],
        });

        if (newest && newest.id !== lastSeenId) {
          lastSeenId = newest.id;

          await stream.writeSSE({
            event: "balance_updated",
            data: JSON.stringify({
              groupId,
              entryId: newest.id,
              type: newest.type,
              amount: newest.amount,
              timestamp: newest.createdAt.toISOString(),
            }),
          });
        } else {
          // Keep-alive heartbeat (prevents proxy timeout)
          await stream.writeSSE({
            event: "heartbeat",
            data: JSON.stringify({ timestamp: new Date().toISOString() }),
          });
        }
      } catch {
        // DB error during polling — don't crash the SSE stream
        await stream.writeSSE({
          event: "error",
          data: JSON.stringify({ message: "Poll error — retrying" }),
        });
      }
    }
  });
});

export default app;
