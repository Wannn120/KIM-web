const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.adminSetting.findMany({
    where: { key: { in: ['backgroundImageUrl'] } },
    orderBy: { key: 'asc' },
  });

  const features = await prisma.venueFeature.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  const gallery = await prisma.venueGallery.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  console.log('SETTINGS');
  console.log(JSON.stringify(settings, null, 2));
  console.log('FEATURES');
  console.log(JSON.stringify(features.map((f) => ({ id: f.id, name: f.name, imageUrl: f.imageUrl })), null, 2));
  console.log('GALLERY');
  console.log(JSON.stringify(gallery.map((g) => ({ id: g.id, title: g.title, imageUrl: g.imageUrl })), null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
