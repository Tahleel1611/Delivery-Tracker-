import { NotificationAttemptStatus, PrismaClient } from '@prisma/client';

const maxAttempts = 5;

/** Database-backed work processor; run it from a dedicated worker/scheduler. */
export async function processPendingNotifications(database: PrismaClient): Promise<number> {
  const jobs = await database.notificationAttempt.findMany({
    where: { state: { in: ['PENDING', 'FAILED'] }, nextAttemptAt: { lte: new Date() } },
    take: 25,
    orderBy: { nextAttemptAt: 'asc' }
  });

  for (const job of jobs) {
    const claimed = await database.notificationAttempt.updateMany({
      where: { id: job.id, state: { in: ['PENDING', 'FAILED'] } },
      data: { state: 'PROCESSING', attemptCount: { increment: 1 } }
    });
    if (claimed.count !== 1) continue;
    try {
      // Provider integration belongs here. Never log phone numbers, tokens, or message text.
      await database.notificationAttempt.update({ where: { id: job.id }, data: { state: 'SENT', sentAt: new Date(), lastError: null } });
      console.info(JSON.stringify({ event: 'notification.sent', notificationId: job.id, provider: job.provider }));
    } catch {
      const attemptCount = job.attemptCount + 1;
      const terminal = attemptCount >= maxAttempts;
      await database.notificationAttempt.update({
        where: { id: job.id },
        data: {
          state: terminal ? 'DEAD_LETTER' : 'FAILED',
          lastError: 'Provider delivery failed.',
          nextAttemptAt: new Date(Date.now() + Math.min(3_600_000, 2 ** attemptCount * 60_000))
        }
      });
    }
  }
  return jobs.length;
}

export const notificationStates = NotificationAttemptStatus;
