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

// --- Admin ---

export interface AdminOrder extends Omit<Order, "products"> {
  user: { _id: string; name: string; email: string } | string;
  isDelivered: boolean;
  paidAt?: string;
  deliveredAt?: string;
  products: OrderLineItem[];
}

interface AdminOrdersResponse {
  success: boolean;
  count: number;
  pagination: Record<string, unknown>;
  data: AdminOrder[];
}

export function fetchAllOrders(): Promise<AdminOrdersResponse> {
  return apiRequest<AdminOrdersResponse>("/api/v1/orders?limit=200&sort=-createdAt");
}

export function updateOrderStatus(
  id: string,
  payload: { isPaid?: boolean; isDelivered?: boolean }
): Promise<{ success: boolean; data: AdminOrder }> {
  return apiRequest(`/api/v1/orders/${id}`, { method: "PUT", body: payload });
}

export function deleteOrderAdmin(id: string): Promise<{ success: boolean }> {
  return apiRequest(`/api/v1/orders/${id}`, { method: "DELETE" });
}

export interface SalesStats {
  numOrders: number;
  totalSales: number;
}

export function fetchSalesStats(): Promise<{ success: boolean; data: SalesStats }> {
  return apiRequest("/api/v1/orders/stats/sales");
}
