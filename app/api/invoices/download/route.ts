import { NextResponse } from "next/server";
import { generateInvoicePdfBuffer } from "@/lib/invoice-pdf";
import { prisma } from "@/lib/prisma";

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

  const pdfData = generateInvoicePdfBuffer({
    invoiceNumber: invoice.invoiceNumber,
    customerName: invoice.customerName,
    customerEmail: invoice.customerEmail,
    customerPhone: invoice.customerPhone,
    status: invoice.status,
    subtotal: invoice.subtotal,
    discount: invoice.discount,
    tax: invoice.tax,
    total: invoice.total,
    issuedAt: invoice.issuedAt,
    booking: {
      id: invoice.booking.id,
      bookingDate: invoice.booking.bookingDate,
      startTime: invoice.booking.startTime,
      endTime: invoice.booking.endTime,
      customerName: invoice.booking.customerName,
      customerEmail: invoice.booking.customerEmail,
      customerPhone: invoice.booking.customerPhone,
      durationHours: invoice.booking.durationHours,
      totalPrice: invoice.booking.totalPrice,
    },
    payment: {
      transactionId: invoice.payment.transactionId,
      paymentMethod: invoice.payment.paymentMethod,
      provider: invoice.payment.provider,
      paidAt: invoice.payment.paidAt ?? null,
      midtransOrderId: invoice.payment.midtransOrderId ?? null,
    },
    paidAt: invoice.paidAt ?? invoice.payment.paidAt ?? null,
  });

  return new NextResponse(pdfData, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
    },
  });
}
