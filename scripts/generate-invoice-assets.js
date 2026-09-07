const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function ensureDir(p) {
  await fs.promises.mkdir(p, { recursive: true });
}

async function renderToPng(html, outPath, width = 1200, height = 240) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    // wait a moment for fonts/painting
    await new Promise((res) => setTimeout(res, 120));
    const el = await page.$('body');
    await el.screenshot({ path: outPath, omitBackground: false });
  } finally {
    await browser.close();
  }
}

async function main() {
  const outDir = path.join(process.cwd(), 'assets', 'invoice');
  const fontsDir = path.join(process.cwd(), 'assets', 'fonts');
  await ensureDir(outDir);
  await ensureDir(fontsDir);

  const headerHtml = `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <style>
      html,body{height:100%;margin:0;padding:0}
      body{background:#fff;font-family:Arial}
      .wrap{position:relative;width:100%;height:100%;overflow:hidden}
      .stripe{position:absolute;left:0;top:0;height:56px;width:100%;background:linear-gradient(90deg,#1b6b3f 0%,#6fc24f 30%,#cfe94a 60%)}
      .corner{position:absolute;left:0;top:0;width:120px;height:56px;background:#2e8a4e;clip-path:polygon(0 0,100% 0,0 100%)}
      .logo{position:absolute;left:18px;top:6px;font-weight:800;color:#fff;font-size:22px}
      .title{position:absolute;left:110px;top:8px;color:#133a2b;font-weight:700;font-size:18px}
      .meta{position:absolute;right:18px;top:6px;text-align:right;color:#0b2b18;font-size:12px}
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="stripe"></div>
      <div class="corner"></div>
      <div class="logo">KIM</div>
      <div class="title">Klaten International Minisoccer</div>
      <div class="meta"><div style="font-size:26px;font-weight:800">Invoice</div><div style="margin-top:6px">No. INV/XXXX/XX/XXXX</div></div>
    </div>
  </body>
  </html>
  `;

  const footerHtml = `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <style>
      html,body{height:100%;margin:0;padding:0}
      body{background:#fff}
      .wrap{position:relative;width:100%;height:100%}
      .layer1{position:absolute;left:0;right:0;bottom:0;height:54px;background:#1f6b3e}
      .layer2{position:absolute;left:0;right:0;bottom:18px;height:44px;background:#9ed21f;transform:skewX(-6deg)}
      .layer3{position:absolute;left:0;right:0;bottom:36px;height:28px;background:#6dbf2b;transform:skewX(-3deg)}
      .thanks{position:absolute;left:0;right:0;top:10px;text-align:center;color:#1b6b3f;font-weight:700}
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="thanks">Thanks for playing with KIM • @kim.soccerfield</div>
      <div class="layer3"></div>
      <div class="layer2"></div>
      <div class="layer1"></div>
    </div>
  </body>
  </html>
  `;

  const logoHtml = `
  <!doctype html>
  <html>
  <head><meta charset="utf-8"/><style>html,body{margin:0;padding:0}body{display:flex;align-items:center;justify-content:center;background:#eaf6ee;height:100%}div{font-weight:800;color:#1b4b2b;padding:8px 12px;border-radius:6px}</style></head>
  <body><div>KIM</div></body></html>`;

  const headerOut = path.join(outDir, 'header.png');
  const footerOut = path.join(outDir, 'footer.png');
  const logoOut = path.join(outDir, 'logo.png');

  console.log('Rendering header...');
  await renderToPng(headerHtml, headerOut, 1200, 120);
  console.log('Rendering footer...');
  await renderToPng(footerHtml, footerOut, 1200, 140);
  console.log('Rendering logo...');
  await renderToPng(logoHtml, logoOut, 220, 80);

  console.log('Wrote assets to', outDir);
}

main().catch(err => { console.error(err); process.exitCode = 1 });
