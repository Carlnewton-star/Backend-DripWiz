import { apiRequest, apiUpload } from "./client";

export interface ProductImage {
  public_id: string;
  url: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  description: string;
  images: ProductImage[];
  category: string;
  stock: number;
  ratings: number;
  numOfReviews: number;
  createdAt: string;
}

interface ProductsResponse {
  success: boolean;
  count: number;
  pagination: Record<string, unknown>;
  data: Product[];
}

interface ProductResponse {
  success: boolean;
  data: Product;
}

export function fetchProducts(params?: { category?: string }): Promise<ProductsResponse> {
  const query = params?.category ? `?category=${encodeURIComponent(params.category)}` : "";
  return apiRequest<ProductsResponse>(`/api/v1/products${query}`);
}

export function fetchProduct(id: string): Promise<ProductResponse> {
  return apiRequest<ProductResponse>(`/api/v1/products/${id}`);
}

export const PRODUCT_CATEGORIES = [
  "Dresses",
  "Outerwear",
  "Tops",
  "Bottoms",
  "Footwear",
  "Bags",
  "Accessories",
] as const;

// --- Admin ---

export interface ProductInput {
  name: string;
  price: number;
  description: string;
  category: string;
  stock: number;
}

export function fetchAllProductsAdmin(): Promise<ProductsResponse> {
  return apiRequest<ProductsResponse>("/api/v1/products?limit=200&sort=-createdAt");
}

export function createProduct(payload: ProductInput): Promise<ProductResponse> {
  return apiRequest<ProductResponse>("/api/v1/products", { method: "POST", body: payload });
}

export function updateProduct(id: string, payload: Partial<ProductInput>): Promise<ProductResponse> {
  return apiRequest<ProductResponse>(`/api/v1/products/${id}`, { method: "PUT", body: payload });
}

export function deleteProduct(id: string): Promise<{ success: boolean }> {
  return apiRequest(`/api/v1/products/${id}`, { method: "DELETE" });
}

export function uploadProductPhoto(id: string, file: File): Promise<{ success: boolean; data: ProductImage[] }> {
  return apiUpload(`/api/v1/products/${id}/photo`, file);
}
