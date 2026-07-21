const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.field.createMany({
    data: [
      {
        name: 'Lapangan Klaten International',
        location: 'Klaten',
        price: 110000,
        type: 'Mini Soccer',
        size: '5v5',
        capacity: 10,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80',
      },
      {
        name: 'Lapangan Merdeka A',
        location: 'Jalan Merdeka No. 123, Klaten',
        price: 130000,
        type: 'Futsal',
        size: '5-aside',
        capacity: 10,
        rating: 4.7,
        imageUrl: 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1200&q=80',
      },
    ],
    skipDuplicates: true,
  });

  const fields = await prisma.field.findMany();
  const fieldId = fields[0]?.id;

  if (fieldId) {
    await prisma.booking.createMany({
      data: [
        {
          fieldId,
          bookingDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          startTime: '18:00',
          endTime: '20:00',
          durationHours: 2,
          totalPrice: 220000,
          customerName: 'Ahmad Rahman',
          customerPhone: '08123456789',
          customerEmail: 'ahmad@email.com',
          status: 'confirmed',
        },
        {
          fieldId,
          bookingDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
          startTime: '19:00',
          endTime: '21:00',
          durationHours: 2,
          totalPrice: 220000,
          customerName: 'Budi Santoso',
          customerPhone: '08987654321',
          customerEmail: 'budi@email.com',
          status: 'pending',
        },
      ],
      skipDuplicates: true,
    });

    const bookings = await prisma.booking.findMany({
      where: { fieldId },
      orderBy: { createdAt: 'asc' },
      take: 2,
    });

    await Promise.all(
      bookings.map((booking) =>
        prisma.payment.upsert({
          where: { transactionId: booking.id },
          update: {},
          create: {
            bookingId: booking.id,
            transactionId: booking.id,
            amount: booking.totalPrice,
            paymentMethod: 'Midtrans',
            provider: 'Midtrans',
            status: booking.status === 'confirmed' ? 'success' : 'pending',
            paidAt: booking.status === 'confirmed' ? new Date() : null,
            expiredAt: new Date(Date.now() + 30 * 60 * 1000),
          },
        })
      )
    );

    const payments = await prisma.payment.findMany({ where: { bookingId: { in: bookings.map((b) => b.id) } } });

    await Promise.all(
      payments.map((payment) =>
        prisma.invoice.upsert({
          where: { paymentId: payment.id },
          update: {},
          create: {
            invoiceNumber: `INV-${payment.transactionId.slice(0, 8).toUpperCase()}`,
            bookingId: payment.bookingId,
            paymentId: payment.id,
            subtotal: payment.amount,
            tax: 0,
            discount: 0,
            total: payment.amount,
            status: payment.status === 'success' ? 'paid' : 'issued',
            paidAt: payment.status === 'success' ? new Date() : null,
          },
        })
      )
    );

    await prisma.review.createMany({
      data: [
        {
          fieldId,
          customerName: 'Ari Putra',
          rating: 5,
          comment: 'Lapangan bersih, proses booking cepat, dan pelayanan ramah.',
        },
        {
          fieldId,
          customerName: 'Nina Sari',
          rating: 4,
          comment: 'Fasilitas bagus dan suasana nyaman. Parkir bisa ditingkatkan.',
        },
      ],
      skipDuplicates: true,
    });
  }

  await prisma.adminSetting.createMany({
    data: [
      { key: 'site_title', value: 'Klaten International Minisoccer', description: 'Nama utama situs web' },
      { key: 'contact_email', value: 'info@klatenminisoccer.id', description: 'Email kontak utama' },
      { key: 'contact_phone', value: '+62 821-1234-5678', description: 'Nomor telepon kontak utama' },
    ],
    skipDuplicates: true,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
