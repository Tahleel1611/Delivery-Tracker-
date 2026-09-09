import { PrismaClient } from '@prisma/client';
import { AppError } from '../lib/errors';
import { hashTrackingToken } from '../lib/tracking-token';

const addressSnippet = (address: string): string => {
  const compact = address.replace(/\s+/g, ' ').trim();
  return compact.length <= 80 ? compact : `${compact.slice(0, 77)}...`;
};

const firstName = (name: string): string => name.trim().split(/\s+/)[0] ?? '';

/**
 * Selects and shapes only fields safe for an unauthenticated buyer-facing route.
 * In particular, UUIDs, customer phone numbers, coordinates, and driver phones
 * must never be added to this return value.
 */
export async function getPublicTracking(database: PrismaClient, token: string) {
  const trackingToken = await database.trackingToken.findUnique({
    where: { tokenHash: hashTrackingToken(token) },
    select: {
      expiresAt: true,
      delivery: {
        select: {
          orderRef: true,
          status: true,
          deliveryAddress: true,
          assignedDriver: { select: { name: true } },
          statusLogs: {
            orderBy: { timestamp: 'asc' },
            select: { status: true, timestamp: true }
          }
        }
      }
    }
  });

  if (!trackingToken || trackingToken.expiresAt <= new Date()) {
    throw new AppError(404, 'TRACKING_NOT_FOUND', 'No active delivery was found for this tracking link.');
  }

  const delivery = trackingToken.delivery;

  return {
    orderRef: delivery.orderRef,
    currentStatus: delivery.status,
    deliveryAddressSnippet: addressSnippet(delivery.deliveryAddress),
    ...(delivery.assignedDriver ? { assignedDriverFirstName: firstName(delivery.assignedDriver.name) } : {}),
    statusLogs: delivery.statusLogs.map((log) => ({
      status: log.status,
      timestamp: log.timestamp.toISOString()
    }))
  };
}
