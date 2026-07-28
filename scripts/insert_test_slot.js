const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Try to resolve the real field id from the database by name,
  // fallback to a literal id if necessary.
  const targetFieldName = 'Lapangan Klaten International';
  const fallbackFieldId = 'klaten-field-1';
  const date = new Date('2026-07-28T00:00:00.000Z');
  const startTime = '09:00';
  const endTime = '10:00';

  // Resolve field id
  let field = await prisma.field.findFirst({ where: { name: targetFieldName } });
  let fieldId = field ? field.id : fallbackFieldId;

  console.log('Using fieldId:', fieldId);

  console.log('Checking existing slot...');
  const existing = await prisma.fieldSchedule.findFirst({
    where: { fieldId, date, startTime },
  });

  if (existing) {
    console.log('Slot already exists:', existing.id);
    await prisma.$disconnect();
    return;
  }

  console.log('Inserting test slot...');
  const created = await prisma.fieldSchedule.create({
    data: {
      fieldId,
      date,
      startTime,
      endTime,
      isAvailable: true,
    },
  });

  console.log('Created slot:', created.id);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  try {
    await prisma.$disconnect();
  } catch {}
  process.exit(1);
});
