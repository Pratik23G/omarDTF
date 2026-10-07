import { createClerkClient, verifyToken } from "@clerk/backend";
import type { MiddlewareHandler } from "hono";

const adminEmails = () =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

const emailCache = new Map<string, { email: string | null; expiresAt: number }>();
const CACHE_MS = 5 * 60 * 1000;
let clerk: ReturnType<typeof createClerkClient> | undefined;

/** Looks up a Clerk user's verified primary email, cached briefly to avoid a Clerk call per request. */
async function primaryEmail(userId: string): Promise<string | null> {
  const hit = emailCache.get(userId);
  if (hit && hit.expiresAt > Date.now()) return hit.email;

  clerk ??= createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  const user = await clerk.users.getUser(userId);
  const primary = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId);
  const email = primary?.verification?.status === "verified" ? primary.emailAddress.toLowerCase() : null;
  emailCache.set(userId, { email, expiresAt: Date.now() + CACHE_MS });
  return email;
}

/**
 * Hono middleware: requires a valid Clerk session token in `Authorization: Bearer`
 * whose user's verified primary email is listed in ADMIN_EMAILS. Fails closed.
 */
export const requireAdmin: MiddlewareHandler = async (c, next) => {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey || adminEmails().length === 0) {
    return c.json({ error: "Admin access is not configured on the server" }, 503);
  }

  const token = c.req.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return c.json({ error: "Unauthorized" }, 401);

  try {
    const claims = await verifyToken(token, { secretKey });
    const email = await primaryEmail(claims.sub);
    if (!email || !adminEmails().includes(email)) return c.json({ error: "Forbidden" }, 403);
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
};
