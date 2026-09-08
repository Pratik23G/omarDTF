import { OrderStatus, type Order } from "@omardtf/shared-types";

export const mockOrders: Order[] = [
  {
    id: "ord_1",
    customerEmail: "jane@example.com",
    customerName: "Jane Doe",
    customerPhone: "555-010-1234",
    status: OrderStatus.PENDING,
    paymentMethod: "card",
    totalAmount: 49.98,
    createdAt: new Date().toISOString(),
    items: [
      {
        id: "item_1",
        productId: "1",
        quantity: 2,
        size: "M",
        color: "Black",
        price: 24.99,
      },
    ],
  },
];
