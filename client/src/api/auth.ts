import { apiRequest } from "./client";

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthResponse {
  success: boolean;
  token: string;
}

interface MeResponse {
  success: boolean;
  data: AuthUser;
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function register(name: string, email: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/api/v1/auth/register", {
    method: "POST",
    body: { name, email, password },
  });
}

export function fetchMe(): Promise<MeResponse> {
  return apiRequest<MeResponse>("/api/v1/auth/me");
}
