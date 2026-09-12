import { renderInvoiceHtml } from "../lib/invoice-html-template";
import { generateInvoicePdfBufferHtml } from "../lib/invoice-html-pdf";

async function main() {
  const sample: any = { invoiceNumber: "TEST-1", subtotal: 100000, total: 100000, status: "SUCCESS", issuedAt: new Date().toISOString(), booking: { bookingDate: new Date().toISOString(), startTime: "10:00", endTime: "11:00", durationHours: 1 }, payment: { transactionId: "tx1" } };
  try {
    console.log("html:" + renderInvoiceHtml(sample).slice(0, 80));
    const pdf = await generateInvoicePdfBufferHtml(sample);
    console.log("classic ok bytes:" + pdf.length);
  } catch (e) {
    const err = e as Error;
    console.error("classic fail:" + (err.message || String(e)));
    console.error(String(err.stack || "").slice(0, 2000));
    process.exit(1);
  }
}
main();