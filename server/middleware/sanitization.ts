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
 * 
 * @param text - The text to sanitize
 * @returns Sanitized text with XSS vectors removed
 */
export function sanitize(text: string): string {
  if (!text) return text;
  if (typeof text !== "string") return String(text);
  return xssFilter.process(text);
}

/**
 * Recursively sanitize nested objects and arrays
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

/**
 * Middleware to sanitize all string fields in JSON body.
 * Stores sanitized data in context for handlers to use.
 * 
 * IMPORTANT: Handlers should read from c.get("sanitizedBody") 
 * OR use the sanitize() function directly on validated data.
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

      // Store sanitized body in context
      // Handlers must read from context, not from c.req.valid("json")
      c.set("sanitizedBody", sanitized);
    } catch (error) {
      // Invalid JSON, let the request fail naturally
      await next();
      return;
    }

    await next();
  });

/**
 * Helper to get sanitized body from context.
 * Use this in handlers instead of c.req.valid("json") when sanitization is needed.
 * 
 * @param c - Hono context
 * @returns Sanitized body or null if not available
 */
export function getSanitizedBody<T>(c: any): T | null {
  return c.get("sanitizedBody") as T | null;
}

/**
 * Zod transform helper to sanitize string fields in schema validation.
 * Use this in Zod schemas to automatically sanitize during validation.
 * 
 * Example:
 * z.object({
 *   description: z.string().transform(sanitizeString)
 * })
 */
export function sanitizeString(value: string): string {
  return sanitize(value);
}
