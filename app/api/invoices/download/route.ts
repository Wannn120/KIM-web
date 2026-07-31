import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_FIELD_NAME } from "@/lib/venue";

function escapePdfText(text: string) {
  return text.replace(/([\\()])/g, "\\$1");
}

function writeText(text: string, x: number, y: number, fontSize = 12) {
  return `BT /F1 ${fontSize} Tf ${x} ${y} Td (${escapePdfText(text)}) Tj ET`;
}

function writeLine(x1: number, y1: number, x2: number, y2: number) {
  return `${x1} ${y1} m ${x2} ${y2} l S`;
}

function writeRect(x: number, y: number, width: number, height: number) {
  return `${x} ${y} ${width} ${height} re S`;
}

function formatCurrency(amount: number) {
  return amount.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function createInvoicePdf(contentLines: string[]) {
  const stream = contentLines.join("\n");
  const streamBytes = Buffer.from(stream, "utf8");

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];

  offsets.push(Buffer.byteLength(pdf, "utf8"));
  pdf += "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";

  offsets.push(Buffer.byteLength(pdf, "utf8"));
  pdf += "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";

  offsets.push(Buffer.byteLength(pdf, "utf8"));
  pdf += "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n";

  offsets.push(Buffer.byteLength(pdf, "utf8"));
  pdf += `4 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n`;
  pdf += stream;
  pdf += "endstream\nendobj\n";

  offsets.push(Buffer.byteLength(pdf, "utf8"));
  pdf += "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += "xref\n0 6\n0000000000 65535 f \n";
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const invoiceNumber = url.searchParams.get("invoiceNumber")?.trim();

  if (!invoiceNumber) {
    return NextResponse.json({ success: false, message: "Missing invoiceNumber query parameter." }, { status: 400 });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { invoiceNumber },
    include: {
      booking: true,
      payment: true,
    },
  });

  if (!invoice) {
    return NextResponse.json({ success: false, message: "Invoice not found." }, { status: 404 });
  }

  const bookingDate = invoice.booking.bookingDate.toISOString().slice(0, 10);
  const invoiceStatus = invoice.status?.toUpperCase() ?? "PENDING";
  const invoiceBadge = invoiceStatus === "SUCCESS" ? "PAID" : invoiceStatus === "FAILED" ? "UNPAID" : invoiceStatus;

  const headerLines = [
    writeRect(35, 720, 525, 100),
    writeRect(40, 726, 90, 90),
    writeText("KIM", 50, 776, 20),
    writeText("MiniSoccer", 140, 790, 18),
    writeText("Lapangan Mini Soccer Klaten", 140, 776, 9),
    writeText("Invoice", 140, 748, 16),
    writeText(`Invoice #: ${invoice.invoiceNumber}`, 400, 796, 10),
    writeText(`Date: ${invoice.issuedAt.toISOString().slice(0, 10)}`, 400, 780, 10),
    writeText(`Status:`, 400, 764, 10),
    writeRect(445, 752, 110, 18),
    writeText(invoiceBadge, 450, 766, 10),
    writeText("Jl. Raya Klaten No. 123, Klaten, Jawa Tengah", 140, 734, 8),
    writeText("Telp: +62 812-3456-7890 | info@minisoccer.id", 140, 722, 8),
  ];

  const customerLines = [
    writeRect(35, 614, 250, 96),
    writeText("Billed to", 40, 704, 10),
    writeText(`${invoice.customerName ?? "Guest"}`, 40, 688, 12),
    writeText(`${invoice.customerEmail ?? "-"}`, 40, 672, 12),
    writeText(`${invoice.customerPhone ?? "-"}`, 40, 656, 12),
  ];

  const bookingLines = [
    writeRect(320, 614, 240, 96),
    writeText("Booking details", 325, 704, 10),
    writeText(`Field: ${DEFAULT_FIELD_NAME}`, 325, 688, 12),
    writeText(`Booking date: ${bookingDate}`, 325, 672, 12),
    writeText(`Time: ${invoice.booking.startTime} - ${invoice.booking.endTime}`, 325, 656, 12),
    writeText(`Booking ID: ${invoice.bookingId}`, 325, 640, 12),
    writeText(`Transaction ID: ${invoice.payment.transactionId}`, 325, 624, 12),
    writeText(`Payment method: ${invoice.payment.paymentMethod}`, 325, 608, 12),
    writeText(`Provider: ${invoice.payment.provider}`, 325, 592, 12),
  ];

  const itemLines = [
    writeRect(35, 484, 525, 116),
    writeText("Description", 40, 596, 12),
    writeText("Amount", 400, 596, 12),
    writeLine(40, 590, 555, 590),
    writeText(`Lapangan rental`, 40, 572, 12),
    writeText(formatCurrency(invoice.subtotal), 400, 572, 12),
    writeLine(40, 564, 555, 564),
  ];

  const totalsLines = [
    writeRect(320, 364, 240, 108),
    writeText(`Subtotal:`, 330, 444, 12),
    writeText(formatCurrency(invoice.subtotal), 460, 444, 12),
    writeText(`Discount:`, 330, 428, 12),
    writeText(formatCurrency(invoice.discount ?? 0), 460, 428, 12),
    writeText(`Tax:`, 330, 412, 12),
    writeText(formatCurrency(invoice.tax ?? 0), 460, 412, 12),
    writeLine(330, 404, 555, 404),
    writeText(`Total`, 330, 386, 14),
    writeText(formatCurrency(invoice.total), 460, 386, 14),
  ];

  const footerLines = [
    writeLine(35, 340, 560, 340),
    writeText("Terima kasih telah memesan. Simpan invoice ini sebagai bukti pembayaran.", 40, 322, 10),
    writeText("Contact: +62 812-3456-7890 | info@minisoccer.id", 40, 308, 10),
    writeText("Bank transfer: BNI 123-456-7890 a.n. MiniSoccer Klaten", 40, 294, 10),
    writeText("Syarat: Pembayaran lunas sebelum penggunaan lapangan.", 40, 280, 10),
  ];

  const lines = [
    writeLine(35, 742, 560, 742),
    ...headerLines,
    writeLine(35, 730, 560, 730),
    ...customerLines,
    ...bookingLines,
    writeLine(35, 620, 560, 620),
    ...itemLines,
    ...totalsLines,
    ...footerLines,
  ];

  const pdfData = createInvoicePdf(lines);
  return new NextResponse(pdfData, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
    },
  });
}
