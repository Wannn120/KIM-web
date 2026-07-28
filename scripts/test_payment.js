(async () => {
  try {
    const payload = {
      bookingId: 'abd0706d-8106-47f9-87ec-2bae9d354033',
      amount: 150000,
      paymentMethod: 'Midtrans',
      customerName: 'Automated Node Test',
      email: 'test.node@example.com',
      phone: '081234567903',
    };

    const res = await fetch('https://klaten-international-minisoccer.vercel.app/api/payments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    console.log('STATUS', res.status);
    console.log(JSON.stringify(json, null, 2));
  } catch (e) {
    console.error('ERROR', e);
    process.exit(1);
  }
})();
