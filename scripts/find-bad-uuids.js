#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function run() {
  try {
    console.log('Scanning payments.bookingId values for malformed UUIDs...');
    const payments = await prisma.payment.findMany({ select: { id: true, bookingId: true } });
    const bad = payments.filter(p => !uuidRe.test(p.bookingId));

    if (bad.length === 0) {
      console.log('No malformed bookingId values found in payment table.');
    } else {
      console.log(`Found ${bad.length} malformed bookingId(s) in payment table:`);
      bad.forEach(p => console.log(`- payment.id=${p.id} bookingId=${p.bookingId}`));
    }

    console.log('\nScanning booking.id values for malformed UUIDs...');
    const bookings = await prisma.booking.findMany({ select: { id: true } });
    const badBookings = bookings.filter(b => !uuidRe.test(b.id));
    if (badBookings.length === 0) {
      console.log('No malformed booking.id values found.');
    } else {
      console.log(`Found ${badBookings.length} malformed booking.id(s):`);
      badBookings.forEach(b => console.log(`- booking.id=${b.id}`));
    }

  } catch (err) {
    console.error('Error running scan:', err);
    process.exitCode = 2;
  } finally {
    await prisma.$disconnect();
  }
}

run();
