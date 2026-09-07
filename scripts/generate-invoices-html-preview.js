const fs = require('fs');
const puppeteer = require('puppeteer');

function formatDate(date) {
  return new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);
}

function renderInvoiceHtml(invoice) {
  const bookingDate = formatDate(invoice.booking.bookingDate);
  const issueDate = formatDate(invoice.issuedAt);
  const paidDate = invoice.paidAt ? formatDate(invoice.paidAt) : (invoice.payment && invoice.payment.paidAt ? formatDate(invoice.payment.paidAt) : '-');
  const customerName = invoice.customerName || (invoice.booking && invoice.booking.customerName) || 'Guest';
  const customerEmail = invoice.customerEmail || (invoice.booking && invoice.booking.customerEmail) || '-';
  const customerPhone = invoice.customerPhone || (invoice.booking && invoice.booking.customerPhone) || '-';
  const fieldName = invoice.fieldName || 'Lapangan Klaten International';
  const timeRange = `${invoice.booking.startTime} - ${invoice.booking.endTime}`;
  const subtotal = formatCurrency(invoice.subtotal || 0);
  const discount = invoice.discount ? formatCurrency(invoice.discount) : null;
  const tax = invoice.tax ? formatCurrency(invoice.tax) : null;
  const total = formatCurrency(invoice.total || 0);

  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Invoice ${invoice.invoiceNumber}</title><style>@page{size:A4;margin:36px}body{font-family:Inter, Arial, sans-serif;color:#133a2b} .page{max-width:800px;margin:0 auto} .header{display:flex;justify-content:space-between} .brand{display:flex;gap:12px;align-items:center} .title{font-weight:700;font-size:18px;color:#133a2b} .meta{text-align:right}.meta h1{margin:0;font-size:28px;color:#0b2b18}.boxed{border:1px solid #dbeedf;border-radius:8px;padding:12px}.row{display:flex;gap:16px}.col{flex:1}table{width:100%;border-collapse:collapse}th,td{padding:10px;border-bottom:1px solid #eef7ef}th{color:#0b2b18;font-size:12px}.amount{text-align:right}.grand{background:#f6fff7;border:1px solid #dfeee1;padding:16px;border-radius:8px;text-align:center;font-weight:700}.footer{text-align:center;color:#3b6b4f;margin-top:40px;font-size:12px}</style></head><body><div class="page"><div class="header"><div class="brand"><div style="width:84px;height:64px;background:#eaf6ee;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:700;color:#1b4b2b">KIM</div><div><div class="title">Klaten International Minisoccer</div><div style="font-size:10px;color:#2d5b44">Jl. Stadion, Klaten • hello@minisoccer.id</div><div style="font-size:10px;color:#2d5b44">klaten-international-minisoccer.vercel.app</div></div></div><div class="meta"><h1>Invoice</h1><div style="margin-top:6px;font-size:12px;color:#214a35">No. ${invoice.invoiceNumber}</div><div style="font-size:11px;color:#4a7a5f">Date: ${issueDate}</div><div style="margin-top:8px;padding:6px 10px;background:#e9f9ed;border-radius:16px;display:inline-block;color:#1b4b2b;font-weight:600">${(invoice.status||'').toString().toUpperCase()}</div></div></div><div style="height:18px"></div><div class="row"><div class="col boxed"><div style="font-weight:700;margin-bottom:6px">Customer</div><div><strong>Name</strong> &nbsp; ${customerName}</div><div><strong>Phone</strong> &nbsp; ${customerPhone}</div><div><strong>Email</strong> &nbsp; ${customerEmail}</div></div><div class="col boxed"><div style="font-weight:700;margin-bottom:6px">Booking</div><div><strong>Booking ID</strong> &nbsp; ${invoice.booking.id}</div><div><strong>Date</strong> &nbsp; ${bookingDate}</div><div><strong>Time</strong> &nbsp; ${timeRange}</div><div><strong>Duration</strong> &nbsp; ${invoice.booking.durationHours ?? '-'} Hours</div><div><strong>Payment</strong> &nbsp; ${invoice.payment.paymentMethod || invoice.payment.provider || '-'}</div></div></div><div style="height:18px"></div><div class="boxed"><div style="font-weight:700;margin-bottom:6px">Booking Summary</div><table><thead><tr><th>DESCRIPTION</th><th style="width:64px">QTY</th><th style="width:140px">UNIT PRICE</th><th style="width:140px" class="amount">AMOUNT</th></tr></thead><tbody><tr><td>${fieldName}</td><td>1</td><td class="amount">${subtotal}</td><td class="amount">${subtotal}</td></tr></tbody></table></div><div style="height:12px"></div><div class="row"><div style="flex:1"></div><div style="width:300px"><div style="display:flex;justify-content:space-between;padding:6px 10px;border-bottom:1px solid #eef7ef"><div>Subtotal</div><div>${subtotal}</div></div>${discount?`<div style="display:flex;justify-content:space-between;padding:6px 10px;border-bottom:1px solid #eef7ef"><div>Discount</div><div>- ${discount}</div></div>`:''}${tax?`<div style="display:flex;justify-content:space-between;padding:6px 10px;border-bottom:1px solid #eef7ef"><div>Tax</div><div>${tax}</div></div>`:''}<div style="padding:12px 10px"><div class="grand">${total}</div></div></div></div><div style="height:18px"></div><div style="font-size:12px"><div><strong>Transaction ID:</strong> ${invoice.payment.transactionId || '-'}</div><div><strong>Order ID:</strong> ${invoice.payment.midtransOrderId || '-'}</div><div><strong>Invoice No:</strong> ${invoice.invoiceNumber}</div><div><strong>Paid:</strong> ${paidDate}</div></div><div class="footer">Thanks for playing with KIM • @kim.soccerfield • klaten-international-minisoccer.vercel.app</div></div></body></html>`;
}

async function renderAndSave(invoice, outPath) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setContent(renderInvoiceHtml(invoice), { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '36px', bottom: '36px', left: '36px', right: '36px' } });
    fs.writeFileSync(outPath, pdf);
    console.log('Wrote', outPath, pdf.length);
  } finally {
    await browser.close();
  }
}

const samples = [
  {
    invoiceNumber: 'INV-HTML-0001',
    customerName: 'Budi Santoso',
    customerEmail: 'budi@example.com',
    customerPhone: '+62 812-3456-7890',
    status: 'PAID',
    subtotal: 220000,
    discount: 0,
    tax: 0,
    total: 220000,
    issuedAt: new Date(),
    booking: { id: 'b1', bookingDate: new Date('2026-09-06'), startTime: '07:00', endTime: '09:00', durationHours: 2 },
    payment: { transactionId: 'TX-EX-HTML-001', paymentMethod: 'Midtrans', provider: 'Midtrans', midtransOrderId: 'TX-ORDER-001' },
  },
  {
    invoiceNumber: 'INV-HTML-0002',
    customerName: 'Tim Sepak Bola Panjang Nama Untuk Test',
    customerEmail: 'longname@example.com',
    customerPhone: '+62 899-0000-0000',
    status: 'PENDING',
    subtotal: 450000,
    discount: 50000,
    tax: 22500,
    total: 422500,
    issuedAt: new Date(),
    booking: { id: 'b2', bookingDate: new Date('2026-09-10'), startTime: '18:00', endTime: '20:30', durationHours: 2.5 },
    payment: { transactionId: 'TX-EX-HTML-002', paymentMethod: 'Transfer', provider: 'Manual', midtransOrderId: null },
  }
];

(async function(){
  fs.mkdirSync('tmp/invoices/html', { recursive: true });
  for (const s of samples) {
    const out = `tmp/invoices/html/${s.invoiceNumber}.pdf`;
    await renderAndSave(s, out);
  }
})();
