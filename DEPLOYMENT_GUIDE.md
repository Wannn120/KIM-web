# Deployment Guide

## 1. Deploy to Vercel
1. Push this repository to GitHub.
2. Import the repo into Vercel.
3. Set the environment variables from .env.example.
4. Deploy the production branch.

## 2. Database (Supabase)
1. Create a Supabase project.
2. Enable PostgreSQL.
3. Add the connection string to DATABASE_URL.
4. Run Prisma migrations once the schema is connected.

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
