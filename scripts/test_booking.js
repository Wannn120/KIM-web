(async () => {
  try {
    const payload = {
      fieldId: '550e8400-e29b-41d4-a716-446655440002',
      fieldName: 'Lapangan C - Training',
      bookingDate: '2026-08-01',
      startTime: '08:00',
      endTime: '09:00',
      customerName: 'Automated Node Test',
      customerPhone: '081234567903',
      customerEmail: 'test.node@example.com',
    };

    const res = await fetch('https://klaten-international-minisoccer.vercel.app/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log('STATUS', res.status);
    console.log(text);
  } catch (e) {
    console.error('ERROR', e);
    process.exit(1);
  }
})();
