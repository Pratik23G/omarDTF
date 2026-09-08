import { Hono } from "hono";
import { mockProducts } from "../data/mock-products.js";

export const products = new Hono();

products.get("/", (c) => {
  const category = c.req.query("category");
  const list = category
    ? mockProducts.filter((p) => p.category.toLowerCase() === category.toLowerCase())
    : mockProducts;
  return c.json(list);
});

products.get("/:id", (c) => {
  const product = mockProducts.find((p) => p.id === c.req.param("id"));
  if (!product) return c.json({ error: "Product not found" }, 404);
  return c.json(product);
});
