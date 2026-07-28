const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const scheduleId = 'd5bd2ced-ff25-4fac-b4b9-9d96295d0654';
  console.log('Setting schedule', scheduleId, 'to available');
  const res = await prisma.$queryRawUnsafe(`UPDATE "field_schedule" SET is_available = true, updated_at = now() WHERE id = '${scheduleId}'::uuid RETURNING id, is_available, updated_at`);
  console.log('Update result:', res);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  try { await prisma.$disconnect(); } catch {}
  process.exit(1);
});
