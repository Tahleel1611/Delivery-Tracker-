import { PrismaClient, Role, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase() ?? 'admin@example.com';
  const name = process.env.SEED_ADMIN_NAME?.trim() || 'OMS Administrator';

  const admin = await prisma.user.upsert({
    where: { email },
    update: { name, role: Role.ADMIN, status: UserStatus.ACTIVE },
    create: { email, name, role: Role.ADMIN, status: UserStatus.ACTIVE }
  });

  console.log(`Seeded admin user: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });