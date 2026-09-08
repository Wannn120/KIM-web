const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function main() {
  const baseUrl = `file://${process.cwd().replace(/\\/g, '/')}/`;
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Sample Invoice</title>
  <style>
    @font-face { font-family: 'PoppinsLocal'; src: url('assets/fonts/Poppins-Regular.ttf'); }
    body { font-family: PoppinsLocal, Arial, sans-serif; color:#1b4b2b; margin:0; padding:12mm 16mm }
    .header-banner { width:100%; border-bottom:2px solid #e6f3ea; padding:8px 0 12px 0; margin-bottom:10px }
    .brand-title { font-weight:800; font-size:18px; color:#133a2b }
    .brand-sub { font-size:11px; color:#2d5b44 }
    .boxed { border:1px solid #dbeedf; padding:14px; border-radius:8px; overflow-wrap:anywhere }
    .kv { display:grid; grid-template-columns: 36% 1fr; gap:8px; align-items:start }
    .kv .key { color:#3b6b4f; font-weight:700 }
    .kv .value { text-align:right; font-weight:700 }
    h1 { font-size:20px; margin:8px 0 12px }
    .meta { text-align:right; margin-bottom:8px }
    .badge-paid { display:inline-block; background:#e9f9ed; color:#1b4b2b; padding:6px 12px; border-radius:16px; font-weight:700; font-size:11px }
    .footer-inner { padding:8px 0; border-top:1px solid #dfeee1; margin-top:16px }
  </style>
</head>
<body>
  <div class="header-banner">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <div class="brand-title">Klaten International Minisoccer</div>
        <div class="brand-sub">Jl. Stadion, Klaten • hello@minisoccer.id</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:22px;font-weight:800;color:#0b2b18">INVOICE</div>
        <div style="font-size:12px;color:#6b8b78;margin-top:6px">Invoice No. SAMPLE-123</div>
      </div>
    </div>
  </div>
    <div class="meta"><span>Invoice No. SAMPLE-123</span><span class="badge-paid">PAID</span></div>
  <h1>Invoice SAMPLE-123</h1>
  <div class="boxed">
    <div class="kv"><div class="key">Customer</div><div class="value">Ahmad Rahman</div></div>
    <div class="kv"><div class="key">Date</div><div class="value">08-09-2026</div></div>
    <div class="kv"><div class="key">Time</div><div class="value">18:00 - 20:00</div></div>
    <div class="kv"><div class="key">Payment Method</div><div class="value">Midtrans</div></div>
    <div class="kv"><div class="key">Transaction ID</div><div class="value">TXN-123456789</div></div>
    <div class="kv"><div class="key">Order ID</div><div class="value">ORDER-987654</div></div>
    <div class="kv"><div class="key">Total</div><div class="value">Rp 220.000</div></div>
  </div>
  <div class="grand-total-wrap">
    <div class="grand-total">GRAND TOTAL: <span class="amount">Rp 220.000</span></div>
  </div>
  <div class="footer-inner">
    <div>Thanks for playing with KIM ⚽</div>
    <div style="margin-top:4px;">@kim.soccerfield • klaten-international-minisoccer.vercel.app</div>
  </div>
</body>
</html>`;

  const resolvedHtml = html.replace(/src="assets\//g, `src="${baseUrl}assets/`);

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setContent(resolvedHtml, { waitUntil: 'load' });
    const outPath = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(outPath)) fs.mkdirSync(outPath);
    const pdfPath = path.join(outPath, 'sample-invoice.pdf');
    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
    console.log('Saved sample PDF to', pdfPath);
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
