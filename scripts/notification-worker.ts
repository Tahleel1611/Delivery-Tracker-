import { prisma } from '../src/lib/prisma';
import { processPendingNotifications } from '../src/services/notification.service';

async function main() {
  const processed = await processPendingNotifications(prisma);
  console.info(JSON.stringify({ event: 'notification.worker.complete', processed }));
}

void main().finally(async () => prisma.$disconnect());
