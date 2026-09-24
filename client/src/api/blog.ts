import { apiRequest } from "./client";

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  body: string;
  coverImageUrl?: string;
  author: string;
  status: "draft" | "published";
  publishedAt?: string;
  createdAt: string;
}

export function fetchAdminPosts(): Promise<{ success: boolean; count: number; data: BlogPost[] }> {
  return apiRequest("/api/v1/blog/admin");
}

export interface BlogPostInput {
  title: string;
  excerpt?: string;
  body: string;
  coverImageUrl?: string;
  author?: string;
  status: "draft" | "published";
}

export function createPost(payload: BlogPostInput): Promise<{ success: boolean; data: BlogPost }> {
  return apiRequest("/api/v1/blog", { method: "POST", body: payload });
}

export function updatePost(id: string, payload: Partial<BlogPostInput>): Promise<{ success: boolean; data: BlogPost }> {
  return apiRequest(`/api/v1/blog/${id}`, { method: "PATCH", body: payload });
}

export function deletePost(id: string): Promise<{ success: boolean }> {
  return apiRequest(`/api/v1/blog/${id}`, { method: "DELETE" });
}

