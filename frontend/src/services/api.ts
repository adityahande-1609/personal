const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export type User = { id: string; name: string; email: string; phone: string | null; role: 'TENANT' | 'OWNER' | 'ADMIN'; isVerified: boolean };
export type Property = { id: string; title: string; description: string; propertyType: string; rent: string | number; deposit?: string | number | null; bedrooms: number; bathrooms: number; area?: string | number | null; furnishing?: string | null; areaName: string; city: string; state: string; pincode: string; availableFrom: string; status?: string; verificationStatus: string; images: { id: string; imageUrl: string; isPrimary: boolean }[] };
export type Favorite = { id: string; propertyId: string; property: Property };
export type Enquiry = { id: string; propertyId: string; tenantId: string; ownerId: string; message: string; status: string; property: Pick<Property, 'id' | 'title' | 'city' | 'areaName'> };
export type Visit = { id: string; propertyId: string; tenantId: string; ownerId: string; requestedDate: string; requestedTime: string; message?: string | null; status: string; property: Pick<Property, 'id' | 'title' | 'city' | 'areaName'> };
export type Notification = { id: string; title: string; message: string; isRead: boolean; createdAt: string };
export type Agreement = { id: string; propertyId: string; ownerId: string; tenantId: string; rent: string | number; deposit?: string | number | null; startDate: string; endDate: string; rentDueDate: number; noticePeriod?: string | null; maintenanceResponsibility?: string | null; utilities?: string | null; pets?: string | null; subletting?: string | null; additionalTerms?: string | null; status: string; property?: Pick<Property, 'id' | 'title' | 'city' | 'areaName'> };

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
export async function getFavorites(): Promise<Favorite[]> { return request<Favorite[]>('/favorites'); }
export async function addFavorite(propertyId: string) { return request<Favorite>('/favorites', { method: 'POST', body: JSON.stringify({ propertyId }) }); }
export async function removeFavorite(propertyId: string) { return request<void>(`/favorites/${encodeURIComponent(propertyId)}`, { method: 'DELETE' }); }
export async function createEnquiry(input: { propertyId: string; message: string }) { return request<Enquiry>('/enquiries', { method: 'POST', body: JSON.stringify(input) }); }
export async function getEnquiries() { const body = await request<{data: Enquiry[]}>('/enquiries'); return body.data; }
export async function updateEnquiry(id: string, status: string) { const body = await request<{data: Enquiry}>(`/enquiries/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ status }) }); return body.data; }
export async function createVisit(input: { propertyId: string; requestedDate: string; requestedTime: string; message?: string }) { return request<Visit>('/visits', { method: 'POST', body: JSON.stringify(input) }); }
export async function getVisits() { const body = await request<{data: Visit[]}>('/visits'); return body.data; }
export async function updateVisit(id: string, input: { status: string; requestedDate?: string; requestedTime?: string }) { const body = await request<{data: Visit}>(`/visits/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(input) }); return body.data; }
export async function getNotifications() { return request<Notification[]>('/notifications'); }
export async function markNotificationRead(id: string) { return request<Notification>(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' }); }
export async function markAllNotificationsRead() { return request<void>('/notifications/read-all', { method: 'PATCH' }); }
export async function createAgreement(input: Omit<Agreement, 'id' | 'status' | 'property'>) { const body = await request<{data: Agreement}>('/agreements', { method: 'POST', body: JSON.stringify(input) }); return body.data; }
export async function getAgreements() { const body = await request<{data: Agreement[]}>('/agreements'); return body.data; }
export async function getAgreement(id: string) { const body = await request<{data: Agreement}>(`/agreements/${encodeURIComponent(id)}`); return body.data; }
export async function updateAgreement(id: string, input: Partial<Omit<Agreement, 'id' | 'property'>>) { const body = await request<{data: Agreement}>(`/agreements/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(input) }); return body.data; }
export async function submitAgreement(id: string) { const body = await request<{data: Agreement}>(`/agreements/${encodeURIComponent(id)}/submit`, { method: 'POST' }); return body.data; }
