export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";
const TOKEN_KEY = "dripwiz_token";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = data?.error || data?.message || `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return data as T;
}

// Multipart upload (product photos, etc.) - bypasses the JSON Content-Type
// apiRequest always sets, since the browser needs to set its own
// multipart/form-data boundary header when the body is a FormData.
export async function apiUpload<T>(path: string, file: File, fieldName = "file"): Promise<T> {
  const token = getStoredToken();
  const formData = new FormData();
  formData.append(fieldName, file);

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = data?.error || data?.message || `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return data as T;
}
