const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const fieldId = '550e8400-e29b-41d4-a716-446655440001';
  const dateIso = '2026-07-28';
  const startTime = '09:00';
  const endTime = '10:00';

  console.log('Using fieldId:', fieldId);

  // Use unsafe raw queries with explicit UUID casts because production schema uses uuid columns
  const checkSql = `SELECT id FROM "field_schedule" WHERE field_id = '${fieldId}'::uuid AND date = '${dateIso}' AND start_time = '${startTime}' LIMIT 1`;
  const existing = await prisma.$queryRawUnsafe(checkSql);

  if (existing && existing.length > 0) {
    console.log('Schedule already exists:', existing[0].id);
    await prisma.$disconnect();
    return;
  }

  console.log('Inserting field_schedule row...');
  const insertSql = `INSERT INTO "field_schedule" (field_id, date, start_time, end_time, is_available, created_at, updated_at) VALUES ('${fieldId}'::uuid, '${dateIso}', '${startTime}', '${endTime}', true, now(), now()) RETURNING id`;
  const inserted = await prisma.$queryRawUnsafe(insertSql);

  console.log('Inserted schedule id:', inserted && inserted[0] ? inserted[0].id : inserted);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Error:', e);
  try { await prisma.$disconnect(); } catch {}
  process.exit(1);
});
