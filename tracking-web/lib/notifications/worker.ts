import { randomUUID } from 'node:crypto';
import { NotificationAttemptStatus } from '@prisma/client';
import { prisma } from '../prisma';
import { sendDeliveryNotification } from './email';

const leaseMinutes = 5;
const maxAttempts = 5;

function nextRetry(attemptCount: number) {
  return new Date(Date.now() + Math.min(60 * 60 * 1000, 1000 * 2 ** attemptCount));
}

export async function processNotificationBatch(limit = 20) {
  const now = new Date();
  const candidates = await prisma.notificationAttempt.findMany({
    where: {
      state: { in: [NotificationAttemptStatus.PENDING, NotificationAttemptStatus.FAILED] },
      nextAttemptAt: { lte: now },
      OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }]
    },
    orderBy: { nextAttemptAt: 'asc' },
    take: limit,
    select: { id: true }
  });
  let processed = 0;

  for (const candidate of candidates) {
    const leaseToken = randomUUID();
    const locked = await prisma.notificationAttempt.updateMany({
      where: {
        id: candidate.id,
        state: { in: [NotificationAttemptStatus.PENDING, NotificationAttemptStatus.FAILED] },
        OR: [{ lockedUntil: null }, { lockedUntil: { lt: new Date() } }]
      },
      data: { state: NotificationAttemptStatus.PROCESSING, lockedUntil: new Date(Date.now() + leaseMinutes * 60 * 1000), leaseToken }
    });
    if (locked.count !== 1) continue;

    try {
      const attempt = await prisma.notificationAttempt.findUniqueOrThrow({
        where: { id: candidate.id },
        include: { delivery: { include: { order: { include: { buyer: true, seller: true } } } } }
      });
      const order = attempt.delivery.order;
      if (!order) throw new Error('Notification delivery is not linked to an OMS order.');
      const messageId = await sendDeliveryNotification({
        to: order.buyer.email,
        orderRef: order.orderRef,
        orderId: order.id,
        sellerName: order.seller.name ?? 'your seller',
        status: attempt.status === 'OUT_FOR_DELIVERY' ? 'OUT_FOR_DELIVERY' : 'DELIVERED'
      });
      await prisma.notificationAttempt.updateMany({ where: { id: candidate.id, leaseToken }, data: { state: NotificationAttemptStatus.SENT, sentAt: new Date(), providerMessageId: messageId, lockedUntil: null, leaseToken: null } });
      processed += 1;
    } catch (error) {
      const current = await prisma.notificationAttempt.findUnique({ where: { id: candidate.id }, select: { attemptCount: true } });
      const attemptCount = (current?.attemptCount ?? 0) + 1;
      await prisma.notificationAttempt.updateMany({
        where: { id: candidate.id, leaseToken },
        data: { attemptCount, state: attemptCount >= maxAttempts ? NotificationAttemptStatus.DEAD_LETTER : NotificationAttemptStatus.FAILED, lastError: error instanceof Error ? error.message : 'Unknown notification error', nextAttemptAt: nextRetry(attemptCount), lockedUntil: null, leaseToken: null }
      });
    }
  }

  return processed;
}

if (require.main === module) {
  processNotificationBatch().then((count) => {
    console.log(`Processed ${count} notification(s).`);
  }).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  }).finally(() => prisma.$disconnect());
}