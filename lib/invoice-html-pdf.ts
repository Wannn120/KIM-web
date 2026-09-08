import puppeteer from 'puppeteer';
import { renderInvoiceHtml } from './invoice-html-template';
import type { Invoice } from './types';

export async function generateInvoicePdfBufferHtml(invoice: Invoice) {
  const html = renderInvoiceHtml(invoice);
  // Launch headless browser
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    const baseUrl = `file://${process.cwd().replace(/\\/g, '/')}/`;
    await page.setContent(html, { waitUntil: 'load' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '36px', bottom: '36px', left: '36px', right: '36px' } });
    return pdf;
  } finally {
    await browser.close();
  }
}
