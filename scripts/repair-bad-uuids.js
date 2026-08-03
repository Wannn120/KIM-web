#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const args = process.argv.slice(2);
const fix = args.includes('--fix');
const dry = args.includes('--dry-run') || !fix;

const hexRe = /[0-9a-f]/i;

function normalizeCandidate(raw) {
  if (!raw || typeof raw !== 'string') return null;
  // Remove non-hex characters
  const hexOnly = raw.replace(/[^0-9a-f]/gi, '');
  if (hexOnly.length === 32) {
    return hexOnly.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5').toLowerCase();
  }

  // If there's a 32-length hex substring, use that
  const match = hexOnly.match(/[0-9a-f]{32}/i);
  if (match) {
    return match[0].replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5').toLowerCase();
  }

  return null;
}

async function run() {
  try {
    console.log(dry ? 'Running in dry-run mode (no updates will be applied).' : 'Running with --fix (will update records).');

    const payments = await prisma.payment.findMany({ select: { id: true, bookingId: true, transactionId: true } });
    const bad = payments.filter(p => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.bookingId));

    if (bad.length === 0) {
      console.log('No malformed bookingId values found in payment table.');
      return;
    }

    console.log(`Found ${bad.length} malformed bookingId(s) in payment table.`);

    for (const p of bad) {
      console.log(`\n- payment.id=${p.id} transactionId=${p.transactionId} bookingId=${p.bookingId}`);
      const candidate = normalizeCandidate(p.bookingId);
      if (!candidate) {
        console.log('  -> Unable to derive a 32-hex candidate from this value. Skipping.');
        continue;
      }

      console.log(`  -> Normalized candidate: ${candidate}`);
      const booking = await prisma.booking.findUnique({ where: { id: candidate }, select: { id: true } });
      if (booking) {
        console.log(`  -> Matching booking found: ${booking.id}`);
        if (!dry) {
          await prisma.payment.update({ where: { id: p.id }, data: { bookingId: booking.id } });
          console.log('  -> Updated payment.bookingId to normalized value.');
        } else {
          console.log('  -> Dry-run: would update payment.bookingId to normalized value.');
        }
      } else {
        console.log('  -> No matching booking with normalized id found. Skipping.');
      }
    }

    console.log('\nRepair script completed.');
  } catch (err) {
    console.error('Error running repair script:', err);
    process.exitCode = 2;
  } finally {
    await prisma.$disconnect();
  }
}

run();
