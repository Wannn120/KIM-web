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

4. Set the `DATABASE_URL` environment variable:
   - Locally: create `.env.local` with:

```bash
DATABASE_URL="postgresql://postgres.gaoqisykccpipessewis:YOUR_ENCODED_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=no-verify"

5. Initialize and run Prisma migrations (once `DATABASE_URL` is set):

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
2. Copy the cloud name, API key, and secret into the environment variables.
3. Use signed uploads for image handling.

## 4. Email (Resend)
1. Create a Resend account.
2. Add RESEND_API_KEY and RESEND_FROM_EMAIL.
3. Use the email notification service for order confirmations and reminders.

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
