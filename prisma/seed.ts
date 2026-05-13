import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'admin' },
    create: {
      email: adminEmail,
      name: 'Agent Portal Admin',
      role: 'admin',
    },
  });

  await prisma.userWallet.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      balanceMicrocredits: 0,
    },
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
