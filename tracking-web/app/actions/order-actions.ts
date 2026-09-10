'use server';

import { DeliveryStatus, Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { getAuthorizedUser, tenantIdFor, type ActionResult } from '../../lib/authorization';

type OrderItemInput = { sku: string; description: string; quantity: number };

function parseItems(value: FormDataEntryValue | null): OrderItemInput[] {
  if (typeof value !== 'string') return [];
  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((item): item is OrderItemInput => {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as Record<string, unknown>;
    return typeof candidate.sku === 'string' && typeof candidate.description === 'string'
      && typeof candidate.quantity === 'number' && candidate.quantity > 0;
  });
}

export async function createOrder(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const admin = await getAuthorizedUser(Role.ADMIN);
  if (!admin) return { success: false, error: 'You are not authorized to create orders.' };

  const sellerId = tenantIdFor(admin);
  const orderRef = String(formData.get('orderRef') ?? '').trim();
  const buyerId = String(formData.get('buyerId') ?? '').trim();
  const deliveryAddress = String(formData.get('deliveryAddress') ?? '').trim();
  const driverId = String(formData.get('driverId') ?? '').trim() || null;
  let items: OrderItemInput[];

  try {
    items = parseItems(formData.get('items'));
  } catch {
    return { success: false, error: 'Order items are invalid.' };
  }

  if (!orderRef || !buyerId || !deliveryAddress || items.length === 0) {
    return { success: false, error: 'Order reference, buyer, address, and at least one item are required.' };
  }

  const [buyer, driver] = await Promise.all([
    prisma.user.findFirst({ where: { id: buyerId, sellerId, role: Role.BUYER, status: { not: 'DISABLED' } } }),
    driverId ? prisma.user.findFirst({ where: { id: driverId, sellerId, role: Role.DRIVER, status: { not: 'DISABLED' } } }) : null
  ]);
  if (!buyer) return { success: false, error: 'Buyer does not belong to your account.' };
  if (driverId && !driver) return { success: false, error: 'Driver does not belong to your account.' };

  try {
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderRef,
          sellerId,
          buyerId,
          deliveryAddress,
          status: DeliveryStatus.READY_FOR_DISPATCH,
          items: { create: items }
        }
      });
      const delivery = await tx.delivery.create({
        data: {
          orderId: createdOrder.id,
          orderRef,
          customerPhone: buyer.phone ?? '',
          deliveryAddress,
          status: DeliveryStatus.READY_FOR_DISPATCH,
          assignedUserId: driverId
        }
      });
      await tx.statusLog.create({
        data: { deliveryId: delivery.id, actorId: admin.id, status: DeliveryStatus.READY_FOR_DISPATCH, note: 'Order created' }
      });
      return createdOrder;
    });
    return { success: true, data: { id: order.id } };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return { success: false, error: 'That order reference already exists.' };
    }
    return { success: false, error: 'Unable to create order.' };
  }
}

export async function assignDriver(deliveryId: string, driverId: string | null): Promise<ActionResult<{ id: string }>> {
  const admin = await getAuthorizedUser(Role.ADMIN);
  if (!admin) return { success: false, error: 'You are not authorized to assign deliveries.' };
  const sellerId = tenantIdFor(admin);

  const delivery = await prisma.delivery.findFirst({
    where: { id: deliveryId, order: { sellerId } },
    select: { id: true }
  });
  if (!delivery) return { success: false, error: 'Delivery not found.' };

  if (driverId) {
    const driver = await prisma.user.findFirst({ where: { id: driverId, sellerId, role: Role.DRIVER, status: { not: 'DISABLED' } } });
    if (!driver) return { success: false, error: 'Driver does not belong to your account.' };
  }

  const updated = await prisma.delivery.update({ where: { id: deliveryId }, data: { assignedUserId: driverId } });
  return { success: true, data: { id: updated.id } };
}