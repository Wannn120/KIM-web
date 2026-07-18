const fs = require('fs');
const path = require('path');
const envPath = path.resolve(__dirname, '.env');
const envText = fs.readFileSync(envPath, 'utf8');
const env = envText
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => line.split(/=(.+)/))
  .reduce((acc, [key, value]) => {
    acc[key] = value?.replace(/^"|"$/g, '') ?? '';
    return acc;
  }, {});

process.env.DATABASE_URL = env.DATABASE_URL;

const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('DATABASE_URL', process.env.DATABASE_URL ? 'set' : 'missing');
  const schedules = await prisma.fieldSchedule.findMany({ take: 10 });
  console.log('sample schedules:', schedules.map((s) => ({ id: s.id, fieldId: s.fieldId, date: s.date.toISOString(), startTime: s.startTime, endTime: s.endTime, isAvailable: s.isAvailable })));
  console.log('schedule count', await prisma.fieldSchedule.count());
  console.log('booking count', await prisma.booking.count());
  console.log('user count', await prisma.user.count());
  console.log('field count', await prisma.field.count());
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });