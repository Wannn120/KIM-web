const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const bookings = await prisma.booking.findMany({ take: 10, orderBy: { createdAt: 'desc' } });
    console.log(JSON.stringify(bookings.map((b) => ({ id: b.id, bookingDate: b.bookingDate?.toISOString(), status: b.status })), null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
})();
