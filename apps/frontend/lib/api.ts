import type { FitCheckRequest, FitCheckResult, Product, RecolorRequest, RecolorResult } from "@omardtf/shared-types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function getProducts(category?: string): Promise<Product[]> {
  const url = category
    ? `${API_URL}/products?category=${encodeURIComponent(category)}`
    : `${API_URL}/products`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
  return res.json();
}

export async function getProduct(id: string): Promise<Product | null> {
  const res = await fetch(`${API_URL}/products/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch product ${id}: ${res.status}`);
  return res.json();
}

export async function requestFitCheck(body: FitCheckRequest): Promise<FitCheckResult> {
  const res = await fetch(`${API_URL}/fit-check`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? "Fit check failed. Please try again.");
  return data as FitCheckResult;
}

export async function requestRecolor(body: RecolorRequest): Promise<RecolorResult> {
  const res = await fetch(`${API_URL}/recolor`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? "Recolor failed. Please try again.");
  return data as RecolorResult;
}
