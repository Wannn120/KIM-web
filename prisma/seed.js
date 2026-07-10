const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: 'demo@minisoccer.local' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@minisoccer.local',
      phone: '+628000000000',
    },
  });

  await prisma.field.upsert({
    where: { name: 'Lapangan Klaten International' },
    update: {},
    create: {
      name: 'Lapangan Klaten International',
      location: 'Klaten',
      price: 110000,
      type: 'Mini Soccer',
      size: '5v5',
      rating: 4.9,
      imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80',
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
