const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.booking.findMany({
    where: {
      OR: [
        { status: 'pending' },
        { status: 'confirmed' },
        { status: 'completed' },
        { status: 'rescheduled' }
      ]
    },
    orderBy: [{ bookingDate: 'desc' }, { createdAt: 'desc' }],
    take: 100,
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
    }
  });

  console.log(JSON.stringify(rows, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
