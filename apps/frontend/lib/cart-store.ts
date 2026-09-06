import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@omardtf/shared-types";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, size: string, color: string) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  updateQuantity: (
    productId: string,
    size: string,
    color: string,
    quantity: number
  ) => void;
  clear: () => void;
}

function sameLine(a: CartItem, productId: string, size: string, color: string) {
  return a.productId === productId && a.size === size && a.color === color;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product, size, color) =>
        set((state) => {
          const existing = state.items.find((i) =>
            sameLine(i, product.id, size, color)
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                sameLine(i, product.id, size, color)
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                productId: product.id,
                name: product.name,
                price: product.price,
                image: product.images[0],
                size,
                color,
                quantity: 1,
              },
            ],
          };
        }),
      removeItem: (productId, size, color) =>
        set((state) => ({
          items: state.items.filter((i) => !sameLine(i, productId, size, color)),
        })),
      updateQuantity: (productId, size, color, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => !sameLine(i, productId, size, color))
              : state.items.map((i) =>
                  sameLine(i, productId, size, color) ? { ...i, quantity } : i
                ),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "omardtf-cart" }
  )
);

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

export function cartTotal(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}
