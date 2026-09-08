import type { Invoice } from './types';

export function renderInvoiceHtml(invoice: Invoice) {
  const pad = (n: number | string) => String(n).padStart(2, '0');
  const formatJakartaDate = (value?: string | Date | null): string => {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return '-';
    const parts = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: '2-digit', year: 'numeric' }).formatToParts(date);
    const day = parts.find(p => p.type === 'day')?.value ?? '00';
    const month = parts.find(p => p.type === 'month')?.value ?? '00';
    const year = parts.find(p => p.type === 'year')?.value ?? '0000';
    return `${day}-${month}-${year}`;
  };
  const formatJakartaDateTime = (value?: string | Date | null): string => {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return '-';
    const dt = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(date);
    const day = dt.find(p => p.type === 'day')?.value ?? '00';
    const month = dt.find(p => p.type === 'month')?.value ?? '00';
    const year = dt.find(p => p.type === 'year')?.value ?? '0000';
    const hour = dt.find(p => p.type === 'hour')?.value ?? '00';
    const minute = dt.find(p => p.type === 'minute')?.value ?? '00';
    return `${day}-${month}-${year} ${hour}:${minute} WIB`;
  };
  const normalizeTime = (value?: string | null): string => {
    if (!value || typeof value !== 'string') return '-';
    const match = value.match(/^\s*(\d{1,2}):(\d{2})\s*$/);
    if (!match) return value;
    const h = Number(match[1]);
    const m = Number(match[2]);
    if (Number.isNaN(h) || Number.isNaN(m)) return value;
    return `${pad(h)}:${pad(m)} WIB`;
  };

  const bookingDate = formatJakartaDate(invoice.booking?.bookingDate || invoice.bookingDate);
  const issueDate = formatJakartaDate(invoice.issuedAt);
  const paidDate = invoice.paidAt ? formatJakartaDateTime(invoice.paidAt) : (invoice.payment?.paidAt ? formatJakartaDateTime(invoice.payment.paidAt) : '-');

  const customerName = invoice.customerName || invoice.booking?.customerName || 'Guest';
  const customerEmail = invoice.customerEmail || invoice.booking?.customerEmail || '-';
  const customerPhone = invoice.customerPhone || invoice.booking?.customerPhone || '-';

  const fieldName = invoice.fieldName || 'Lapangan Klaten International';
  const timeRange = `${normalizeTime(invoice.booking?.startTime)} - ${normalizeTime(invoice.booking?.endTime)}`;

  const subtotal = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(invoice.subtotal || 0);
  const discount = invoice.discount ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' , minimumFractionDigits:0}).format(invoice.discount) : null;
  const tax = invoice.tax ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' , minimumFractionDigits:0}).format(invoice.tax) : null;
  const total = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(invoice.total || 0);

  return `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Invoice ${invoice.invoiceNumber}</title>
    <style>
      :root { --accent: #1b6f3f; --accent-soft: #eaf6ee; }
      @font-face { font-family: 'PoppinsLocal'; src: url('assets/fonts/Poppins-Regular.ttf') format('truetype'); font-weight:400; }
      @font-face { font-family: 'PoppinsLocal'; src: url('assets/fonts/Poppins-SemiBold.ttf') format('truetype'); font-weight:600; }
      @page { size: A4; margin: 12mm 10mm 12mm 10mm; }
      body { font-family: 'PoppinsLocal', 'Poppins', Inter, Arial, sans-serif; color:#1b4b2b; background:white; margin:0; }
      .page { position:relative; width:210mm; min-height:297mm; margin:0 auto; padding:10mm 16mm 0; box-sizing:border-box; background:#fff }
      .header { display:flex; justify-content:space-between; align-items:flex-start; z-index:2; position:relative; padding-top:6px; margin-bottom:18px; }
        .header .header-inner { position:relative; z-index:2; width:100%; display:flex; justify-content:space-between; align-items:flex-start }
      .header-banner { width:100%; border-bottom:2px solid var(--accent-soft); padding:10px 0 12px 0; margin-bottom:12px; display:flex; justify-content:space-between; align-items:flex-start }
      .header-banner .brand-title { font-weight:800; font-size:22px; color:var(--accent) }
      .header-banner .brand-sub { font-size:11px; color:#2d5b44 }
      .invoice-meta { text-align:right; min-width:220px }
      .invoice-meta .label { font-size:12px; color:#6b8b78 }
      .invoice-meta .value { font-size:13px; font-weight:700; color:#0b2b18 }
      .paid-badge { display:inline-block; background:var(--accent-soft); color:var(--accent); padding:6px 12px; border-radius:16px; font-weight:800; font-size:11px; margin-top:6px }
      .brand { display:flex; gap:12px; align-items:center; padding-top:8px; min-width:0 }
      .brand .title { font-weight:700; font-size:17px; color:#133a2b; line-height:1.2 }
      .brand .sub { font-size:10px; line-height:1.35; color:#2d5b44 }
      .meta { text-align:right; position:relative; width:260px; padding-top:6px; padding-right:8px; display:flex; flex-direction:column; gap:6px; align-items:flex-end }
      .meta h1 { margin:0; font-size:20px; color:#0b2b18; letter-spacing:0.5px; line-height:1.05 }
      .meta .meta-row { display:block; font-size:11px; color:#6b8b78; line-height:1.25; overflow-wrap:break-word; word-break:break-word }
      .badge-paid { display:inline-block; background:#e9f9ed; color:#1b4b2b; padding:6px 12px; border-radius:16px; font-weight:700; box-shadow:0 2px 0 rgba(27,75,43,0.06); font-size:11px; margin-top:8px }
      .boxed { border:1px solid #dbeedf; border-radius:8px; padding:18px; background:#fff; margin-bottom:14px; overflow-wrap:anywhere; word-break:break-word }
      .boxed .label { color:#3b6b4f; font-weight:700; margin-bottom:8px; font-size:14px; letter-spacing:0.02em }
      .boxed .kv { display:grid; grid-template-columns: 36% 1fr; gap:8px; margin:7px 0; align-items:start }
      .kv .key { color:#3b6b4f; font-size:12px; line-height:1.4; word-break:break-word }
      .kv .value { text-align:right; word-break:break-word; overflow-wrap:anywhere; white-space:normal; font-weight:600; font-size:12px; line-height:1.4 }
      .row { display:flex; gap:18px; flex-wrap:nowrap }
      .col { flex:1; min-width:0; box-sizing:border-box }
      table { width:100%; border-collapse:collapse; table-layout:auto }
      th, td { padding:12px 10px; border-bottom:1px solid #eef7ef; vertical-align:middle; font-size:12px; word-break:break-word; white-space:normal; overflow-wrap:anywhere }
      th { text-align:left; color:#0b2b18; font-size:12px; font-weight:700 }
      thead th { background:transparent }
      .amount { text-align:right; }
      .summary-label { font-weight:700; margin-bottom:8px; font-size:13px; letter-spacing:0.02em; }
      .grand-total-wrap { margin-top:16px; display:flex; justify-content:flex-end }
      .grand-total { border:1px solid #dfeee1; border-radius:8px; padding:12px 16px; text-align:right; font-weight:800; font-size:16px; color:#0b3f24; background:#fff; min-width:220px }
      .grand-total .amount { font-size:18px; display:inline-block; padding-left:8px }
      .detail-block { margin-top:18px; font-size:12px; color:#2b5d46; line-height:1.5 }
      .detail-block strong { font-weight:700; }
      .footer { text-align:center; color:#3b6b4f; margin-top:16px; font-size:12px; z-index:2; position:relative; padding-top:12px; border-top:1px solid #dfeee1 }
      .footer .footer-inner { position:relative; z-index:2; padding:8px 0 }
      .watermark { position:absolute; left:50%; top:44%; transform:translate(-50%,-50%); font-size:200px; color:#8fc79f; opacity:0.02; font-weight:800; z-index:0; pointer-events:none; letter-spacing:12px }
      .content { position:relative; z-index:2 }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="watermark">K I M</div>
      <div class="header-banner">
        <div>
          <div class="brand-title">Klaten International Minisoccer</div>
          <div class="brand-sub">Jl. Stadion, Klaten • hello@minisoccer.id</div>
        </div>
        <div class="invoice-meta">
          <div style="font-size:20px;font-weight:800;color:#0b2b18">INVOICE</div>
          <div style="margin-top:6px"><div class="label">Invoice No.</div><div class="value">${invoice.invoiceNumber}</div></div>
          <div style="margin-top:6px"><div class="label">Invoice Date</div><div class="value">${issueDate}</div></div>
          <div style="margin-top:6px"><div class="label">Payment Date</div><div class="value">${paidDate}</div></div>
          <div style="margin-top:6px"><span class="paid-badge">${(invoice.status||'').toString().toUpperCase()}</span></div>
        </div>
      </div>
      <div class="header">
        <div class="header-inner">
          <div class="brand">
            <div style="width:74px;height:52px;background:#eaf6ee;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;color:#1b4b2b;font-size:22px;border:1px solid rgba(27,75,43,0.08)">KIM</div>
            <div>
              <div class="title">Klaten International Minisoccer</div>
              <div class="sub">Jl. Stadion, Klaten • hello@minisoccer.id</div>
              <div class="sub">klaten-international-minisoccer.vercel.app</div>
            </div>
          </div>
          <div class="meta">
            <h1>Invoice</h1>
            <div class="meta-row">Invoice No. ${invoice.invoiceNumber}</div>
            <div class="meta-row">Booking ID ${invoice.booking?.id || '-'}</div>
            <div class="meta-row">Invoice Date ${issueDate}</div>
            <div class="meta-row">Payment Date ${paidDate}</div>
            <div class="badge-paid">${(invoice.status||'').toString().toUpperCase()}</div>
          </div>
        </div>
      </div>

      <div class="content">
        <div class="row">
          <div class="col boxed">
            <div class="label">Customer</div>
            <div class="kv"><div class="key">Name</div><div class="value">${customerName}</div></div>
          </div>
          <div class="col boxed">
            <div class="label">BOOKING</div>
            <div class="kv"><div class="key">Date</div><div class="value">${bookingDate}</div></div>
            <div class="kv"><div class="key">Time</div><div class="value">${timeRange}</div></div>
            <div class="kv"><div class="key">Duration</div><div class="value">${invoice.booking?.durationHours ?? '-'} Hours</div></div>
            <div class="kv"><div class="key">Payment Method</div><div class="value">${invoice.payment?.paymentMethod || invoice.payment?.provider || '-'}</div></div>
            <div class="kv"><div class="key">Transaction ID</div><div class="value">${invoice.payment?.transactionId || '-'}</div></div>
            <div class="kv"><div class="key">Order ID</div><div class="value">${invoice.payment?.midtransOrderId || '-'}</div></div>
          </div>
        </div>

        <div class="boxed" style="margin-top:18px">
          <div class="summary-label">BOOKING SUMMARY</div>
          <table>
            <thead>
              <tr><th style="width:48%">DESCRIPTION</th><th style="width:12%">QTY</th><th style="width:20%">UNIT PRICE</th><th style="width:20%" class="amount">SUBTOTAL</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>${fieldName}</td>
                <td style="text-align:center;">1</td>
                <td class="amount">${subtotal}</td>
                <td class="amount">${subtotal}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="grand-total-wrap">
          <div class="grand-total">GRAND TOTAL: <span class="amount">${total}</span></div>
        </div>

        <div class="detail-block">
          <div><strong>Transaction ID:</strong> ${invoice.payment?.transactionId || '-'}</div>
          <div><strong>Order ID:</strong> ${invoice.payment?.midtransOrderId || '-'}</div>
          <div><strong>Invoice No:</strong> ${invoice.invoiceNumber}</div>
          <div><strong>Paid:</strong> ${paidDate}</div>
        </div>
      </div>

      <div class="footer">
        <div class="footer-inner">
          <div>Thanks for playing with KIM ⚽</div>
          <div style="margin-top:4px;">@kim.soccerfield • klaten-international-minisoccer.vercel.app</div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
}
