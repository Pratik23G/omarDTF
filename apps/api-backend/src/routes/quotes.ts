import { Hono } from "hono";
import { z } from "zod";
import { QuoteStatus, type Quote } from "@omardtf/shared-types";
import { mockQuotes } from "../data/mock-quotes.js";

export const quotes = new Hono();

const createQuoteSchema = z.object({
  businessName: z.string().optional(),
  contactName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  description: z.string().min(1),
  quantity: z.number().int().positive(),
});

quotes.get("/", (c) => {
  return c.json(mockQuotes);
});

quotes.get("/:id", (c) => {
  const quote = mockQuotes.find((q) => q.id === c.req.param("id"));
  if (!quote) return c.json({ error: "Quote not found" }, 404);
  return c.json(quote);
});

quotes.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createQuoteSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid quote payload", issues: parsed.error.issues }, 400);
  }

  const newQuote: Quote = {
    id: `quo_${mockQuotes.length + 1}`,
    status: QuoteStatus.PENDING,
    createdAt: new Date().toISOString(),
    ...parsed.data,
  };
  mockQuotes.push(newQuote);
  return c.json(newQuote, 201);
});
