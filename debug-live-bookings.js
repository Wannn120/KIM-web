import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.booking.findMany({
    where: {
      bookingDate: {
        gte: new Date('2026-09-06T00:00:00.000Z'),
        lt: new Date('2026-09-07T00:00:00.000Z'),
      },
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      bookingDate: true,
      startTime: true,
      endTime: true,
      status: true,
      createdAt: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      totalPrice: true,
    },
  });

  console.log(JSON.stringify(rows, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
