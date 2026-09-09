import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { products } from "./routes/products.js";
import { orders } from "./routes/orders.js";
import { quotes } from "./routes/quotes.js";
import { payments } from "./routes/payments.js";

try {
  process.loadEnvFile();
} catch {
  // no .env file present (e.g. in prod where vars are set directly)
}

const app = new Hono();

app.use("*", cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:3000" }));

app.get("/", (c) => c.json({ status: "ok", service: "omardtf-api" }));

app.route("/products", products);
app.route("/orders", orders);
app.route("/quotes", quotes);
app.route("/payments", payments);

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`api-backend running on http://localhost:${info.port}`);
});
