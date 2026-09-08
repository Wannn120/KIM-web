const fs = require('fs');
const path = require('path');
const { generateInvoicePdfBufferHtml } = require('../lib/invoice-html-pdf');

async function main() {
  const sample = {
    invoiceNumber: 'INV-TEST-0001',
    customerName: 'Ahmad Rahman',
    customerEmail: null,
    customerPhone: null,
    status: 'paid',
    subtotal: 500000,
    discount: 0,
    tax: 0,
    total: 500000,
    issuedAt: new Date().toISOString(),
    paidAt: new Date().toISOString(),
    booking: {
      id: '660e8400-e29b-41d4-a716-446655440000',
      bookingDate: new Date(Date.now() + 24*3600*1000).toISOString(),
      startTime: '18:00',
      endTime: '20:00',
      customerName: 'Ahmad Rahman',
      customerEmail: null,
      customerPhone: null,
      durationHours: 2,
    },
    payment: {
      transactionId: '770e8400-e29b-41d4-a716-446655440000',
      paymentMethod: 'Midtrans',
      provider: 'Midtrans',
      paidAt: new Date().toISOString(),
      midtransOrderId: 'ORDER-12345',
    }
  };

  try {
    const pdf = await generateInvoicePdfBufferHtml(sample);
    const outDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
    const outPath = path.join(outDir, 'invoice-module-sample.pdf');
    fs.writeFileSync(outPath, pdf);
    console.log('Saved module-generated PDF to', outPath);
  } catch (err) {
    console.error('Failed to generate PDF:', err);
    process.exit(1);
  }
}

main();
