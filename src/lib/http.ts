import { NextResponse } from "next/server";

/**
 * Small helpers shared by the API routes so every route answers errors the same way
 * and never leaks internal details (stack traces, Mongo messages, gateway payloads).
 */

/** Reads the JSON body, returning null for malformed or non-object bodies. */
export async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}

export const jsonError = (error: string, status: number, headers?: HeadersInit) =>
  NextResponse.json({ error }, { status, headers });

export const badRequest = (error = "Invalid request") => jsonError(error, 400);
export const unauthorized = () => jsonError("Unauthorized", 401);
export const forbidden = () => jsonError("Forbidden", 403);
export const notFound = (error = "Not found") => jsonError(error, 404);
export const tooManyRequests = (retryAfterSeconds: number, error = "Too many requests. Please try again shortly.") =>
  jsonError(error, 429, { "Retry-After": String(Math.max(1, retryAfterSeconds)) });

/** Logs the real error on the server and returns a generic 500 to the client. */
export function serverError(error: unknown, context: string, message = "Something went wrong. Please try again.") {
  console.error(`${context}:`, error);
  return jsonError(message, 500);
}

/** True for MongoDB duplicate-key errors (unique index violations). */
export function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: number }).code === 11000;
}
