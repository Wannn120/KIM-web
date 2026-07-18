# 🚀 PANDUAN SETUP DATABASE DI SUPABASE

## Step 1: Buka Supabase SQL Editor

1. Masuk ke dashboard Supabase: https://supabase.com/dashboard
2. Pilih project Anda
3. Klik **SQL Editor** di sidebar kiri
4. Klik **New Query**

## Step 2: Copy SQL Setup

1. Buka file: `prisma/complete-database-setup.sql`
2. Copy SELURUH isi file SQL
3. Paste ke Supabase SQL Editor
4. Klik **Run** (atau tekan Ctrl+Enter)

Tunggu hingga selesai ✅

## Step 3: Verifikasi Tabel

Di SQL Editor, jalankan query ini untuk verifikasi:

```sql
-- Lihat semua tabel
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Seharusnya muncul 10 tabel:
- AdminSetting
- AuditLog
- Booking
- Field
- FieldSchedule
- Invoice
- Payment
- Review
- User
- (mungkin _prisma_migrations jika pakai Prisma)

## Step 4: Cek Data Mock

Jalankan beberapa query untuk cek data:

```sql
-- Lihat semua users
SELECT * FROM "User";

-- Lihat semua lapangan
SELECT * FROM "Field";

-- Lihat semua booking dengan details
SELECT 
  b.id, 
  b."customerName",
  f.name as "fieldName",
  b."bookingDate",
  b.status,
  p.status as "paymentStatus"
FROM "Booking" b
JOIN "Field" f ON b."fieldId" = f.id
LEFT JOIN "Payment" p ON b.id = p."bookingId";

-- Lihat reviews dengan rating
SELECT 
  r.rating,
  r.comment,
  u.name as "userName",
  f.name as "fieldName"
FROM "Review" r
JOIN "User" u ON r."userId" = u.id
JOIN "Field" f ON r."fieldId" = f.id;
```

## Step 5: Setup Environment Variables

Di file `.env.local` atau `.env.production`:

```
DATABASE_URL="postgresql://[user]:[password]@[host]:5432/[database]?schema=public"
DIRECT_URL="postgresql://[user]:[password]@[host]:6543/[database]?schema=public"
```

Dapatkan dari Supabase:
1. Database > Connection Pooling > Connection String
2. Copy untuk Node.js dan ganti password

## Step 6: Generate Prisma Client

```bash
npx prisma generate
```

## Step 7: Verify dengan Prisma Studio

```bash
npx prisma studio
```

Ini akan membuka browser dengan GUI untuk explore database.

---

## 📱 TESTING APLIKASI

Setelah database siap, test fitur-fitur ini:

### 1. Test Register & Login
- Buka http://localhost:3000/register
- Isi form dengan data baru
- Harus muncul di table `User`

### 2. Test Booking
- Buka http://localhost:3000/book
- Pilih lapangan, tanggal, jam
- Create booking → Harus muncul di table `Booking`

### 3. Test Payment
- Dari booking, lanjut ke checkout
- Pilih payment method
- Simulasi payment → Harus muncul di table `Payment`

### 4. Test Review
- Buka lapangan yang sudah di-booking
- Tambah review → Harus muncul di table `Review`

### 5. Test Admin Dashboard
- Buka http://localhost:3000/admin
- Verifikasi semua data ditampilkan dengan benar

---

## 🔧 TROUBLESHOOTING

### Error: "connection timeout"
```
→ Pastikan DATABASE_URL & DIRECT_URL benar
→ Check IP whitelist di Supabase Project Settings > Database
```

### Error: "relation does not exist"
```
→ Jalankan SQL setup lagi
→ Pastikan semua query run tanpa error
```

### Data kosong
```
→ Check apakah INSERT statements di SQL berjalan
→ Refresh SQL Editor dan jalankan SELECT query lagi
```

### Prisma migration error
```bash
→ Reset database: npx prisma migrate reset
→ Jalankan SQL setup lagi
```

---

## 📊 QUERY BERGUNA UNTUK TESTING

### Testing Booking dengan Payment
```sql
-- Cek booking dan payment status
SELECT 
  b.id,
  b."customerName",
  b.status,
  p.status as "paymentStatus",
  p.amount
FROM "Booking" b
LEFT JOIN "Payment" p ON b.id = p."bookingId"
ORDER BY b."createdAt" DESC
LIMIT 5;
```

### Testing Invoice Generation
```sql
-- Cek invoice
SELECT 
  i."invoiceNumber",
  u.name,
  i.total,
  i.status,
  i."paidAt"
FROM "Invoice" i
JOIN "User" u ON i."userId" = u.id
ORDER BY i."createdAt" DESC;
```

### Testing Audit Log
```sql
-- Cek audit trail
SELECT 
  a.action,
  a.entity,
  u.name,
  a."createdAt"
FROM "AuditLog" a
JOIN "User" u ON a."userId" = u.id
ORDER BY a."createdAt" DESC
LIMIT 10;
```

### Testing Field Availability
```sql
-- Cek jadwal lapangan
SELECT 
  f.name,
  fs.date,
  fs."startTime",
  fs."endTime",
  fs."isAvailable"
FROM "FieldSchedule" fs
JOIN "Field" f ON fs."fieldId" = f.id
WHERE fs.date >= CURRENT_DATE
ORDER BY fs.date, fs."startTime";
```

---

## 🎯 NEXT STEPS

1. ✅ Database tables created
2. ✅ Mock data inserted
3. ⏳ **Update API routes** untuk connect ke database
4. ⏳ **Update UI components** untuk fetch real data
5. ⏳ **Setup payment gateway** (Midtrans/Xendit)
6. ⏳ **Create admin pages** untuk management
7. ⏳ **Setup email notifications**

---

## 📚 DOKUMENTASI

- Prisma Docs: https://www.prisma.io/docs/
- Supabase SQL: https://supabase.com/docs/guides/database/overview
- PostgreSQL: https://www.postgresql.org/docs/

**Database siap! 🎉 Sekarang lanjutkan dengan membuat API routes dan update UI components untuk menggunakan data dari database.**
