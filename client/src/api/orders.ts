import { apiRequest } from "./client";
import type { Product } from "./products";

export interface OrderLineItem {
  product: Pick<Product, "_id" | "name" | "price" | "images"> | string;
  quantity: number;
  price: number;
}

export interface ShippingAddress {
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface Order {
  _id: string;
  products: OrderLineItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  subtotal: number;
  taxPrice: number;
  totalPrice: number;
  isPaid: boolean;
  createdAt: string;
}

interface MyOrdersResponse {
  success: boolean;
  count: number;
  data: Order[];
}

interface OrderResponse {
  success: boolean;
  data: Order;
}

export function fetchMyOrders(): Promise<MyOrdersResponse> {
  return apiRequest<MyOrdersResponse>("/api/v1/orders/myorders");
}

export function createOrder(payload: {
  products: { product: string; quantity: number }[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
}): Promise<OrderResponse> {
  return apiRequest<OrderResponse>("/api/v1/orders", {
    method: "POST",
    body: payload,
  });
}
