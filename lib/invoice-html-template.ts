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
      @page { size: A4; margin: 24mm 12mm; }
      body { font-family: 'PoppinsLocal', 'Poppins', Inter, Arial, sans-serif; color:#1b4b2b; background:white }
      .page { position:relative; width:210mm; margin:0 auto; padding:16mm 18mm; box-sizing:border-box; background:#fff }
      .header { display:flex; justify-content:space-between; align-items:flex-start; z-index:2; position:relative; padding-top:12px; margin-bottom:8px }
        .header img.header-img { position:absolute; left:0; top:0; width:100%; height:120px; object-fit:cover; z-index:0 }
        .header .header-inner { position:relative; z-index:2; width:100%; display:flex; justify-content:space-between; align-items:flex-start }
      .brand { display:flex; gap:12px; align-items:center; }
      .brand .title { font-weight:700; font-size:18px; color:#133a2b; }
      .meta { text-align:right; position:relative; width:320px }
      .meta h1 { margin:0; font-size:40px; color:#0b2b18; letter-spacing:0.6px; line-height:1 }
      .meta .meta-row { display:block; font-size:11px; color:#6b8b78; margin-top:6px; overflow-wrap:break-word; word-break:break-word }
      .badge-paid { position:absolute; right:0; top:18px; background:#e9f9ed; color:#1b4b2b; padding:8px 14px; border-radius:18px; font-weight:700; box-shadow:0 2px 0 rgba(27,75,43,0.08) }
      .boxed { border:1px solid #dbeedf; border-radius:8px; padding:14px 16px; background:#fff; margin-bottom:12px; overflow:hidden }
      .boxed .label { color:#3b6b4f; font-weight:700; margin-bottom:8px }
      .boxed .kv { display:flex; justify-content:space-between; margin:6px 0; align-items:center }
      .kv .key { max-width:45%; color:#3b6b4f }
      .kv .value { max-width:55%; text-align:right; word-break:break-word; overflow-wrap:break-word }
      .row { display:flex; gap:20px; flex-wrap:wrap }
      .col { flex:1; min-width:260px; box-sizing:border-box }
      table { width:100%; border-collapse:collapse; table-layout:fixed }
      th, td { padding:12px 10px; border-bottom:1px solid #eef7ef; }
      th { text-align:left; color:#0b2b18; font-size:12px; font-weight:700 }
      thead th { background:transparent }
      .amount { text-align:right; }
      .grand { background:#f6fff7; border:1px solid #dfeee1; padding:14px; border-radius:8px; text-align:center; font-weight:700; font-size:16px; margin-top:14px }
      .grand .amount { background:#e9f9ed; display:inline-block; padding:10px 18px; border-radius:8px; font-size:18px; font-weight:800; color:#0b3f24 }
      .footer { text-align:center; color:#3b6b4f; margin-top:40px; font-size:12px; z-index:2; position:relative }
      .footer img.footer-img { position:absolute; left:0; right:0; bottom:0; width:100%; height:120px; object-fit:cover; z-index:1 }
      .watermark { position:absolute; left:50%; top:45%; transform:translate(-50%,-50%); font-size:200px; color:#8fc79f; opacity:0.03; font-weight:800; z-index:0; pointer-events:none; letter-spacing:12px }
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
          <div style="width:84px;height:64px;background:#eaf6ee;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:700;color:#1b4b2b">KIM</div>
          <div>
            <div class="title">Klaten International Minisoccer</div>
            <div style="font-size:10px;color:#2d5b44">Jl. Stadion, Klaten • hello@minisoccer.id</div>
            <div style="font-size:10px;color:#2d5b44">klaten-international-minisoccer.vercel.app</div>
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

      <div style="height:18px"></div>

      <div class="content">

      <div class="row">
        <div class="col boxed">
          <div class="label">Customer</div>
          <div class="kv"><div>Name</div><div style="font-weight:600">${customerName}</div></div>
          <div class="kv"><div>Phone</div><div style="font-weight:600">${customerPhone}</div></div>
          <div class="kv"><div>Email</div><div style="font-weight:600">${customerEmail}</div></div>
        </div>
        <div class="col boxed">
          <div class="label">BOOKING</div>
          <div class="kv"><div>Date</div><div style="font-weight:600">${bookingDate}</div></div>
          <div class="kv"><div>Time</div><div style="font-weight:600">${timeRange}</div></div>
          <div class="kv"><div>Duration</div><div style="font-weight:600">${invoice.booking.durationHours ?? '-'} Hours</div></div>
          <div class="kv"><div>Payment Method</div><div style="font-weight:600">${invoice.payment.paymentMethod || invoice.payment.provider || '-'}</div></div>
        </div>
      </div>

      <div style="height:18px"></div>

      <div class="boxed">
        <div style="font-weight:700;margin-bottom:6px">Booking Summary</div>
        <table>
          <thead>
            <tr><th>DESCRIPTION</th><th style="width:64px">QTY</th><th style="width:140px">UNIT PRICE</th><th style="width:140px" class="amount">AMOUNT</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>${fieldName}</td>
              <td style="text-align:center">1</td>
              <td class="amount">${subtotal}</td>
              <td class="amount">${subtotal}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="height:12px"></div>

      <div class="row">
        <div style="flex:1"></div>
        <div style="width:300px">
          <div style="display:flex;justify-content:space-between;padding:6px 10px;border-bottom:1px solid #eef7ef"><div>Subtotal</div><div>${subtotal}</div></div>
          ${discount?`<div style="display:flex;justify-content:space-between;padding:6px 10px;border-bottom:1px solid #eef7ef"><div>Discount</div><div>- ${discount}</div></div>`:''}
          ${tax?`<div style="display:flex;justify-content:space-between;padding:6px 10px;border-bottom:1px solid #eef7ef"><div>Tax</div><div>${tax}</div></div>`:''}
          <div style="padding:12px 10px"><div class="grand">Rp. ${total.replace(/[^0-9]/g,'')}</div></div>
        </div>
      </div>

      <div style="height:18px"></div>

      <div style="font-size:12px">
        <div><strong>Transaction ID:</strong> ${invoice.payment.transactionId || '-'}</div>
        <div><strong>Order ID:</strong> ${invoice.payment.midtransOrderId || '-'}</div>
        <div><strong>Invoice No:</strong> ${invoice.invoiceNumber}</div>
        <div><strong>Paid:</strong> ${paidDate}</div>
      </div>
      </div>

      <div class="footer">Thanks for playing with KIM • @kim.soccerfield • klaten-international-minisoccer.vercel.app</div>
      <img class="footer-img" src="assets/invoice/footer.png" alt="footer" />
      <div class="decor-bottom" aria-hidden="true"></div>
    </div>
  </body>
  </html>
  `;
}
