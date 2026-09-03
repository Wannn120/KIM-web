// RESEND_FROM_EMAIL is optional in CI (emails can be disabled in some envs)
const required = [
  'DATABASE_URL',
  'DIRECT_URL',
  'RESEND_API_KEY',
  'MIDTRANS_SERVER_KEY',
  'MIDTRANS_CLIENT_KEY'
];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.error('Missing required env vars:', missing.join(', '));
  process.exit(2);
}
console.log('All required env vars present');
process.exit(0);
