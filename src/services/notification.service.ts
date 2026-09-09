import { DeliveryStatus } from '@prisma/client';
import { env } from '../config/env';

type NotifiableStatus = Extract<DeliveryStatus, 'OUT_FOR_DELIVERY' | 'DELIVERED'>;

export interface DeliveryNotification {
  orderRef: string;
  customerPhone: string;
  status: NotifiableStatus;
  trackingToken: string;
}

/**
 * Provider boundary for transactional buyer notifications. Replace this adapter
 * with a queued Twilio/WhatsApp implementation without changing controllers.
 */
export async function sendDeliveryStatusNotification(notification: DeliveryNotification): Promise<void> {
  const trackingUrl = new URL(`t/${encodeURIComponent(notification.trackingToken)}`, `${env.TRACKING_WEB_BASE_URL.replace(/\/$/, '')}/`).toString();
  const message = notification.status === 'OUT_FOR_DELIVERY'
    ? `Your order ${notification.orderRef} is out for delivery. Track it here: ${trackingUrl}`
    : `Your order ${notification.orderRef} has been delivered. Track your delivery here: ${trackingUrl}`;

  // Mock provider: intentionally logs the exact outgoing message, not the phone number.
  console.log(`[notification:mock] ${message}`);
}
