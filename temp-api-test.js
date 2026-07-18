const base = 'http://localhost:3000';
let cookieJar = [];

function setCookies(headers) {
  const setCookie = headers.get('set-cookie');
  if (!setCookie) return;
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
  cookies.forEach((cookie) => {
    const [pair] = cookie.split(';');
    const [name, ...rest] = pair.split('=');
    const value = rest.join('=');
    const existing = cookieJar.find((c) => c.name === name);
    if (existing) existing.value = value;
    else cookieJar.push({ name, value });
  });
}

function cookieHeader() {
  return cookieJar.map((c) => `${c.name}=${c.value}`).join('; ');
}

async function request(url, options = {}) {
  options.headers = options.headers || {};
  if (cookieJar.length) {
    options.headers.cookie = cookieHeader();
  }
  const res = await fetch(url, { ...options, redirect: 'manual' });
  setCookies(res.headers);
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, headers: res.headers, body };
}

async function main() {
  console.log('Testing local server...');
  const csrf = await request(`${base}/api/security/csrf`, { method: 'GET' });
  console.log('CSRF', csrf.status, csrf.body);

  const timestamp = Date.now();
  const email = `test+${timestamp}@minisoccer.local`;
  const username = `testuser${timestamp}`;
  const phone = `+628${(timestamp % 1000000000).toString().padStart(9, "0")}`;

  const register = await request(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      name: 'Test User',
      phone,
      email,
      password: 'Test1234!',
      csrfToken: csrf.body?.data?.csrfToken ?? '',
    }),
  });
  console.log('REGISTER', register.status, register.body);
  console.log('Cookies after register', cookieJar);

  const authMeAfterRegister = await request(`${base}/api/auth/me`, { method: 'GET' });
  console.log('AUTH ME AFTER REGISTER', authMeAfterRegister.status, authMeAfterRegister.body);

  const fields = await request(`${base}/api/fields`, { method: 'GET' });
  console.log('FIELDS', fields.status, fields.body?.data?.length);
  if (!fields.body?.data || fields.body.data.length === 0) {
    console.error('No fields found');
    process.exit(1);
  }
  const field = fields.body.data[0];
  console.log('FIELD', field.id, field.name);

  const schedules = await request(`${base}/api/fields/${field.id}/availability?date=2026-07-19`, { method: 'GET' });
  console.log('SCHEDULES', schedules.status, schedules.body);

  const avail = schedules.body?.schedules?.find((s) => s.isAvailable);
  if (!avail) {
    console.error('No available schedule found');
    process.exit(1);
  }

  const validate = await request(`${base}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fieldId: field.id,
      bookingDate: '2026-07-19',
      startTime: avail.startTime,
      endTime: avail.endTime,
      validateOnly: true,
    }),
  });
  console.log('VALIDATE', validate.status, validate.body);

  const createBooking = await request(`${base}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fieldId: field.id,
      bookingDate: '2026-07-19',
      startTime: avail.startTime,
      endTime: avail.endTime,
      customerName: 'Test User',
      customerPhone: phone,
      customerEmail: email,
    }),
  });
  console.log('CREATE BOOKING', createBooking.status, createBooking.body);

  const history = await request(`${base}/api/bookings`, { method: 'GET' });
  console.log('HISTORY', history.status, history.body);
}

main().catch((error) => { console.error(error); process.exit(1); });