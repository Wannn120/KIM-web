export function renderInvoiceHtml(invoice) {
  const bookingDate = new Date(invoice.booking.bookingDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  const issueDate = new Date(invoice.issuedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  const paidDate = invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : (invoice.payment?.paidAt ? new Date(invoice.payment.paidAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-');

  const customerName = invoice.customerName || invoice.booking.customerName || 'Guest';
  const customerEmail = invoice.customerEmail || invoice.booking.customerEmail || '-';
  const customerPhone = invoice.customerPhone || invoice.booking.customerPhone || '-';

  const fieldName = invoice.fieldName || 'Lapangan Klaten International';
  const timeRange = `${invoice.booking.startTime} - ${invoice.booking.endTime}`;

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
      @font-face { font-family: 'PoppinsLocal'; src: url('assets/fonts/Poppins-Regular.ttf') format('truetype'); font-weight:400; }
      @font-face { font-family: 'PoppinsLocal'; src: url('assets/fonts/Poppins-SemiBold.ttf') format('truetype'); font-weight:600; }
      @page { size: A4; margin: 12mm 10mm 12mm 10mm; }
      body { font-family: 'PoppinsLocal', 'Poppins', Inter, Arial, sans-serif; color:#1b4b2b; background:white; margin:0; }
      .page { position:relative; width:210mm; min-height:297mm; margin:0 auto; padding:10mm 16mm 0; box-sizing:border-box; background:#fff }
      .header { display:flex; justify-content:space-between; align-items:flex-start; z-index:2; position:relative; padding-top:12px; margin-bottom:18px; height:132px }
        .header img.header-img { position:absolute; left:-16mm; top:0; width:calc(100% + 32mm); height:132px; object-fit:cover; z-index:0 }
        .header .header-inner { position:relative; z-index:2; width:100%; display:flex; justify-content:space-between; align-items:flex-start }
      .brand { display:flex; gap:12px; align-items:center; padding-top:18px; min-width:0 }
      .brand .title { font-weight:700; font-size:17px; color:#133a2b; line-height:1.2 }
      .brand .sub { font-size:10px; line-height:1.35; color:#2d5b44 }
      .meta { text-align:right; position:relative; width:318px; padding-top:6px; padding-right:8px }
      .meta h1 { margin:0; font-size:42px; color:#0b2b18; letter-spacing:0.5px; line-height:1 }
      .meta .meta-row { display:block; font-size:11px; color:#6b8b78; margin-top:4px; line-height:1.25; overflow-wrap:break-word; word-break:break-word }
      .badge-paid { position:absolute; right:8px; top:64px; background:#e9f9ed; color:#1b4b2b; padding:8px 14px; border-radius:18px; font-weight:700; box-shadow:0 2px 0 rgba(27,75,43,0.08); font-size:12px }
      .boxed { border:1px solid #dbeedf; border-radius:8px; padding:16px 18px; background:#fff; margin-bottom:14px; overflow:hidden }
      .boxed .label { color:#3b6b4f; font-weight:700; margin-bottom:8px; font-size:14px; letter-spacing:0.02em }
      .boxed .kv { display:flex; justify-content:space-between; margin:7px 0; align-items:center; gap:10px }
      .kv .key { width:38%; color:#3b6b4f; font-size:12px; line-height:1.4 }
      .kv .value { width:60%; text-align:right; word-break:break-word; overflow-wrap:break-word; font-weight:600; font-size:12px; line-height:1.4 }
      .row { display:flex; gap:18px; flex-wrap:nowrap }
      .col { flex:1; min-width:0; box-sizing:border-box }
      table { width:100%; border-collapse:collapse; table-layout:fixed }
      th, td { padding:12px 10px; border-bottom:1px solid #eef7ef; vertical-align:middle; font-size:12px }
      th { text-align:left; color:#0b2b18; font-size:12px; font-weight:700 }
      thead th { background:transparent }
      .amount { text-align:right; }
      .summary-label { font-weight:700; margin-bottom:8px; font-size:13px; letter-spacing:0.02em; }
      .grand-total-wrap { margin-top:16px }
      .grand-total { border:1px solid #dfeee1; border-radius:8px; padding:14px 12px; text-align:center; font-weight:800; font-size:18px; color:#0b3f24; background:#fff }
      .grand-total .amount { font-size:20px; display:inline-block; padding:8px 12px }
      .detail-block { margin-top:18px; font-size:12px; color:#2b5d46; line-height:1.5 }
      .detail-block strong { font-weight:700; }
      .footer { text-align:center; color:#3b6b4f; margin-top:16px; font-size:12px; z-index:2; position:relative; padding-top:17px; border-top:1px solid #dfeee1 }
      .footer img.footer-img { position:absolute; left:-16mm; right:-16mm; bottom:0; width:calc(100% + 32mm); height:110px; object-fit:cover; z-index:1 }
      .watermark { position:absolute; left:50%; top:44%; transform:translate(-50%,-50%); font-size:200px; color:#8fc79f; opacity:0.02; font-weight:800; z-index:0; pointer-events:none; letter-spacing:12px }
      .content { position:relative; z-index:2 }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="watermark">K I M</div>
      <div class="header">
        <img class="header-img" src="assets/invoice/header.png" alt="header" />
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
            <div class="meta-row">Booking ID ${invoice.booking.id}</div>
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
            <div class="kv"><div class="key">Phone</div><div class="value">${customerPhone}</div></div>
            <div class="kv"><div class="key">Email</div><div class="value">${customerEmail}</div></div>
            <div class="kv"><div class="key">Member ID</div><div class="value">${invoice.customerMemberId || invoice.booking.memberId || '-'}</div></div>
          </div>
          <div class="col boxed">
            <div class="label">BOOKING</div>
            <div class="kv"><div class="key">Date</div><div class="value">${bookingDate}</div></div>
            <div class="kv"><div class="key">Time</div><div class="value">${timeRange}</div></div>
            <div class="kv"><div class="key">Duration</div><div class="value">${invoice.booking.durationHours ?? '-'} Hours</div></div>
            <div class="kv"><div class="key">Payment Method</div><div class="value">${invoice.payment.paymentMethod || invoice.payment.provider || '-'}</div></div>
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
          <div><strong>Transaction ID:</strong> ${invoice.payment.transactionId || '-'}</div>
          <div><strong>Order ID:</strong> ${invoice.payment.midtransOrderId || '-'}</div>
          <div><strong>Invoice No:</strong> ${invoice.invoiceNumber}</div>
          <div><strong>Paid:</strong> ${paidDate}</div>
        </div>
      </div>

      <div class="footer">
        <div>Thanks for playing with KIM ⚽</div>
        <div style="margin-top:2px;">@kim.soccerfield • klaten-international-minisoccer.vercel.app</div>
      </div>
      <img class="footer-img" src="assets/invoice/footer.png" alt="footer" />
    </div>
  </body>
  </html>
  `;
}
