# SYSTEM.md — Klaten Minisoccer

## 1. Arsitektur sistem
- `Next.js 15.5.20` App Router. SSR default. Client hanya interaktif.
- `app/page.tsx` publik. `app/book`, `app/fields`, `app/booking-history`, `app/checkout`, `app/payment/*` tamu.
- `app/staff`, `app/manager`, `app/superadmin` panel role. Guard `middleware.ts` + `lib/admin-auth.ts`.
- `app/api/*` JSON. `app/api/admin/*` butuh cookie `admin-session`.
- `middleware.ts` rate-limit + JWT decode + redirect login per role.
- `lib/security-headers.ts` CSP, HSTS, `applySecurityHeaders`.
- DB `Supabase Postgres`. ORM `Prisma 4.16.2`. Client tunggal `lib/prisma.ts`.
- Payment `Midtrans` Snap. `lib/midtrans.ts`, `lib/payment-service.ts`, `lib/payment-provider.ts`.
- Invoice PDF `INVOICE_PDF_ENGINE=classic`. `lib/invoice-html-pdf.ts` Puppeteer + `@sparticuz/chromium`. Fallback `lib/invoice-pdf.ts`.
- Media `Cloudinary`. Upload `/api/cloudinary/upload-file`. `lib/cloudinary.ts`.
- Email `Resend`. `lib/notifications.ts`.
- Cron `vercel.json` `/api/cron/expire-pending` `0 0 * * *`.
- Build `prisma generate && next build`. `next.config.ts` `serverExternalPackages: [puppeteer puppeteer-core @sparticuz/chromium]`.

```
Browser → middleware.ts → app/* → lib/* → Prisma → Supabase
Browser → app/api/* → lib/payment-service → Midtrans webhook → DB
Admin → /staff|/manager|/superadmin/login → cookie admin-session → /api/admin/*
```

## 2. Arsitektur database
Single-venue. Tanpa `Field`, `TimeSlot`, `ScheduleBlock`. Slot dari `ScheduleSlot` + `Booking`.

- `Booking` `booking`: tamu, tanggal, jam, harga, status.
  `pending|confirmed|completed|rescheduled` blokir slot. `expired|cancelled|refunded` bisa reclaim.
  Partial unique index di migrasi SQL cegah double-book aktif.
- `Payment` `payment`: `bookingId → Booking`, `transactionId unique`, `midtransOrderId unique`, `snapToken`, `snapUrl`, `amount`, `status pending|success|failed|expired|cancelled|refunded`.
- `Invoice` `invoice`: `bookingId unique`, `paymentId unique`, `invoiceNumber unique`, `subtotal tax discount total`, `status issued|paid|cancelled|refunded`.
- `Review` `review`: `bookingId? → Booking`, `customerName rating comment`.
- `ScheduleSlot` `schedule_slot`: `startTime endTime isActive sortOrder`. Master jam operasional.
- `AdminUser` `admin_user`: `name email unique passwordHash role super_admin|manager|staff isActive lastLoginAt`.
- `AdminSession` `admin_session`: `adminUserId → AdminUser`, `tokenHash unique expiresAt`.
- `AdminSetting` `admin_setting`: `key unique value description`. Hero, konten.
- `VenueFeature` `venue_feature`: `name description imageUrl imagePublicId sortOrder isActive`.
- `VenueGallery` `venue_gallery`: `title imageUrl imagePublicId sortOrder isActive`.
- `AuditLog` `audit_log`: `action entity entityId changes ipAddress referenceEmail`.
- `WebhookEvent` `webhook_event`: `eventHash unique orderId eventType payload processed processedAt`. Idempotensi webhook.

Relasi:
`Booking 1—* Payment`, `Booking 1—1 Invoice`, `Payment 1—1 Invoice`, `Booking 1—* Review`, `AdminUser 1—* AdminSession`.

Sumber: `prisma/schema.prisma`. Seed: `prisma/seed.js`.

## 3. Design UI
- Token `app/globals.css`: `--background --foreground --surface --muted --border-strong --accent`, `--space-section --text-display --text-h1 --text-h2`.
- Light default `#eff4fb/#111827`. Dark `[data-theme=dark]` hitam. Toggle `components/theme-toggle.tsx`.
- Aturan: `foreground` teks, `muted` sekunder, `rounded-2xl`, container `px-4 py-12`, heading `text-xs tracking-[0.2em]` + `text-balance leading-tight`.
- Larangan: `text-white` langsung, `rounded-[3rem]`, `tracking-[0.3em]`, `px-6 py-16` sembarang.
- Semantik: `header main#main-content footer nav section`, satu `h1` per page. Skip link `app/layout.tsx`.
- Komponen: `site-header.tsx`, `site-footer.tsx`, `hero-section.tsx`, `section-heading.tsx`, `field-card.tsx`, `booking-form.tsx`, `time-slot-selector.tsx`, `venue-feature-manager.tsx`, `venue-gallery-manager.tsx`, `admin-dashboard.tsx`, `admin-resource-manager.tsx`, `financial-report.tsx`.
- SEO: `lib/site-config.ts` URL `https://klatenminisoccer.id`, `layout.tsx` metadataBase OpenGraph Twitter, per-page metadata + canonical, `app/robots.ts`, `app/sitemap.ts`, JSON-LD SportsActivityLocation `app/page.tsx`.
- Font sistem saja. `ponytail:` tanpa webfont cegah CLS.

## 4. Env
Template: `.env.example`. Jangan commit `.env`, `.env.local`.

Wajib:
`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `RESEND_API_KEY`.

Publik:
`NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `MIDTRANS_CLIENT_KEY`, `RESEND_FROM_EMAIL`.

Server:
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SIGNING_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `CLOUDINARY_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `MIDTRANS_IS_PRODUCTION`, `COOKIE_SECURE=true`.

Opsional:
`INVOICE_PDF_ENGINE=classic|legacy`, `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

Validasi: `scripts/check-env.js`, `npm run ci:check-env`. CI: `.github/workflows/ci.yml`, `ci-cd.yml`, `prisma-deploy.yml`.

## 5. Alur sistem
### Booking tamu
1. `app/book/page.tsx` + `booking-form.tsx` pilih tanggal + `ScheduleSlot`.
2. Cek bentrok `lib/booking-engine.ts` `isBookingSlotBlocked`. Status blokir tolak.
3. `POST /api/bookings` buat `Booking pending`.
4. `app/checkout/page.tsx` ringkasan. `createPaymentTransaction` buat `Payment pending` + Snap token.
5. Redirect Snap / `booking-payment-embed.tsx`. Bayar di Midtrans.
6. Webhook `POST /api/payments/webhook` cek `WebhookEvent eventHash`, update `Payment success`, `Booking confirmed`, buat `Invoice issued`, kirim Resend.
7. `app/payment/success|failure/page.tsx` hasil. `app/booking-history/page.tsx` riwayat. `GET /api/invoices/download` PDF classic, header `X-PDF-Engine`.

### Expire
Cron `/api/cron/expire-pending` tiap malam. `expireStalePendingBookings` tandai `expired`. `reclaimExpiredSlotBookings` hapus reclaimable. Slot bebas lagi.

### Admin
1. Login `/staff/login|/manager/login|/superadmin/login` → `POST /api/admin/login` verifikasi SHA256 `passwordHash`, set cookie `admin-session` JWT 8 jam.
2. `middleware.ts` verifikasi cookie tiap `/staff|/manager|/superadmin/*` + `/api/admin/*`.
3. Role `lib/admin-auth.ts`: `staff` operasional, `manager` laporan + verifikasi, `super_admin` penuh + `canManageAdmins`.
4. CRUD: bookings, payments verify, invoices download, fields konten, `VenueFeature`, `VenueGallery`, reviews, schedule-slots, settings, users + password min6.
5. Semua aksi tulis `AuditLog`.

### Konten venue
`AdminSetting` hero text/image via `admin-content-editor.tsx`. `VenueFeature` + `VenueGallery` via manager masing-masing. Upload Cloudinary simpan `imageUrl imagePublicId`. Publik baca `lib/site-content.ts`, `lib/data.ts`, `lib/venue.ts`.
