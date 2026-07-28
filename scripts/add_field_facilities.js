const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Adding facilities column if not exists');
  const res = await prisma.$queryRawUnsafe(`ALTER TABLE "field" ADD COLUMN IF NOT EXISTS facilities jsonb DEFAULT '[]'::jsonb`);
  console.log('Alter result:', res);
  // Set default empty array for existing rows
  const update = await prisma.$queryRawUnsafe(`UPDATE "field" SET facilities = '[]'::jsonb WHERE facilities IS NULL`);
  console.log('Update result:', update);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  try { await prisma.$disconnect(); } catch {}
  process.exit(1);
});
