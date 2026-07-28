const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRaw`SELECT id, name FROM "field" ORDER BY created_at DESC LIMIT 50`;
  console.log('Fields found:', rows.length);
  for (const r of rows) console.log(r);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  try { await prisma.$disconnect(); } catch {}
  process.exit(1);
});
