import type { Context } from "hono";
import { getConnInfo } from "@hono/node-server/conninfo";

/** Fixed-window in-memory limiter; returns true when the key is still under its budget. */
export function createRateLimiter(windowMs: number, max: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return function allow(key: string, now = Date.now()): boolean {
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      if (hits.size > 5000) {
        for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
      }
      return true;
    }
    if (entry.count >= max) return false;
    entry.count += 1;
    return true;
  };
}

/**
 * Best-effort client identifier for rate limiting. Behind Railway's proxy the socket
 * address is the proxy, so in production the first X-Forwarded-For entry is used.
 */
export function clientKey(c: Context): string {
  if (process.env.NODE_ENV === "production") {
    const forwarded = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
    if (forwarded) return forwarded;
  }
  return getConnInfo(c).remote.address ?? "unknown";
}
