const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const fieldId = '550e8400-e29b-41d4-a716-446655440001';
  const dateIso = '2026-07-28';
  const startTime = '09:00';

  const rows = await prisma.$queryRawUnsafe(`SELECT id, is_available, created_at, updated_at FROM "field_schedule" WHERE field_id='${fieldId}'::uuid AND date='${dateIso}' AND start_time='${startTime}'`);
  console.log('Schedules:', rows);

  const bookings = await prisma.$queryRawUnsafe(`SELECT id, status, created_at FROM "booking" WHERE field_schedule_id IN (SELECT id FROM "field_schedule" WHERE field_id='${fieldId}'::uuid AND date='${dateIso}' AND start_time='${startTime}')`);
  console.log('Related bookings:', bookings);

  const payments = await prisma.$queryRawUnsafe(`SELECT id, status, amount, created_at FROM "payment" WHERE booking_id IN (SELECT id FROM "booking" WHERE field_schedule_id IN (SELECT id FROM "field_schedule" WHERE field_id='${fieldId}'::uuid AND date='${dateIso}' AND start_time='${startTime}'))`);
  console.log('Related payments:', payments);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  try { await prisma.$disconnect(); } catch {}
  process.exit(1);
});
