const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function escapePdfText(text) {
  return String(text || '').replace(/([\\()])/g, "\\$1");
}
function writeText(text, x, y, fontSize = 12) {
  return `BT /F1 ${fontSize} Tf ${x} ${y} Td (${escapePdfText(text)}) Tj ET`;
}
function writeLine(x1, y1, x2, y2) {
  return `${x1} ${y1} m ${x2} ${y2} l S`;
}
function writeRect(x, y, width, height) {
  return `${x} ${y} ${width} ${height} re S`;
}
function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}
function formatDateTime(dt) {
  if (!dt) return '-';
  const d = new Date(dt);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function createInvoicePdf(contentLines) {
  const stream = contentLines.join('\n');
  const streamBytes = Buffer.from(stream, 'utf8');

  let pdf = '%PDF-1.4\n';
  const offsets = [];

  offsets.push(Buffer.byteLength(pdf, 'utf8'));
  pdf += '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';

  offsets.push(Buffer.byteLength(pdf, 'utf8'));
  pdf += '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';

  offsets.push(Buffer.byteLength(pdf, 'utf8'));
  pdf += '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n';

  offsets.push(Buffer.byteLength(pdf, 'utf8'));
  pdf += `4 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n`;
  pdf += stream;
  pdf += '\nendstream\nendobj\n';

  offsets.push(Buffer.byteLength(pdf, 'utf8'));
  pdf += '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += 'xref\n0 6\n0000000000 65535 f \n';
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'utf8');
}

function buildPdfFromInvoice(inv) {
  const bookingDate = formatDate(inv.booking.bookingDate);
  const issueDate = formatDate(inv.issuedAt);
  const paidDateTime = inv.paidAt || inv.payment?.paidAt ? formatDateTime(inv.paidAt || inv.payment.paidAt) : '-';
  const statusBadge = (inv.status || 'issued').toString().toUpperCase();

  const subtotal = Number(inv.subtotal || 0);
  const discount = Number(inv.discount || 0);
  const tax = Number(inv.tax || 0);
  const total = Number(inv.total || subtotal - discount + tax);

  const customerName = inv.customerName || inv.booking.customerName || 'Guest';
  const customerEmail = inv.customerEmail || inv.booking.customerEmail || '-';
  const customerPhone = inv.customerPhone || inv.booking.customerPhone || '-';
  const paymentMethod = inv.payment?.paymentMethod || 'Midtrans';
  const provider = inv.payment?.provider || 'Midtrans';
  const fieldName = inv.fieldName || 'Lapangan Klaten International';
  const timeRange = `${inv.booking.startTime} - ${inv.booking.endTime}`;

  const lines = [];
  lines.push(writeRect(32, 760, 530, 64));
  lines.push(writeText('KIM', 56, 792, 26));
  lines.push(writeText('Klaten International Minisoccer', 170, 794, 10));
  lines.push(writeText('INVOICE', 470, 798, 18));
  lines.push(writeText(`No. ${inv.invoiceNumber}`, 460, 786, 8));
  lines.push(writeText(`Booking ID: ${inv.bookingId}`, 460, 774, 7));
  lines.push(writeText(`Date: ${issueDate}`, 460, 762, 7));
  lines.push(`0.88 g 444 760 84 18 re f 0 g`);
  lines.push(writeText(statusBadge, 452, 764, 8));

  // Customer box
  lines.push(writeRect(32, 620, 250, 108));
  lines.push(writeText('CUSTOMER', 48, 705, 10));
  lines.push(writeText('Name', 48, 684, 8));
  lines.push(writeText(customerName, 120, 684, 8));
  lines.push(writeText('Phone', 48, 670, 8));
  lines.push(writeText(customerPhone, 120, 670, 8));
  lines.push(writeText('Email', 48, 656, 8));
  lines.push(writeText(customerEmail, 120, 656, 8));

  // Booking box
  lines.push(writeRect(312, 620, 250, 108));
  lines.push(writeText('BOOKING', 328, 705, 10));
  lines.push(writeText('Date', 328, 684, 8));
  lines.push(writeText(bookingDate, 392, 684, 8));
  lines.push(writeText('Time', 328, 670, 8));
  lines.push(writeText(timeRange, 392, 670, 8));
  lines.push(writeText('Duration', 328, 656, 8));
  lines.push(writeText(`${inv.booking.durationHours || 'N/A'} Hours`, 392, 656, 8));
  lines.push(writeText('Payment', 328, 642, 8));
  lines.push(writeText(paymentMethod, 392, 642, 8));
  lines.push(writeText('Paid', 328, 630, 7));
  lines.push(writeText(paidDateTime, 392, 630, 7));

  // Booking summary table
  lines.push(writeRect(32, 470, 500, 118));
  lines.push(writeText('BOOKING SUMMARY', 48, 566, 11));
  lines.push(writeText('DESCRIPTION', 48, 545, 8));
  lines.push(writeText('QTY', 368, 545, 8));
  lines.push(writeText('UNIT PRICE', 420, 545, 8));
  lines.push(writeText('AMOUNT', 485, 545, 8));

  lines.push(writeText(inv.fieldName || 'Lapangan Klaten International', 48, 516, 9));
  lines.push(writeText('1', 378, 516, 9));
  lines.push(writeText(formatCurrency(subtotal), 424, 516, 9));
  lines.push(writeText(formatCurrency(subtotal), 487, 516, 9));

  // totals
  lines.push(writeRect(342, 294, 190, 136));
  lines.push(writeLine(342, 360, 532, 360));
  lines.push(writeText('GRAND TOTAL', 358, 388, 10));
  lines.push(writeText(formatCurrency(total), 430, 370, 14));

  lines.push(writeText(`Transaction ID: ${inv.payment?.transactionId || '-'}`, 48, 318, 8));
  lines.push(writeText(`Invoice No: ${inv.invoiceNumber}`, 48, 304, 8));

  lines.push(writeLine(32, 182, 562, 182));
  lines.push(writeText('Thank you for booking with KIM', 208, 160, 10));

  return createInvoicePdf(lines);
}

async function run(invoiceNumber) {
  if (!invoiceNumber) {
    console.error('Usage: node generate-invoice-from-db.js <invoiceNumber>');
    process.exit(1);
  }

  const invoice = await prisma.invoice.findUnique({ where: { invoiceNumber }, include: { booking: true, payment: true } });
  if (!invoice) {
    console.error('Invoice not found:', invoiceNumber);
    process.exit(1);
  }

  const buffer = buildPdfFromInvoice(invoice);
  fs.mkdirSync('tmp/invoices', { recursive: true });
  const out = `tmp/invoices/${invoiceNumber}-db.pdf`;
  fs.writeFileSync(out, buffer);
  console.log('Wrote', out, buffer.length);
  process.exit(0);
}

const argv = process.argv.slice(2);
run(argv[0]);
