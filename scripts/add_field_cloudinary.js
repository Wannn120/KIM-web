const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Adding cloudinary_public_id column if not exists');
  const res = await prisma.$queryRawUnsafe(`ALTER TABLE "field" ADD COLUMN IF NOT EXISTS cloudinary_public_id text`);
  console.log('Alter result:', res);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  try { await prisma.$disconnect(); } catch {}
  process.exit(1);
});
