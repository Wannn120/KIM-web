const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  try {
    const record = await prisma.adminSetting.findUnique({ where: { key: 'backgroundImageUrl' } });
    console.log(JSON.stringify(record, null, 2));
  } catch (error) {
    console.error('QUERY FAILED', error);
  } finally {
    await prisma.$disconnect();
  }
})();
