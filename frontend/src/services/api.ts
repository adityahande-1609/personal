const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export type User = { id: string; name: string; email: string; phone: string | null; role: 'TENANT' | 'OWNER' | 'ADMIN'; isVerified: boolean };
export type Property = { id: string; title: string; description: string; propertyType: string; rent: string | number; deposit?: string | number | null; bedrooms: number; bathrooms: number; area?: string | number | null; furnishing?: string | null; areaName: string; city: string; state: string; pincode: string; availableFrom: string; status?: string; verificationStatus: string; images: { id: string; imageUrl: string; isPrimary: boolean }[] };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
  if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error || 'Request failed'); }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function register(input: { name: string; email: string; phone?: string; password: string; role: 'TENANT' | 'OWNER' }) { return request<{ user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(input) }); }
export async function login(input: { email: string; password: string }) { return request<{ user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(input) }); }
export async function logout() { return request<void>('/auth/logout', { method: 'POST' }); }
export async function getCurrentUser() { return request<{ user: User }>('/auth/me'); }

export async function getProperties(params: URLSearchParams): Promise<Property[]> { const body = await request<{ data: Property[] }>(`/properties?${params.toString()}`); return body.data; }
export async function getProperty(id: string): Promise<Property> { const body = await request<{ data: Property }>(`/properties/${encodeURIComponent(id)}`); return body.data; }
