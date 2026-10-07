import { auth } from "@clerk/nextjs/server";
import type { DashboardStats, Order, OrderStatus } from "@omardtf/shared-types";

const API_URL = process.env.API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Calls the API server-side with the signed-in user's Clerk session token. */
async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await (await auth()).getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: { ...init?.headers, authorization: `Bearer ${token ?? ""}`, "content-type": "application/json" },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(res.status, body?.error ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const getStats = () => adminFetch<DashboardStats>("/admin/stats");

export const getOrders = (status?: OrderStatus) =>
  adminFetch<Order[]>(`/orders${status ? `?status=${status}` : ""}`);

export const setOrderStatus = (id: string, status: OrderStatus) =>
  adminFetch<Order>(`/orders/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
