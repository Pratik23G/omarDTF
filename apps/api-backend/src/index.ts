import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { products } from "./routes/products.js";
import { orders } from "./routes/orders.js";
import { quotes } from "./routes/quotes.js";
import { payments } from "./routes/payments.js";
import { webhooks } from "./routes/webhooks.js";
import { fitCheck } from "./routes/fit-check.js";
import { recolor } from "./routes/recolor.js";
import { reviews } from "./routes/reviews.js";

try {
  process.loadEnvFile();
} catch {
  // no .env file present (e.g. in prod where vars are set directly)
}

const app = new Hono();

const isProd = process.env.NODE_ENV === "production";
const configuredOrigin = process.env.FRONTEND_URL ?? "http://localhost:3000";
const localOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;

// Next dev falls back to a different port whenever 3000 is taken (e.g. by a leftover
// dev server), which used to silently break every POST here with a CORS-driven
// "Failed to fetch" — the fixed origin below never matched. Any localhost port is
// fine in dev; only production is locked to the one configured origin.
app.use(
  "*",
  cors({
    origin: (origin) => {
      if (origin === configuredOrigin) return origin;
      if (!isProd && localOriginPattern.test(origin)) return origin;
      return null;
    },
  }),
);

app.get("/", (c) => c.json({ status: "ok", service: "omardtf-api" }));

app.route("/products", products);
app.route("/orders", orders);
app.route("/quotes", quotes);
app.route("/payments", payments);
app.route("/webhooks", webhooks);
app.route("/fit-check", fitCheck);
app.route("/recolor", recolor);
app.route("/reviews", reviews);

console.log(
  `fit-check uses Ollama at ${process.env.OLLAMA_HOST ?? "http://localhost:11434"} (model ${process.env.OLLAMA_MODEL ?? "gemma3:4b"})`,
);

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`api-backend running on http://localhost:${info.port}`);
});
