import { createMiddleware } from "hono/factory";
import filterXSS, { FilterXSS } from "xss";

// Initialize XSS filter with strict settings
// No HTML tags allowed for financial data inputs
const xssFilter = new FilterXSS({
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style"],
  // Escape special characters
  escapeHtml: (html: string) => {
    return html
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");
  },
});

/**
 * Sanitize text input to prevent XSS attacks
 * Use this for all user-provided text fields
 */
export function sanitize(text: string): string {
  if (!text) return text;
  if (typeof text !== "string") return String(text);
  return xssFilter.process(text);
}

/**
 * Middleware to sanitize all string fields in JSON body
 * Stores sanitized data in context for handlers to use
 */
export const sanitizeBody = () =>
  createMiddleware(async (c, next) => {
    const contentType = c.req.header("content-type");
    if (!contentType?.includes("application/json")) {
      await next();
      return;
    }

    try {
      const body = await c.req.json();
      const sanitized: Record<string, unknown> = {};

      for (const key in body) {
        if (typeof body[key] === "string") {
          sanitized[key] = sanitize(body[key]);
        } else if (typeof body[key] === "object" && body[key] !== null) {
          // Recursively sanitize nested objects
          sanitized[key] = sanitizeObject(body[key]);
        } else {
          sanitized[key] = body[key];
        }
      }

      c.set("sanitizedBody", sanitized);
    } catch (error) {
      // Invalid JSON, let the request fail naturally
      await next();
      return;
    }

    await next();
  });

/**
 * Recursively sanitize nested objects
 */
function sanitizeObject(obj: unknown): unknown {
  if (typeof obj === "string") {
    return sanitize(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }
  if (typeof obj === "object" && obj !== null) {
    const sanitized: Record<string, unknown> = {};
    const typedObj = obj as Record<string, unknown>;
    for (const key in typedObj) {
      if (Object.prototype.hasOwnProperty.call(typedObj, key)) {
        sanitized[key] = sanitizeObject(typedObj[key]);
      }
    }
    return sanitized;
  }
  return obj;
}
