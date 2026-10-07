import { Hono } from "hono";
import { getDashboardStats } from "../db/orders.js";
import { requireAdmin } from "../lib/admin-auth.js";

export const admin = new Hono();

admin.use("*", requireAdmin);

admin.get("/stats", async (c) => c.json(await getDashboardStats()));
