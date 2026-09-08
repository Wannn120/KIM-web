const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find a confirmed booking or any booking
  const booking = await prisma.booking.findFirst({ where: { status: 'confirmed' } }) || await prisma.booking.findFirst();
  if (!booking) {
    console.error('No booking found. Run prisma/seed.js first.');
    process.exit(1);
  }

  const payment = await prisma.payment.findFirst({ where: { bookingId: booking.id } });
  if (!payment) {
    console.error('No payment found for booking.');
    process.exit(1);
  }

  const invoiceNumber = `SAMPLE-${Date.now()}`;

  const existing = await prisma.invoice.findFirst({ where: { bookingId: booking.id } });
  if (existing) {
    console.log('Invoice already exists for booking:', existing.invoiceNumber);
    console.log(existing.invoiceNumber);
    process.exit(0);
  }

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      bookingId: booking.id,
      paymentId: payment.id,
      subtotal: booking.totalPrice || 0,
      tax: 0,
      discount: 0,
      total: booking.totalPrice || 0,
      status: 'paid',
      issuedAt: new Date(),
      paidAt: new Date(),
    },
  });

  console.log('Created invoice:', invoice.invoiceNumber);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
