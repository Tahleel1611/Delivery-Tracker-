import type { Delivery, DriverManifest } from '../types/delivery';

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000';
let accessToken: string | undefined;
let refreshToken: string | undefined;

export function setAccessToken(token: string): void {
  accessToken = token;
}

export function setSession(access: string, refresh: string): void {
  accessToken = access;
  refreshToken = refresh;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers ?? {})
    }
  });

  const body = await response.json() as { data?: T; error?: { message?: string } };
  if (!response.ok) {
    throw new Error(body.error?.message ?? 'The request failed.');
  }

  return body.data as T;
}

export function loginDriver(username: string, password: string): Promise<{ accessToken: string; refreshToken: string; driver: { id: string } }> {
  return request<{ accessToken: string; refreshToken: string; driver: { id: string } }>('/api/v1/drivers/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  }).then((result) => {
    setSession(result.accessToken, result.refreshToken);
    return result;
  });
}

export function refreshDriverSession(): Promise<{ accessToken: string; refreshToken: string }> {
  if (!refreshToken) return Promise.reject(new Error('Your session has expired. Please sign in again.'));
  return request<{ accessToken: string; refreshToken: string }>('/api/v1/drivers/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken })
  }).then((result) => {
    setSession(result.accessToken, result.refreshToken);
    return result;
  });
}

export function fetchDriverManifest(driverId: string): Promise<DriverManifest> {
  return request<DriverManifest>(`/api/v1/drivers/${encodeURIComponent(driverId)}/deliveries`);
}

export function updateDeliveryStatus(
  deliveryId: string,
  status: 'OUT_FOR_DELIVERY' | 'DELIVERED'
): Promise<Delivery> {
  return request<Delivery>(`/api/v1/deliveries/${encodeURIComponent(deliveryId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

export async function uploadProofOfDelivery(deliveryId: string, uri: string): Promise<Delivery> {
  const form = new FormData();
  form.append('image', { uri, name: `pod-${deliveryId}.jpg`, type: 'image/jpeg' } as unknown as Blob);

  const response = await fetch(`${apiUrl}/api/v1/deliveries/${encodeURIComponent(deliveryId)}/pod`, {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    body: form
  });
  const body = await response.json() as { data?: Delivery; error?: { message?: string } };
  if (!response.ok) throw new Error(body.error?.message ?? 'The proof of delivery upload failed.');
  return body.data as Delivery;
}
