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
      @page { size: A4; margin: 36px; }
      body { font-family: 'Poppins', Inter, Arial, sans-serif; color:#1b4b2b; }
      .page { width: 100%; max-width: 800px; margin: 0 auto; }
      .header { display:flex; justify-content:space-between; align-items:flex-start; }
      .brand { display:flex; gap:12px; align-items:center; }
      .brand .title { font-weight:700; font-size:18px; color:#133a2b; }
      .meta { text-align:right; }
      .meta h1 { margin:0; font-size:28px; color:#0b2b18; }
      .boxed { border:1px solid #dbeedf; border-radius:8px; padding:12px; }
      .row { display:flex; gap:16px; }
      .col { flex:1; }
      table { width:100%; border-collapse:collapse; }
      th, td { padding:10px; border-bottom:1px solid #eef7ef; }
      th { text-align:left; color:#0b2b18; font-size:12px; }
      .amount { text-align:right; }
      .grand { background:#f6fff7; border:1px solid #dfeee1; padding:16px; border-radius:8px; text-align:center; font-weight:700; }
      .footer { text-align:center; color:#3b6b4f; margin-top:40px; font-size:12px; }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="header">
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
          <div style="margin-top:6px;font-size:12px;color:#214a35">No. ${invoice.invoiceNumber}</div>
          <div style="font-size:11px;color:#4a7a5f">Date: ${issueDate}</div>
          <div style="margin-top:8px;padding:6px 10px;background:#e9f9ed;border-radius:16px;display:inline-block;color:#1b4b2b;font-weight:600">${(invoice.status||'').toString().toUpperCase()}</div>
        </div>
      </div>

      <div style="height:18px"></div>

      <div class="row">
        <div class="col boxed">
          <div style="font-weight:700;margin-bottom:6px">Customer</div>
          <div><strong>Name</strong> &nbsp; ${customerName}</div>
          <div><strong>Phone</strong> &nbsp; ${customerPhone}</div>
          <div><strong>Email</strong> &nbsp; ${customerEmail}</div>
        </div>
        <div class="col boxed">
          <div style="font-weight:700;margin-bottom:6px">Booking</div>
          <div><strong>Booking ID</strong> &nbsp; ${invoice.booking.id}</div>
          <div><strong>Date</strong> &nbsp; ${bookingDate}</div>
          <div><strong>Time</strong> &nbsp; ${timeRange}</div>
          <div><strong>Duration</strong> &nbsp; ${invoice.booking.durationHours ?? '-'} Hours</div>
          <div><strong>Payment</strong> &nbsp; ${invoice.payment.paymentMethod || invoice.payment.provider || '-'}</div>
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
              <td>1</td>
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

      <div class="footer">Thanks for playing with KIM • @kim.soccerfield • klaten-international-minisoccer.vercel.app</div>
    </div>
  </body>
  </html>
  `;
}
