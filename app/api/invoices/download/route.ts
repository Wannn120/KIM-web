import { NextResponse } from "next/server";
import { generateInvoicePdfBuffer } from "@/lib/invoice-pdf";
import { prisma } from "@/lib/prisma";
import type { Invoice } from '@/lib/types';
import type { InvoicePdfInput } from '@/lib/invoice-pdf';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const invoiceNumber = url.searchParams.get("invoiceNumber")?.trim();

  if (!invoiceNumber) {
    return NextResponse.json({ success: false, message: "Missing invoiceNumber query parameter." }, { status: 400 });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { invoiceNumber },
    include: { booking: true, payment: true },
  });

  if (!invoice) {
    return NextResponse.json({ success: false, message: "Invoice not found." }, { status: 404 });
  }

  const payload: Invoice = {
    invoiceNumber: invoice.invoiceNumber,
    customerName: invoice.customerName ?? null,
    customerEmail: invoice.customerEmail ?? null,
    customerPhone: invoice.customerPhone ?? null,
    status: invoice.status ?? null,
    subtotal: invoice.subtotal ?? null,
    discount: invoice.discount ?? null,
    tax: invoice.tax ?? null,
    total: invoice.total ?? null,
    issuedAt: invoice.issuedAt ? (invoice.issuedAt as Date).toISOString() : null,
    booking: {
      id: invoice.booking?.id,
      bookingDate: invoice.booking?.bookingDate ? (invoice.booking!.bookingDate as Date).toISOString() : null,
      startTime: invoice.booking?.startTime ?? null,
      endTime: invoice.booking?.endTime ?? null,
      customerName: invoice.booking?.customerName ?? null,
      customerEmail: invoice.booking?.customerEmail ?? null,
      customerPhone: invoice.booking?.customerPhone ?? null,
      durationHours: invoice.booking?.durationHours ?? null,
    },
    payment: {
      transactionId: invoice.payment?.transactionId ?? null,
      paymentMethod: invoice.payment?.paymentMethod ?? null,
      provider: invoice.payment?.provider ?? null,
      paidAt: invoice.payment?.paidAt ? (invoice.payment!.paidAt as Date).toISOString() : null,
      midtransOrderId: invoice.payment?.midtransOrderId ?? null,
    },
    paidAt: invoice.paidAt ? (invoice.paidAt as Date).toISOString() : (invoice.payment?.paidAt ? (invoice.payment!.paidAt as Date).toISOString() : null),
  };

  let pdfData: Buffer | Uint8Array | ArrayBuffer;

  if (process.env.USE_HTML_PDF === 'true') {
    const mod = await import('@/lib/invoice-html-pdf');
    const generateInvoicePdfBufferHtml = mod.generateInvoicePdfBufferHtml as (inv: Invoice) => Promise<Buffer>;
    pdfData = await generateInvoicePdfBufferHtml(payload);
  } else {
    const pdfPayload = {
      invoiceNumber: String(invoice.invoiceNumber),
      customerName: invoice.customerName ?? invoice.booking?.customerName ?? null,
      customerEmail: invoice.customerEmail ?? invoice.booking?.customerEmail ?? null,
      customerPhone: invoice.customerPhone ?? invoice.booking?.customerPhone ?? null,
      status: invoice.status ?? null,
      subtotal: Number(invoice.subtotal ?? 0),
      discount: invoice.discount ?? null,
      tax: invoice.tax ?? null,
      total: Number(invoice.total ?? (invoice.subtotal ?? 0)),
      issuedAt: invoice.issuedAt ? new Date(invoice.issuedAt) : new Date(),
      paidAt: invoice.paidAt ? new Date(invoice.paidAt) : (invoice.payment?.paidAt ? new Date(invoice.payment.paidAt) : null),
      booking: {
        id: String(invoice.booking?.id ?? ''),
        bookingDate: invoice.booking?.bookingDate ? new Date(invoice.booking!.bookingDate) : new Date(),
        startTime: invoice.booking?.startTime ?? '00:00',
        endTime: invoice.booking?.endTime ?? '00:00',
        customerName: invoice.booking?.customerName ?? null,
        customerEmail: invoice.booking?.customerEmail ?? null,
        customerPhone: invoice.booking?.customerPhone ?? null,
        durationHours: invoice.booking?.durationHours ?? null,
        totalPrice: invoice.booking?.totalPrice ?? null,
      },
      payment: {
        transactionId: String(invoice.payment?.transactionId ?? ''),
        paymentMethod: invoice.payment?.paymentMethod ?? null,
        provider: invoice.payment?.provider ?? null,
        paidAt: invoice.payment?.paidAt ? new Date(invoice.payment!.paidAt) : null,
        midtransOrderId: invoice.payment?.midtransOrderId ?? null,
      },
    };

    pdfData = await generateInvoicePdfBuffer(pdfPayload as InvoicePdfInput);
  }

  const bodyUint8 = Buffer.isBuffer(pdfData) ? Uint8Array.from(pdfData) : new Uint8Array(pdfData as Uint8Array);

  return new NextResponse(bodyUint8, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
    },
  });
}
