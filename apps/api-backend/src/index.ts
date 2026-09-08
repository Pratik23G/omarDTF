import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { products } from "./routes/products.js";
import { orders } from "./routes/orders.js";
import { quotes } from "./routes/quotes.js";

const app = new Hono();

app.use("*", cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:3000" }));

app.get("/", (c) => c.json({ status: "ok", service: "omardtf-api" }));

app.route("/products", products);
app.route("/orders", orders);
app.route("/quotes", quotes);

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`api-backend running on http://localhost:${info.port}`);
});
