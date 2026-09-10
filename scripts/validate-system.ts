import { DeliveryStatus, PrismaClient, Role, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();
const reset = '\x1b[0m';
const green = '\x1b[32m';
const red = '\x1b[31m';
const yellow = '\x1b[33m';

function pass(message: string) {
  console.log(`${green}PASS${reset} ${message}`);
}

function info(message: string) {
  console.log(`${yellow}INFO${reset} ${message}`);
}

function fail(message: string): never {
  console.error(`${red}FAIL${reset} ${message}`);
  throw new Error(message);
}

async function main() {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const adminEmail = `system-validator-admin-${suffix}@example.test`;
  const buyerEmail = `system-validator-buyer-${suffix}@example.test`;
  const driverEmail = `system-validator-driver-${suffix}@example.test`;
  const orderRef = `SYSTEM-VALIDATOR-${suffix}`;

  let adminId: string | undefined;
  let buyerId: string | undefined;
  let driverId: string | undefined;
  let orderId: string | undefined;

  try {
    let admin = await prisma.user.findFirst({ where: { role: Role.ADMIN, status: { not: UserStatus.DISABLED } }, select: { id: true } });
    if (admin) {
      adminId = admin.id;
      pass('An active ADMIN user exists.');
    } else {
      admin = await prisma.user.create({
        data: { email: adminEmail, name: 'System Validator Admin', role: Role.ADMIN, status: UserStatus.ACTIVE },
        select: { id: true }
      });
      adminId = admin.id;
      pass('No ADMIN existed; created a temporary ADMIN user.');
    }

    const buyer = await prisma.user.create({
      data: { email: buyerEmail, name: 'System Validator Buyer', role: Role.BUYER, status: UserStatus.ACTIVE, sellerId: adminId },
      select: { id: true }
    });
    buyerId = buyer.id;
    pass('Created mock BUYER in the admin tenant.');

    const driver = await prisma.user.create({
      data: { email: driverEmail, name: 'System Validator Driver', role: Role.DRIVER, status: UserStatus.ACTIVE, sellerId: adminId },
      select: { id: true }
    });
    driverId = driver.id;
    pass('Created mock DRIVER in the admin tenant.');

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderRef,
          sellerId: adminId!,
          buyerId: buyerId!,
          deliveryAddress: 'System validator address',
          status: DeliveryStatus.READY_FOR_DISPATCH,
          items: { create: [{ sku: 'VALIDATOR-SKU', description: 'Validation item', quantity: 1 }] }
        },
        select: { id: true }
      });
      const delivery = await tx.delivery.create({
        data: {
          orderId: createdOrder.id,
          orderRef,
          customerPhone: '+10000000000',
          deliveryAddress: 'System validator address',
          status: DeliveryStatus.READY_FOR_DISPATCH,
          assignedUserId: null
        },
        select: { id: true }
      });
      await tx.statusLog.create({ data: { deliveryId: delivery.id, actorId: adminId, status: DeliveryStatus.READY_FOR_DISPATCH, note: 'System validator initial state' } });
      return createdOrder;
    });
    orderId = order.id;
    pass('Created an order, delivery, and initial READY_FOR_DISPATCH StatusLog.');

    const unassignedDelivery = await prisma.delivery.findUnique({ where: { orderId }, select: { id: true, status: true, assignedUserId: true } });
    if (!unassignedDelivery || unassignedDelivery.status !== DeliveryStatus.READY_FOR_DISPATCH || unassignedDelivery.assignedUserId) fail('Initial delivery state is invalid.');
    const selfAssigned = await prisma.delivery.updateMany({ where: { id: unassignedDelivery.id, assignedUserId: null }, data: { assignedUserId: driverId } });
    if (selfAssigned.count !== 1) fail('Driver self-assignment did not update exactly one delivery.');
    const assignedDelivery = { id: unassignedDelivery.id, status: unassignedDelivery.status };
    pass('Verified driver self-assignment and READY_FOR_DISPATCH state.');

    const transition = await prisma.$transaction(async (tx) => {
      const updated = await tx.delivery.updateMany({ where: { id: assignedDelivery.id, assignedUserId: driverId, status: DeliveryStatus.READY_FOR_DISPATCH }, data: { status: DeliveryStatus.OUT_FOR_DELIVERY } });
      if (updated.count !== 1) fail('Optimistic driver transition did not update exactly one delivery.');
      await tx.order.update({ where: { id: orderId }, data: { status: DeliveryStatus.OUT_FOR_DELIVERY } });
      await tx.statusLog.create({ data: { deliveryId: assignedDelivery.id, actorId: driverId, status: DeliveryStatus.OUT_FOR_DELIVERY, note: 'System validator driver transition' } });
      await tx.notificationAttempt.upsert({
        where: { deliveryId_status: { deliveryId: assignedDelivery.id, status: DeliveryStatus.OUT_FOR_DELIVERY } },
        create: { deliveryId: assignedDelivery.id, status: DeliveryStatus.OUT_FOR_DELIVERY, idempotencyKey: `${assignedDelivery.id}:${DeliveryStatus.OUT_FOR_DELIVERY}` },
        update: {}
      });
      return assignedDelivery.id;
    });
    pass(`Simulated DRIVER transition to OUT_FOR_DELIVERY for ${transition}.`);

    const statusLog = await prisma.statusLog.findFirst({ where: { deliveryId: transition, actorId: driverId, status: DeliveryStatus.OUT_FOR_DELIVERY } });
    if (!statusLog) fail('Expected OUT_FOR_DELIVERY StatusLog was not created.');
    pass('Verified the driver status log.');

    const notification = await prisma.notificationAttempt.findUnique({ where: { deliveryId_status: { deliveryId: transition, status: DeliveryStatus.OUT_FOR_DELIVERY } } });
    if (!notification || notification.state !== 'PENDING') fail('Expected pending NotificationAttempt was not created.');
    pass('Verified the transactional notification outbox record.');

    info('Mock validation data will now be removed.');
  } finally {
    if (orderId) await prisma.order.delete({ where: { id: orderId } }).catch(() => undefined);
    if (buyerId) await prisma.user.delete({ where: { id: buyerId } }).catch(() => undefined);
    if (driverId) await prisma.user.delete({ where: { id: driverId } }).catch(() => undefined);
    if (adminId && adminEmail) await prisma.user.deleteMany({ where: { id: adminId, email: adminEmail } }).catch(() => undefined);
  }
}

main()
  .catch(() => {
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
