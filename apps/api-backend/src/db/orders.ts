import type { Order as DbOrder, OrderItem as DbItem } from "../generated/prisma/client.js";
import { OrderStatus, type DashboardStats, type Order } from "@omardtf/shared-types";
import { prisma } from "./prisma.js";

type DbOrderWithItems = DbOrder & { items: DbItem[] };

const dollars = (cents: number) => cents / 100;

/** Converts a database order (cents) into the shared API shape (dollars). */
export function toApiOrder(o: DbOrderWithItems): Order {
  return {
    id: o.id,
    paymentIntentId: o.paymentIntentId,
    customerEmail: o.customerEmail,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    status: o.status as OrderStatus,
    paymentMethod: o.paymentMethod,
    totalAmount: dollars(o.totalAmountCents),
    designUploadUrl: o.designUploadUrl ?? undefined,
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      quantity: i.quantity,
      size: i.size,
      color: i.color,
      price: dollars(i.priceCents),
    })),
  };
}

export async function listOrders(status?: OrderStatus): Promise<Order[]> {
  const rows = await prisma.order.findMany({
    where: status ? { status } : undefined,
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toApiOrder);
}

export async function getOrder(id: string): Promise<Order | null> {
  const row = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  return row ? toApiOrder(row) : null;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
  try {
    const row = await prisma.order.update({ where: { id }, data: { status }, include: { items: true } });
    return toApiOrder(row);
  } catch {
    return null;
  }
}

/**
 * Computes dashboard numbers. Revenue counts every stored order because an order
 * row only exists once Stripe confirmed the payment.
 */
export async function getDashboardStats(now = new Date()): Promise<DashboardStats> {
  const orders = await prisma.order.findMany({
    select: { status: true, paymentMethod: true, totalAmountCents: true, createdAt: true },
  });

  const statusCounts = Object.fromEntries(Object.values(OrderStatus).map((s) => [s, 0])) as Record<OrderStatus, number>;
  const byMethod = new Map<string, number>();
  const days = new Map<string, { revenueCents: number; orders: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    days.set(d.toISOString().slice(0, 10), { revenueCents: 0, orders: 0 });
  }

  let totalCents = 0;
  let deliveredCents = 0;
  for (const o of orders) {
    totalCents += o.totalAmountCents;
    statusCounts[o.status as OrderStatus] += 1;
    if (o.status === "DELIVERED") deliveredCents += o.totalAmountCents;
    byMethod.set(o.paymentMethod, (byMethod.get(o.paymentMethod) ?? 0) + o.totalAmountCents);
    const day = days.get(o.createdAt.toISOString().slice(0, 10));
    if (day) {
      day.revenueCents += o.totalAmountCents;
      day.orders += 1;
    }
  }

  return {
    totalRevenue: dollars(totalCents),
    orderCount: orders.length,
    averageOrderValue: orders.length ? dollars(totalCents) / orders.length : 0,
    inProgressValue: dollars(totalCents - deliveredCents),
    deliveredValue: dollars(deliveredCents),
    statusCounts,
    revenueByMethod: [...byMethod].map(([method, c]) => ({ method, revenue: dollars(c) })).sort((a, b) => b.revenue - a.revenue),
    daily: [...days].map(([date, d]) => ({ date, revenue: dollars(d.revenueCents), orders: d.orders })),
  };
}
