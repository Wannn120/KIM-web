const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Adding batch of missing field columns if not exists');
  await prisma.$queryRawUnsafe(`ALTER TABLE "field" ADD COLUMN IF NOT EXISTS image_url text`);
  await prisma.$queryRawUnsafe(`ALTER TABLE "field" ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false`);
  await prisma.$queryRawUnsafe(`ALTER TABLE "field" ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true`);
  await prisma.$queryRawUnsafe(`ALTER TABLE "field" ADD COLUMN IF NOT EXISTS status text DEFAULT 'ACTIVE'`);
  await prisma.$queryRawUnsafe(`ALTER TABLE "field" ADD COLUMN IF NOT EXISTS rating double precision DEFAULT 0`);
  await prisma.$queryRawUnsafe(`ALTER TABLE "field" ALTER COLUMN rating SET DEFAULT 0`);
  console.log('Batch alter complete');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  try { await prisma.$disconnect(); } catch {}
  process.exit(1);
});
