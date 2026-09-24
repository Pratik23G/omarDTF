import { getConnInfo } from "@hono/node-server/conninfo";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { z } from "zod";
import { mockProducts } from "../data/mock-products.js";
import { sniffImageType } from "../lib/image-type.js";
import { createRateLimiter } from "../lib/rate-limit.js";
import {
  FitCheckBusyError,
  FitCheckUnavailableError,
  runFitCheck,
} from "../services/fit-check.js";

export const fitCheck = new Hono();

const perClient = createRateLimiter(10 * 60 * 1000, 6);
const perDay = createRateLimiter(24 * 60 * 60 * 1000, Number(process.env.FIT_CHECK_DAILY_LIMIT ?? 300));

const MAX_BODY_BYTES = 6 * 1024 * 1024;
const isProd = process.env.NODE_ENV === "production";

const requestSchema = z.object({
  productId: z.string().min(1),
  image: z.object({
    data: z
      .string()
      .min(100)
      .max(Math.floor(MAX_BODY_BYTES * 0.9))
      .regex(/^[A-Za-z0-9+/]+={0,2}$/, "image must be base64"),
  }),
  heightCm: z.number().min(100).max(250).optional(),
  weightKg: z.number().min(30).max(250).optional(),
  usualSize: z.string().max(10).optional(),
  fitPreference: z.enum(["fitted", "regular", "relaxed"]).optional(),
});

fitCheck.post(
  "/",
  bodyLimit({
    maxSize: MAX_BODY_BYTES,
    onError: (c) => c.json({ error: "Image is too large. Try a smaller photo." }, 413),
  }),
  async (c) => {
    const parsed = requestSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json({ error: "Invalid fit check request", issues: parsed.error.issues }, 400);
    }
    const { productId, image, ...details } = parsed.data;

    const product = mockProducts.find((p) => p.id === productId);
    if (!product) return c.json({ error: "Product not found" }, 404);

    const mediaType = sniffImageType(image.data);
    if (!mediaType) return c.json({ error: "Use a JPEG, PNG or WebP photo." }, 400);

    const client = getConnInfo(c).remote.address ?? "unknown";
    if (!perClient(client) || !perDay("all")) {
      return c.json({ error: "Too many fit checks right now. Please try again later." }, 429);
    }

    try {
      const result = await runFitCheck({
        product,
        image: { mediaType, data: image.data },
        ...details,
      });
      return c.json(result);
    } catch (error) {
      if (error instanceof FitCheckUnavailableError) {
        return c.json(
          { error: isProd ? "The fit checker isn't available right now." : error.message },
          503,
        );
      }
      if (error instanceof FitCheckBusyError) {
        return c.json({ error: "The fit checker is busy. Please try again shortly." }, 503);
      }
      const detail = error instanceof Error ? error.message : String(error);
      console.error("fit-check failed:", detail);
      return c.json(
        { error: isProd ? "We couldn't complete the fit check. Please try again." : `Fit check failed: ${detail}` },
        502,
      );
    }
  },
);
