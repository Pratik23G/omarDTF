import { mockProducts } from "../data/mock-products.js";

export interface CartLineInput {
  productId: string;
  quantity: number;
  size: string;
  color: string;
}

export interface PricedLine extends CartLineInput {
  priceCents: number;
}

/**
 * Prices cart lines from the server's own catalog so the browser can never set
 * its own prices. Returns an error message when a product or option is unknown.
 */
export function priceCart(lines: CartLineInput[]): { lines: PricedLine[]; totalCents: number } | { error: string } {
  const priced: PricedLine[] = [];
  for (const line of lines) {
    const product = mockProducts.find((p) => p.id === line.productId);
    if (!product) return { error: `Unknown product ${line.productId}` };
    if (!product.inStock) return { error: `${product.name} is out of stock` };
    if (!product.sizes.includes(line.size)) return { error: `Size ${line.size} unavailable for ${product.name}` };
    if (!product.colors.includes(line.color)) return { error: `Color ${line.color} unavailable for ${product.name}` };
    priced.push({ ...line, priceCents: Math.round(product.price * 100) });
  }
  const totalCents = priced.reduce((sum, l) => sum + l.priceCents * l.quantity, 0);
  return { lines: priced, totalCents };
}
