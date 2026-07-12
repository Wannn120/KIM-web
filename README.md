This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# KIM-web

## Payment gateway bypass (local / testing)

This project supports bypassing the external payment gateway for development or testing so bookings can be created and immediately confirmed without using Midtrans or another provider.

Environment variables:

- `SKIP_PAYMENT_GATEWAY` (recommended for testing): when set to `true`, the server will create an offline payment transaction with status `success` and set the associated booking to `confirmed` automatically.
- `MIDTRANS_IS_PRODUCTION`: if set to `false` the code will also treat the environment as non-production and allow offline payments. Keep this `true` in real production deployments.

Example `.env.local` snippet for local testing:

```env
SKIP_PAYMENT_GATEWAY=true
MIDTRANS_IS_PRODUCTION=false
```

Security note: never commit your `.env.local` to source control. Only enable `SKIP_PAYMENT_GATEWAY` in trusted development or testing environments.
