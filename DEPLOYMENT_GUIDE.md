# Deployment Guide

## 1. Deploy to Vercel
1. Push this repository to GitHub.
2. Import the repo into Vercel.
3. Set the environment variables from .env.example.
4. Deploy the production branch.

## 2. Database (Supabase)
1. Create a Supabase project.
2. Enable PostgreSQL (Supabase provides this by default when creating a project).
3. Copy the connection string (URI) from Project → Settings → Database → Connection string.
   - If Supabase provides a shared pooler connection, use that instead of the direct DB host.
   - Example pooler URI format:

```
postgresql://postgres.gaoqisykccpipessewis:YOUR_ENCODED_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=no-verify
```

   - If your password contains special characters (e.g. `@`, `/`, `:`), percent-encode them.

4. Set the `DATABASE_URL` and `DIRECT_URL` environment variables:
   - Locally: create `.env.local` with:

```bash
# Connect via shared transaction-mode pooler (used by the app)
DATABASE_URL="postgresql://postgres.gaoqisykccpipessewis:YOUR_ENCODED_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=no-verify&pgbouncer=true"

# Connect via shared session-mode pooler (used for migrations)
DIRECT_URL="postgresql://postgres.gaoqisykccpipessewis:YOUR_ENCODED_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=no-verify"
```

   - In Vercel: Project → Settings → Environment Variables → Add both `DATABASE_URL` and `DIRECT_URL` (set for Preview & Production).
   - In GitHub Actions: add both `DATABASE_URL` and `DIRECT_URL` to repository Secrets (used by `.github/workflows/prisma-deploy.yml`).

5. Initialize and run Prisma migrations (once `DATABASE_URL` and `DIRECT_URL` are set):

```bash
# install prisma if not present
npm install -D prisma
npm install @prisma/client

# generate client and create local migration (development)
npx prisma generate
npx prisma migrate dev --name init

# run seed (optional)
npm run prisma:seed
```

6. Production (CI / deploy): use the provided GitHub Actions workflow `./github/workflows/prisma-deploy.yml` or run on your server:

```bash
npx prisma migrate deploy
npx prisma generate
```

7. Verify with Prisma Studio:

```bash
npx prisma studio
```

Notes:
- Do not commit `.env.local` or any secrets to the repository.
- If you prefer, I can run migrations for you — you can either add `DATABASE_URL` to GitHub Secrets and let the workflow run on merge, or provide the connection string here if you want me to run `npx prisma migrate deploy` locally for you (note: sharing secrets in chat is less secure than setting secrets in your hosting provider).

## 3. Media Storage (Cloudinary)
1. Create a Cloudinary account.
2. Set the `CLOUDINARY_URL` environment variable using the format from Cloudinary:

```bash
CLOUDINARY_URL=cloudinary://<your_api_key>:<your_api_secret>@ljbxjpox
```

3. The app automatically parses `CLOUDINARY_URL` and does not require separate `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` entries.

4. If you want, you may also provide explicit values:

```bash
CLOUDINARY_CLOUD_NAME=ljbxjpox
CLOUDINARY_API_KEY=<your_api_key>
CLOUDINARY_API_SECRET=<your_api_secret>
```

5. Use the server upload route at `/api/cloudinary/upload` to securely upload images from the backend.

## 4. Email (Resend)
1. Create a Resend account.
2. Go to the Resend dashboard and create an API key.
3. Add the key to your environment as `RESEND_API_KEY`.
4. Set `RESEND_FROM_EMAIL` to a verified sender address configured in Resend.
5. The app uses Resend for email confirmation and payment notification messages.

> Note: store `RESEND_API_KEY` only in `.env.local` or your hosting provider's secret store. Do not commit it to source control.
1. Create a Resend account.
2. Create an API key in the Resend dashboard and set it as `RESEND_API_KEY`.
3. Set `RESEND_FROM_EMAIL` to a verified sender email address in your Resend account.
4. The app sends booking confirmation and payment notification emails through Resend automatically.

> Note: Do not commit your real API key or sender email to the repository. Use `.env.local` for local development and your hosting provider's secret store for production.

## 5. Payments (Midtrans)
1. Create a Midtrans account and obtain server/client keys.
2. Set MIDTRANS_SERVER_KEY and MIDTRANS_CLIENT_KEY.
3. Configure webhook URLs in Midtrans dashboard.

## 6. CI/CD
- GitHub Actions runs npm ci and npm run build on push and PR.
- Vercel auto-deploys the main branch after the GitHub integration is enabled.

## 7. Backup and Monitoring
- Schedule daily Supabase backups and export critical booking data.
- Enable Vercel Analytics and monitoring.
- Forward application logs to Vercel/third-party observability providers.

## 8. Production Checklist
- Replace demo secrets with real values.
- Confirm HTTPS and secure cookies.
- Configure webhook signing and idempotency.
- Test booking, payment, reminder, refund, and cancellation flows.
