export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  inStock: boolean;
  sizes: string[];
  colors: string[];
}

export enum OrderStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  READY = "READY",
  DELIVERED = "DELIVERED",
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  size: string;
  color: string;
  price: number;
}

export interface Order {
  id: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  paymentMethod: string;
  totalAmount: number;
  designUploadUrl?: string;
  createdAt: string;
  items: OrderItem[];
}

export enum QuoteStatus {
  PENDING = "PENDING",
  REPLIED = "REPLIED",
  CONVERTED = "CONVERTED",
  DECLINED = "DECLINED",
}

export interface Quote {
  id: string;
  businessName?: string;
  contactName: string;
  email: string;
  phone?: string;
  description: string;
  quantity: number;
  status: QuoteStatus;
  createdAt: string;
}
