import type { Property } from './api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
  if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error || 'Request failed'); }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function createOwnerProperty(input: Record<string,string>) { return request<{ data: Property }>('/owner/properties', { method: 'POST', body: JSON.stringify(input) }); }
export async function getOwnerProperties() { return request<{ data: Property[] }>('/owner/properties'); }
export async function updateOwnerProperty(id: string, input: Record<string,string>) { return request<{ data: Property }>(`/owner/properties/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(input) }); }
export async function deactivateOwnerProperty(id: string) { return request<void>(`/owner/properties/${encodeURIComponent(id)}`, { method: 'DELETE' }); }
