const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bookingId = '077e7435-12b6-4791-81f7-0e16a2ccfe56';
  console.log('Checking booking and payments for', bookingId);
  const booking = await prisma.$queryRawUnsafe(`SELECT id, status, booking_date, start_time, end_time, customer_name FROM "booking" WHERE id='${bookingId}'::uuid`);
  console.log('Booking:', booking);
  const payments = await prisma.$queryRawUnsafe(`SELECT id, status, provider, amount, transaction_id, snap_token, payment_link_url, created_at FROM "payment" WHERE booking_id='${bookingId}'::uuid`);
  console.log('Payments:', payments);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  try { await prisma.$disconnect(); } catch {}
  process.exit(1);
});
