import { renderInvoiceHtml } from './invoice-html-template';
import type { Invoice } from './types';

function isServerless() {
  return Boolean(
    process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_VERSION ||
      process.env.AWS_EXECUTION_ENV ||
      process.env.FUNCTIONS_WORKER_RUNTIME
  );
}

async function launchBrowser() {
  if (isServerless()) {
    // Vercel / Lambda: use sparticuz chromium + puppeteer-core (no Chrome binary in image).
    const chromium = (await import('@sparticuz/chromium')).default as unknown as {
      args: string[];
      executablePath: () => Promise<string>;
    };
    const puppeteerCore = await import('puppeteer-core');
    const executablePath = await chromium.executablePath();
    return puppeteerCore.launch({
      args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
      defaultViewport: { width: 1280, height: 720 },
      executablePath,
      headless: true,
    });
  }

  // Local / VPS: full puppeteer with bundled Chromium.
  const puppeteer = (await import('puppeteer')).default;
  return puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
}

export async function generateInvoicePdfBufferHtml(invoice: Invoice) {
  const html = renderInvoiceHtml(invoice);
  // Launch headless browser (serverless-aware)
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    const baseUrl = `file://${process.cwd().replace(/\\/g, '/')}/`;
    // Ensure relative asset URLs in the generated HTML resolve to local filesystem
    let resolvedHtml = html.replace(/src="assets\//g, `src="${baseUrl}assets/`);
    resolvedHtml = resolvedHtml.replace(/url\('assets\//g, `url('${baseUrl}assets/`);
    resolvedHtml = resolvedHtml.replace(/url\("assets\//g, `url("${baseUrl}assets/`);
    resolvedHtml = resolvedHtml.replace(/url\(\s*assets\//g, `url(${baseUrl}assets/`);
    await page.setContent(resolvedHtml, { waitUntil: 'load' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '36px', bottom: '36px', left: '36px', right: '36px' } });
    return pdf;
  } finally {
    await browser.close();
  }
}
