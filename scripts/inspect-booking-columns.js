const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const tables = ['booking', 'payment', 'invoice', 'review'];
    for (const table of tables) {
      const cols = await prisma.$queryRawUnsafe(`SELECT table_name, column_name FROM information_schema.columns WHERE table_name = '${table}' ORDER BY ordinal_position;`);
      console.log(`=== ${table} ===`);
      console.log(JSON.stringify(cols, null, 2));
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();
