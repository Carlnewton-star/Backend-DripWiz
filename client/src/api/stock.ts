import { apiRequest } from "./client";
import type { Product } from "./products";

export interface StockMovement {
  _id: string;
  product: string;
  type: "restock" | "adjustment" | "return";
  quantity: number;
  resultingStock: number;
  note?: string;
  recordedBy: string;
  createdAt: string;
}

export function fetchLowStock(threshold = 10): Promise<{ success: boolean; count: number; data: Product[] }> {
  return apiRequest(`/api/v1/stock/low-stock?threshold=${threshold}`);
}

export function fetchMovements(productId?: string): Promise<{ success: boolean; count: number; data: StockMovement[] }> {
  const query = productId ? `?productId=${productId}` : "";
  return apiRequest(`/api/v1/stock/movements${query}`);
}

export function recordMovement(payload: {
  productId: string;
  type: "restock" | "adjustment" | "return";
  quantity: number;
  note?: string;
}): Promise<{ success: boolean; data: { product: Product; movement: StockMovement } }> {
  return apiRequest("/api/v1/stock/movements", { method: "POST", body: payload });
}

