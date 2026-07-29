"use client";

import { useState } from "react";

interface InvoiceActionsProps {
  invoiceNumber?: string;
  customerName?: string;
  customerEmail?: string;
  amount?: number;
  bookingDate?: string;
  bookingTime?: string;
}

export function InvoiceActions({
  invoiceNumber,
  customerName,
  customerEmail,
  amount,
  bookingDate,
  bookingTime,
}: InvoiceActionsProps) {
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const copyInvoiceNumber = async () => {
    if (!invoiceNumber) return;
    try {
      await navigator.clipboard.writeText(invoiceNumber);
      setCopyMessage("Invoice number copied.");
    } catch {
      setCopyMessage("Unable to copy invoice number. Please copy it manually.");
    }
  };

  const printInvoice = () => {
    window.print();
  };

  const copyInvoiceDetails = async () => {
    const lines = [
      invoiceNumber ? `Invoice: ${invoiceNumber}` : null,
      customerName ? `Customer: ${customerName}` : null,
      customerEmail ? `Email: ${customerEmail}` : null,
      amount ? `Amount: Rp ${amount.toLocaleString("id-ID")}` : null,
      bookingDate ? `Date: ${bookingDate}` : null,
      bookingTime ? `Time: ${bookingTime}` : null,
    ].filter(Boolean);

    if (!lines.length) return;

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopyMessage("Invoice details copied.");
    } catch {
      setCopyMessage("Unable to copy invoice details. Please copy manually.");
    }
  };

  if (!invoiceNumber) {
    return null;
  }

  return (
    <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6 text-left">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-[color:var(--muted)]">Invoice</p>
          <p className="mt-1 text-lg font-semibold text-white">{invoiceNumber}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={copyInvoiceNumber}
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white"
          >
            Copy invoice number
          </button>
          <button
            type="button"
            onClick={copyInvoiceDetails}
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white"
          >
            Copy invoice details
          </button>
          <a
            href={`/api/invoices/download?invoiceNumber=${encodeURIComponent(invoiceNumber)}`}
            download={`invoice-${invoiceNumber}.pdf`}
            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Download invoice PDF
          </a>
          <button
            type="button"
            onClick={printInvoice}
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white"
          >
            Print
          </button>
        </div>
      </div>
      {copyMessage ? <p className="mt-4 text-sm text-emerald-200">{copyMessage}</p> : null}
    </div>
  );
}
