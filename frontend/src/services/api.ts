const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export type Property = {
  id: string;
  title: string;
  description: string;
  propertyType: string;
  rent: string | number;
  deposit?: string | number | null;
  bedrooms: number;
  bathrooms: number;
  area?: string | number | null;
  furnishing?: string | null;
  areaName: string;
  city: string;
  state: string;
  pincode: string;
  availableFrom: string;
  verificationStatus: string;
  images: { id: string; imageUrl: string; isPrimary: boolean }[];
};

export async function getProperties(params: URLSearchParams): Promise<Property[]> {
  const response = await fetch(`${API_URL}/properties?${params.toString()}`);
  if (!response.ok) throw new Error('Unable to load properties');
  const body = await response.json() as { data: Property[] };
  return body.data;
}

export async function getProperty(id: string): Promise<Property> {
  const response = await fetch(`${API_URL}/properties/${encodeURIComponent(id)}`);
  if (!response.ok) throw new Error(response.status === 404 ? 'Property not found' : 'Unable to load property');
  const body = await response.json() as { data: Property };
  return body.data;
}
