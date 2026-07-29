const https = require('https');
const { URL } = require('url');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ res, data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

(async () => {
  try {
    const loginData = JSON.stringify({ email: 'manager1@klatenminisoccer.id', password: 'manager123' });
    const loginOptions = {
      hostname: 'klaten-international-minisoccer.vercel.app',
      port: 443,
      path: '/api/admin/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData),
      },
    };

    const login = await request(loginOptions, loginData);
    console.log('LOGIN STATUS', login.res.statusCode);
    console.log('LOGIN BODY', login.data);
    const cookies = login.res.headers['set-cookie'] || [];
    console.log('LOGIN COOKIES', cookies);
    const adminCookie = cookies.find((c) => c.startsWith('admin-session='));
    if (!adminCookie) {
      console.error('No admin-session cookie returned');
      process.exit(1);
    }
    const cookieHeader = adminCookie.split(';')[0];

    const managerOptions = {
      hostname: 'klaten-international-minisoccer.vercel.app',
      port: 443,
      path: '/manager',
      method: 'GET',
      headers: {
        Cookie: cookieHeader,
      },
    };
    const manager = await request(managerOptions);
    console.log('MANAGER STATUS', manager.res.statusCode);
    console.log('MANAGER HEADERS', JSON.stringify(manager.res.headers, null, 2));
    console.log('MANAGER BODY START', manager.data.slice(0, 2000));

    const loginRedirectOptions = {
      ...managerOptions,
      path: '/manager/login',
    };

    const managerLogin = await request(loginRedirectOptions);
    console.log('MANAGER LOGIN STATUS', managerLogin.res.statusCode);
    console.log('MANAGER LOGIN BODY START', managerLogin.data.slice(0, 2000));
  } catch (error) {
    console.error(error);
  }
})();