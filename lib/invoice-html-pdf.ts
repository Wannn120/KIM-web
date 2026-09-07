import puppeteer from 'puppeteer';
import { renderInvoiceHtml } from './invoice-html-template';

export async function generateInvoicePdfBufferHtml(invoice) {
  const html = renderInvoiceHtml(invoice);
  // Launch headless browser
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '36px', bottom: '36px', left: '36px', right: '36px' } });
    return pdf;
  } finally {
    await browser.close();
  }
}
