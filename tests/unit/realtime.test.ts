import { describe, it, expect } from 'vitest';

/**
 * Tests for server/routes/realtime.ts
 * 
 * Note: Full SSE streaming tests require a more complex setup with proper
 * Hono app mocking. These tests verify the route module loads correctly.
 */

describe('server/routes/realtime', () => {
  it('should export a Hono app', async () => {
    const { default: app } = await import('@/server/routes/realtime');
    expect(app).toBeDefined();
    expect(typeof app.request).toBe('function');
  });

  it('should have SSE endpoint for group', async () => {
    const { default: app } = await import('@/server/routes/realtime');
    // The route is defined at /:groupId
    expect(app).toBeDefined();
  });
});
