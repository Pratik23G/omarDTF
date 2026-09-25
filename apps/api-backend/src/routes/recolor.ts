import { getConnInfo } from "@hono/node-server/conninfo";
import { Hono } from "hono";
import { z } from "zod";
import { mockProducts } from "../data/mock-products.js";
import { createRateLimiter } from "../lib/rate-limit.js";
import { RecolorBusyError, RecolorUnavailableError, runRecolor } from "../services/recolor.js";

export const recolor = new Hono();

const perClient = createRateLimiter(10 * 60 * 1000, 10);
const isProd = process.env.NODE_ENV === "production";

const requestSchema = z.object({
  productId: z.string().min(1),
  targetColor: z.string().min(1).max(40),
});

recolor.post("/", async (c) => {
  const parsed = requestSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "Invalid recolor request", issues: parsed.error.issues }, 400);
  }
  const { productId, targetColor } = parsed.data;

  const product = mockProducts.find((p) => p.id === productId);
  if (!product) return c.json({ error: "Product not found" }, 404);

  const client = getConnInfo(c).remote.address ?? "unknown";
  if (!perClient(client)) {
    return c.json({ error: "Too many recolor requests right now. Please try again later." }, 429);
  }

  try {
    const result = await runRecolor({ product, targetColor });
    return c.json(result);
  } catch (error) {
    if (error instanceof RecolorUnavailableError) {
      return c.json({ error: isProd ? "AI recolor isn't available right now." : error.message }, 503);
    }
    if (error instanceof RecolorBusyError) {
      return c.json({ error: "Recolor is busy. Please try again shortly." }, 503);
    }
    const detail = error instanceof Error ? error.message : String(error);
    console.error("recolor failed:", detail);
    return c.json(
      { error: isProd ? "We couldn't recolor that image. Please try again." : `Recolor failed: ${detail}` },
      502,
    );
  }
});
