const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const targetFieldName = 'Lapangan Klaten International';
  const dateIso = '2026-07-28';
  const startTime = '09:00';
  const endTime = '10:00';

  console.log('Resolving field id via raw SQL...');
  const rows = await prisma.$queryRaw`
    SELECT id FROM "field" WHERE name = ${targetFieldName} LIMIT 1
  `;

  if (!rows || rows.length === 0) {
    console.error('Field not found in database. Aborting.');
    await prisma.$disconnect();
    process.exit(1);
  }

  const fieldId = rows[0].id;
  console.log('Found fieldId:', fieldId);

  // Check existing schedule
  const existing = await prisma.$queryRaw`
    SELECT id FROM "field_schedule" WHERE field_id = ${fieldId} AND date = ${dateIso} AND start_time = ${startTime} LIMIT 1
  `;

  if (existing && existing.length > 0) {
    console.log('Schedule already exists:', existing[0].id);
    await prisma.$disconnect();
    return;
  }

  console.log('Inserting field_schedule row...');
  const inserted = await prisma.$queryRaw`
    INSERT INTO "field_schedule" (field_id, date, start_time, end_time, is_available, created_at, updated_at)
    VALUES (${fieldId}, ${dateIso}, ${startTime}, ${endTime}, true, now(), now())
    RETURNING id
  `;

  console.log('Inserted schedule id:', inserted[0].id);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Error:', e);
  try { await prisma.$disconnect(); } catch {}
  process.exit(1);
});
