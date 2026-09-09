import type { Delivery, DriverManifest } from '../types/delivery';

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000';
const apiKey = process.env.EXPO_PUBLIC_API_KEY ?? 'local-development-key-change-me';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      ...(options.headers ?? {})
    }
  });

  const body = await response.json() as { data?: T; error?: { message?: string } };
  if (!response.ok) {
    throw new Error(body.error?.message ?? 'The request failed.');
  }

  return body.data as T;
}

export function fetchDriverManifest(driverId: string): Promise<DriverManifest> {
  return request<DriverManifest>(`/api/v1/drivers/${encodeURIComponent(driverId)}/deliveries`);
}

export function updateDeliveryStatus(
  deliveryId: string,
  driverId: string,
  status: 'OUT_FOR_DELIVERY' | 'DELIVERED'
): Promise<Delivery> {
  return request<Delivery>(`/api/v1/deliveries/${encodeURIComponent(deliveryId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ driverId, status })
  });
}

export async function uploadProofOfDelivery(deliveryId: string, driverId: string, uri: string): Promise<Delivery> {
  const form = new FormData();
  form.append('driverId', driverId);
  form.append('image', { uri, name: `pod-${deliveryId}.jpg`, type: 'image/jpeg' } as unknown as Blob);

  const response = await fetch(`${apiUrl}/api/v1/deliveries/${encodeURIComponent(deliveryId)}/pod`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey },
    body: form
  });
  const body = await response.json() as { data?: Delivery; error?: { message?: string } };
  if (!response.ok) throw new Error(body.error?.message ?? 'The proof of delivery upload failed.');
  return body.data as Delivery;
}
