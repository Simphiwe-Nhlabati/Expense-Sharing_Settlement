import { createMiddleware } from "hono/factory";
import { redactObject } from "./safe-logger";
import type { ContentfulStatusCode } from "hono/utils/http-status";

/**
 * Global Error Handler Middleware
 *
 * Catches all unhandled errors and returns a safe, production-ready response.
 * Prevents sensitive information from leaking in error messages.
 *
 * Features:
 * - Request ID tracking for debugging
 * - Safe error messages (no stack traces in production)
 * - Structured error logging with PII redaction
 * - Proper HTTP status codes
 * - Error context for debugging
 */
export const errorHandler = () => createMiddleware(async (c, next) => {
  const requestId = c.get("requestId") || "unknown";
  const start = Date.now();

  try {
    await next();
  } catch (error) {
    const duration = Date.now() - start;
    const method = c.req.method;
    const path = c.req.path;

    // Determine error type and status code
    let status: ContentfulStatusCode = 500;
    let message = "Internal server error";
    let code = "INTERNAL_ERROR";

    // Handle known error types
    if (error instanceof Error) {
      // Zod validation errors
      if (error.name === "ZodError") {
        status = 400;
        message = "Validation failed";
        code = "VALIDATION_ERROR";
      }
      // Unauthorized errors
      else if (error.message.includes("Unauthorized") || error.message.includes("authentication")) {
        status = 401;
        message = "Unauthorized";
        code = "UNAUTHORIZED";
      }
      // Forbidden errors
      else if (error.message.includes("Forbidden") || error.message.includes("permission")) {
        status = 403;
        message = "Forbidden";
        code = "FORBIDDEN";
      }
      // Not found errors
      else if (error.message.includes("not found") || error.message.includes("doesn't exist")) {
        status = 404;
        message = "Resource not found";
        code = "NOT_FOUND";
      }
      // Conflict errors (e.g., idempotency key conflict)
      else if (error.message.includes("conflict") || error.message.includes("already exists")) {
        status = 409;
        message = "Resource conflict";
        code = "CONFLICT";
      }
      // Too many requests
      else if (error.message.includes("Too many requests")) {
        status = 429;
        message = "Too many requests";
        code = "RATE_LIMITED";
      }
      // Request timeout
      else if (error.message.includes("timeout")) {
        status = 408;
        message = "Request timeout";
        code = "TIMEOUT";
      }
      // Payload too large
      else if (error.message.includes("too large") || error.message.includes("payload")) {
        status = 413;
        message = "Payload too large";
        code = "PAYLOAD_TOO_LARGE";
      }
    }

    // Log error details (with PII redaction)
    const errorDetails = {
      requestId,
      timestamp: new Date().toISOString(),
      method,
      path,
      duration: `${duration}ms`,
      status,
      code,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: process.env.NODE_ENV !== "production" ? (error instanceof Error ? error.stack : "No stack") : undefined,
    };

    // Log with redacted data
    console.error(`[${requestId}] ERROR:`, redactObject(errorDetails));

    // Return safe error response
    return c.json({
      error: message,
      code,
      requestId,
      timestamp: new Date().toISOString(),
      // Only include details in non-production environments
      details: process.env.NODE_ENV !== "production" ? errorDetails : undefined,
    }, status);
  }
});

/**
 * Custom error class for API errors
 * Use this to throw structured errors with proper status codes
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code: string = "API_ERROR"
  ) {
    super(message);
    this.name = "ApiError";
  }

  static badRequest(message: string): ApiError {
    return new ApiError(message, 400, "BAD_REQUEST");
  }

  static unauthorized(message: string): ApiError {
    return new ApiError(message, 401, "UNAUTHORIZED");
  }

  static forbidden(message: string): ApiError {
    return new ApiError(message, 403, "FORBIDDEN");
  }

  static notFound(message: string): ApiError {
    return new ApiError(message, 404, "NOT_FOUND");
  }

  static conflict(message: string): ApiError {
    return new ApiError(message, 409, "CONFLICT");
  }

  static tooManyRequests(message: string): ApiError {
    return new ApiError(message, 429, "TOO_MANY_REQUESTS");
  }

  static internal(message: string): ApiError {
    return new ApiError(message, 500, "INTERNAL_ERROR");
  }
}
