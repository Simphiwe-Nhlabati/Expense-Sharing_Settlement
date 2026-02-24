import { createMiddleware } from "hono/factory";
import { v4 as uuidv4 } from "uuid";

export const requestId = () => createMiddleware(async (c, next) => {
  const reqId = c.req.header("X-Request-ID") || uuidv4();
  c.set("requestId", reqId);
  await next();
  c.res.headers.set("X-Request-ID", reqId);
});
