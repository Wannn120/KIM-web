const fs = require('fs');

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
function formatDate(date) {
  return new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
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

function generateInvoicePdfBuffer(invoice) {
  const bookingDate = formatDate(invoice.booking.bookingDate);
  const issueDate = formatDate(invoice.issuedAt);
  const statusText = (invoice.status || 'pending').toUpperCase();
  const statusBadge = statusText === 'SUCCESS' ? 'PAID' : statusText === 'FAILED' ? 'UNPAID' : statusText;

  const subtotal = Number(invoice.subtotal || 0);
  const discount = Number(invoice.discount || 0);
  const tax = Number(invoice.tax || 0);
  const total = Number(invoice.total || subtotal - discount + tax);

  const customerName = (invoice.customerName || '').trim() || 'Guest';
  const customerEmail = (invoice.customerEmail || '').trim() || '-';
  const customerPhone = (invoice.customerPhone || '').trim() || '-';
  const paymentMethod = invoice.payment && invoice.payment.paymentMethod ? invoice.payment.paymentMethod : 'Midtrans';
  const provider = invoice.payment && invoice.payment.provider ? invoice.payment.provider : 'Midtrans';
  const fieldName = 'Lapangan Klaten International';
  const timeRange = `${invoice.booking.startTime} - ${invoice.booking.endTime}`;
  const durationHours = Math.max(1, Math.ceil((new Date(`1970-01-02T${invoice.booking.endTime}:00`).getTime() - new Date(`1970-01-02T${invoice.booking.startTime}:00`).getTime()) / 3600000));

  const paymentLabel = paymentMethod || 'Midtrans';
  const summaryRows = [
    { label: 'Subtotal', value: formatCurrency(subtotal) },
    ...(discount > 0 ? [{ label: 'Discount', value: `- ${formatCurrency(discount)}` }] : []),
    ...(tax > 0 ? [{ label: 'Tax', value: formatCurrency(tax) }] : []),
    { label: 'Total', value: formatCurrency(total) },
  ];

  const headerLines = [
    writeRect(32, 760, 530, 64),
    writeLine(32, 760, 562, 760),
    writeLine(32, 824, 562, 824),
    writeRect(32, 760, 120, 64),
    writeText('KIM', 60, 789, 24),
    writeText('KLATEN INTERNATIONAL MINI SOCCER', 170, 792, 12),
    writeText('Jl. Stadion, Klaten • hello@minisoccer.id', 170, 778, 7),
    writeText('Website: klaten-international-minisoccer.vercel.app', 170, 768, 7),
    writeText('INVOICE', 470, 794, 18),
    writeText(`No. ${invoice.invoiceNumber}`, 464, 780, 8),
    writeText(`Date: ${issueDate}`, 464, 770, 7),
    writeText(`Status: ${statusBadge}`, 464, 760, 7),
  ];

  const customerLines = [
    writeRect(32, 620, 250, 108),
    writeText('CUSTOMER', 48, 705, 10),
    writeLine(32, 698, 282, 698),
    writeText('Name', 48, 684, 8),
    writeText(customerName, 120, 684, 8),
    writeText('Phone', 48, 670, 8),
    writeText(customerPhone, 120, 670, 8),
    writeText('Email', 48, 656, 8),
    writeText(customerEmail, 120, 656, 8),
  ];

  const bookingLines = [
    writeRect(312, 620, 250, 108),
    writeText('BOOKING', 328, 705, 10),
    writeLine(312, 698, 562, 698),
    writeText('Date', 328, 684, 8),
    writeText(bookingDate, 392, 684, 8),
    writeText('Time', 328, 670, 8),
    writeText(timeRange, 392, 670, 8),
    writeText('Duration', 328, 656, 8),
    writeText(`${durationHours} Hours`, 392, 656, 8),
    writeText('Payment', 328, 642, 8),
    writeText(paymentLabel, 392, 642, 8),
  ];

  const tableHeader = [
    writeRect(32, 470, 500, 118),
    writeText('BOOKING SUMMARY', 48, 566, 11),
    writeLine(32, 560, 532, 560),
    writeText('DESCRIPTION', 48, 545, 8),
    writeText('QTY', 368, 545, 8),
    writeText('UNIT PRICE', 420, 545, 8),
    writeText('AMOUNT', 485, 545, 8),
    writeLine(32, 536, 532, 536),
  ];

  const bookingRow = [
    writeText(fieldName, 48, 516, 9),
    writeText('1', 378, 516, 9),
    writeText(formatCurrency(subtotal), 424, 516, 9),
    writeText(formatCurrency(subtotal), 487, 516, 9),
    writeLine(32, 500, 532, 500),
  ];

  const totalsBox = [
    writeRect(360, 298, 172, 128),
    writeText('TOTAL', 380, 394, 10),
    writeText(formatCurrency(total), 416, 378, 12),
    writeLine(360, 368, 532, 368),
  ];

  const breakdownLines = [
    writeText(`Booking Date: ${bookingDate}`, 48, 360, 8),
    writeText(`Time Slot: ${timeRange}`, 48, 346, 8),
    writeText(`Provider: ${provider}`, 48, 332, 8),
    writeText(`Transaction ID: ${invoice.payment.transactionId}`, 48, 318, 8),
  ];

  const amountBreakdown = summaryRows.map((row, index) => {
    const y = 430 - index * 16;
    return [writeText(row.label, 368, y, 8), writeText(row.value, 480, y, 8)];
  }).flat();

  const footer = [
    writeLine(32, 182, 562, 182),
    writeText('Thank you for booking with KIM', 208, 160, 10),
    writeText('@kim.soccerfield • klaten-international-minisoccer.vercel.app', 170, 144, 8),
    writeText('For questions: +62 812-3456-7890', 216, 130, 8),
    writeRect(0, 0, 595, 26),
    writeLine(0, 0, 595, 26),
    writeLine(0, 0, 595, 0),
  ];

  const accentLines = [
    writeLine(0, 0, 90, 26),
    writeLine(0, 26, 90, 0),
    writeLine(510, 0, 595, 26),
    writeLine(510, 26, 595, 0),
  ];

  const lines = [
    ...accentLines,
    ...headerLines,
    ...customerLines,
    ...bookingLines,
    ...tableHeader,
    ...bookingRow,
    ...amountBreakdown,
    ...totalsBox,
    ...breakdownLines,
    ...footer,
  ];

  return createInvoicePdf(lines);
}

// Sample invoice data
const sample = {
  invoiceNumber: 'INV-2026-0001',
  customerName: 'Budi Santoso',
  customerEmail: 'budi@example.com',
  customerPhone: '+62 812-3456-7890',
  status: 'SUCCESS',
  subtotal: 220000,
  discount: 0,
  tax: 0,
  total: 220000,
  issuedAt: new Date(),
  booking: { id: 'b1', bookingDate: new Date('2026-09-06'), startTime: '07:00', endTime: '09:00' },
  payment: { transactionId: 'TX-EXAMPLE-123', paymentMethod: 'Midtrans', provider: 'Midtrans' },
};

const buffer = generateInvoicePdfBuffer(sample);
fs.mkdirSync('tmp', { recursive: true });
fs.writeFileSync('tmp/invoice-sample.pdf', buffer);
console.log('Wrote tmp/invoice-sample.pdf', buffer.length);
