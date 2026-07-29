import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function escapePdfText(text: string) {
  return text.replace(/([\\()])/g, "\\$1");
}

function createInvoicePdf(contentLines: string[]) {
  const lines = contentLines.map((line, index) => {
    const y = 780 - index * 20;
    return `BT /F1 12 Tf 40 ${y} Td (${escapePdfText(line)}) Tj ET`;
  });
  const streamContent = lines.join("\n");
  const stream = `BT\n/F1 12 Tf\n${streamContent}\nET\n`;
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
      booking: { include: { field: true } },
      payment: true,
    },
  });

  if (!invoice) {
    return NextResponse.json({ success: false, message: "Invoice not found." }, { status: 404 });
  }

  const bookingDate = invoice.booking.bookingDate.toISOString().slice(0, 10);
  const lines = [
    `MiniSoccer Invoice`,
    `Invoice number: ${invoice.invoiceNumber}`,
    `Status: ${invoice.status}`,
    `Issued: ${invoice.issuedAt.toISOString().slice(0, 10)}`,
    `Booking ID: ${invoice.bookingId}`,
    `Transaction ID: ${invoice.payment.transactionId}`,
    `Customer: ${invoice.customerName ?? "Guest"}`,
    `Email: ${invoice.customerEmail ?? "-"}`,
    `Phone: ${invoice.customerPhone ?? "-"}`,
    `Field: ${invoice.booking.field?.name ?? invoice.booking.fieldId}`,
    `Booking date: ${bookingDate}`,
    `Start time: ${invoice.booking.startTime}`,
    `End time: ${invoice.booking.endTime}`,
    `Subtotal: Rp ${invoice.subtotal.toLocaleString("id-ID")}`,
    `Discount: Rp ${invoice.discount.toLocaleString("id-ID")}`,
    `Tax: Rp ${invoice.tax.toLocaleString("id-ID")}`,
    `Total: Rp ${invoice.total.toLocaleString("id-ID")}`,
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
