# Analisis Database dan Implementasi Lengkap - Minisoccer Web App

## 📋 Ringkasan Keseluruhan

Database telah didesain untuk mendukung seluruh fitur aplikasi booking lapangan minisoccer dengan user management yang lengkap, payment gateway integration, dan admin dashboard. Total **10 tabel utama** dengan hubungan relasi yang comprehensive.

---

## 🗄️ STRUKTUR DATABASE LENGKAP

### 1. **TABEL USER** 
#### Kegunaan: Manajemen User Account & Authentication

```
Kolom:
- id (UUID) - Primary Key
- username (VARCHAR 50, UNIQUE) - Username untuk login
- email (VARCHAR 100, UNIQUE) - Email untuk notifikasi & login
- passwordHash (VARCHAR 255) - Password yang di-hash dengan bcrypt
- name (VARCHAR 100) - Nama lengkap user
- phone (VARCHAR 15, UNIQUE) - Nomor WhatsApp untuk booking & konfirmasi
- avatar (VARCHAR 500) - URL ke foto profil user
- profileStatus (VARCHAR 20) - 'incomplete' atau 'complete' (untuk onboarding)
- createdAt, updatedAt - Timestamps

Index: email, username
```

**Digunakan untuk**: Sign Up, Login, Edit Profil User, WhatsApp Notifications

---

### 2. **TABEL FIELD** 
#### Kegunaan: Data Lapangan Futsal

```
Kolom:
- id (UUID) - Primary Key
- name (VARCHAR 100) - Nama lapangan (Lapangan Kencana, Lapangan Jaya, dll)
- location (VARCHAR 200) - Lokasi / Alamat lapangan
- description (TEXT) - Deskripsi lapangan
- price (INT) - Harga per jam dalam IDR
- type (VARCHAR 50) - Jenis (5-aside, 7-aside, futsal)
- size (VARCHAR 20) - Ukuran (Small, Medium, Large)
- capacity (INT) - Kapasitas pemain
- rating (FLOAT) - Rating dari customer (1-5)
- imageUrl (VARCHAR 500) - Foto lapangan
- isActive (BOOLEAN) - Aktif atau tidak (untuk soft delete)
- createdAt, updatedAt - Timestamps

Index: name, isActive
```

**Digunakan untuk**: Homepage (menampilkan lapangan), Booking Page, Field Management di Admin Dashboard

---

### 3. **TABEL FIELDSCHEDULE** 
#### Kegunaan: Ketersediaan Lapangan per Slot Waktu

```
Kolom:
- id (UUID) - Primary Key
- fieldId (FK) - Referensi ke Field
- date (DATE) - Tanggal ketersediaan
- startTime (VARCHAR 5) - Jam mulai format HH:mm
- endTime (VARCHAR 5) - Jam berakhir format HH:mm
- isAvailable (BOOLEAN) - Apakah slot tersedia atau sudah dipesan
- createdAt, updatedAt - Timestamps

Unique Constraint: (fieldId, date, startTime)
Index: fieldId, date
```

**Digunakan untuk**: Availability Calendar di Booking Page, Auto-update saat booking dibuat

---

### 4. **TABEL BOOKING** 
#### Kegunaan: Mencatat Setiap Pemesanan Lapangan

```
Kolom:
- id (UUID) - Primary Key
- userId (FK) - Referensi ke User yang melakukan booking
- fieldId (FK) - Referensi ke Field yang di-booking
- bookingDate (DATE) - Tanggal lapangan akan digunakan
- startTime (VARCHAR 5) - Jam mulai HH:mm
- endTime (VARCHAR 5) - Jam berakhir HH:mm
- durationHours (INT) - Durasi dalam jam (untuk kalkulasi harga)
- totalPrice (INT) - Total harga IDR
- customerName (VARCHAR 100) - Nama penyewa (mungkin berbeda dengan User)
- customerPhone (VARCHAR 15) - Nomor yang bisa dihubungi
- customerEmail (VARCHAR 100) - Email untuk konfirmasi
- status (VARCHAR 20) - pending, confirmed, active, completed, cancelled
- notes (TEXT) - Catatan khusus dari customer
- createdAt, updatedAt - Timestamps

Index: userId, fieldId, status, bookingDate
```

**Digunakan untuk**: 
- Booking Page (create booking)
- Booking History Page (menampilkan history)
- Admin Dashboard (lihat semua booking)
- Invoice Generation

---

### 5. **TABEL PAYMENT** 
#### Kegunaan: Mencatat Semua Transaksi Pembayaran

```
Kolom:
- id (UUID) - Primary Key
- bookingId (FK, UNIQUE) - Referensi ke Booking (1 booking = 1 payment utama)
- userId (FK) - Referensi ke User yang membayar
- transactionId (VARCHAR 100, UNIQUE) - ID dari payment gateway
- amount (INT) - Nominal pembayaran IDR
- paymentMethod (VARCHAR 50) - Bank Transfer, E-Wallet (GoPay, Dana, OVO)
- provider (VARCHAR 50) - Detail provider (BCA, BNI, Mandiri, GoPay, Dana, OVO)
- status (VARCHAR 20) - pending, success, failed, cancelled, refunded
- proofImageUrl (VARCHAR 500) - URL foto bukti pembayaran (untuk verifikasi)
- proofFileName (VARCHAR 200) - Nama file bukti pembayaran
- paidAt (TIMESTAMP) - Waktu pembayaran berhasil
- expiredAt (TIMESTAMP) - Waktu expired untuk pending payments
- createdAt, updatedAt - Timestamps

Index: bookingId, userId, transactionId, status
```

**Digunakan untuk**:
- Checkout Page (proses pembayaran)
- Payment Gateway Integration (Midtrans, Xendit, dll)
- Payment Status Tracking
- Financial Reports di Admin Dashboard

---

### 6. **TABEL INVOICE** 
#### Kegunaan: Dokumentasi Keuangan & Receipt

```
Kolom:
- id (UUID) - Primary Key
- invoiceNumber (VARCHAR 50, UNIQUE) - Nomor invoice (INV-2024-001)
- bookingId (FK, UNIQUE) - Referensi ke Booking
- userId (FK) - Referensi ke User
- paymentId (FK, UNIQUE) - Referensi ke Payment
- subtotal (INT) - Harga sebelum pajak
- tax (INT) - Jumlah pajak
- discount (INT) - Jumlah diskon
- total (INT) - Total akhir
- status (VARCHAR 20) - issued, paid, cancelled
- issuedAt (TIMESTAMP) - Kapan invoice dibuat
- paidAt (TIMESTAMP) - Kapan invoice dibayar
- createdAt, updatedAt - Timestamps

Index: userId, invoiceNumber, status
```

**Digunakan untuk**:
- Invoice Download (PDF)
- Financial Reporting
- Accounting & Bookkeeping
- Tax Purposes

---

### 7. **TABEL REVIEW** 
#### Kegunaan: Rating & Review dari Customer

```
Kolom:
- id (UUID) - Primary Key
- userId (FK) - User yang memberi review
- fieldId (FK) - Lapangan yang di-review
- bookingId (FK, NULLABLE) - Booking terkait (jika ada)
- rating (INT) - Rating 1-5 bintang (CHECK: 1-5)
- comment (TEXT) - Komentar dari customer
- createdAt, updatedAt - Timestamps

Unique Constraint: (userId, fieldId) - Satu user hanya bisa review 1x per lapangan
Index: fieldId, userId, rating
```

**Digunakan untuk**:
- Homepage Review Section (tampilkan top reviews)
- Field Detail Page (rating & reviews)
- Admin Dashboard (monitoring reviews)

---

### 8. **TABEL AUDITLOG** 
#### Kegunaan: Tracking & Security Audit

```
Kolom:
- id (UUID) - Primary Key
- userId (FK) - User yang melakukan action
- action (VARCHAR 50) - register, login, booking_created, payment_made, profile_updated
- entity (VARCHAR 50) - User, Booking, Payment, Review, dll
- entityId (VARCHAR 100) - ID dari entity yang diakses
- changes (TEXT) - JSON string berisi perubahan yang terjadi
- ipAddress (VARCHAR 45) - IP address user
- userAgent (TEXT) - Browser/Device info
- createdAt (TIMESTAMP) - Waktu action

Index: userId, createdAt, action
```

**Digunakan untuk**:
- Admin Dashboard Audit Trail
- Security & Fraud Detection
- User Activity Tracking
- Compliance & Legal

---

### 9. **TABEL ADMINSETTING** 
#### Kegunaan: Konfigurasi Aplikasi

```
Kolom:
- id (UUID) - Primary Key
- key (VARCHAR 100, UNIQUE) - Nama setting
- value (TEXT) - Nilai setting
- description (TEXT) - Deskripsi setting
- createdAt, updatedAt - Timestamps

Contoh Settings:
- platform_name: 'Klaten International Minisoccer'
- booking_cancellation_hours: '24'
- max_daily_bookings_per_field: '15'
- tax_percentage: '10'
- enable_online_payment: 'true'
```

**Digunakan untuk**: Admin Dashboard Settings Page

---

## 📝 ANALISIS FITUR PER HALAMAN

### 🏠 **HALAMAN: HOME PAGE**
**Data yang Ditampilkan:**
- List lapangan dari tabel `Field` (top 5 active fields)
- Rating lapangan dari aggregate `Review` (AVG rating)
- Recent reviews dari tabel `Review` (latest 5)

**Query:**
```sql
SELECT f.*, AVG(r.rating) as avgRating
FROM "Field" f
LEFT JOIN "Review" r ON f.id = r."fieldId"
WHERE f."isActive" = true
GROUP BY f.id
ORDER BY avgRating DESC
LIMIT 5
```

---

### 📅 **HALAMAN: BOOKING PAGE**
**Data yang Dibutuhkan:**
- List semua lapangan dari `Field`
- Ketersediaan dari `FieldSchedule`
- Harga per jam dari `Field`

**Actions:**
1. User memilih Field → Query `FieldSchedule` untuk availability
2. User memilih tanggal & jam → Check `FieldSchedule.isAvailable`
3. User submit booking → Create record di `Booking` + Create record di `Payment` (status: pending)
4. Update `FieldSchedule.isAvailable = false` untuk jam tersebut

**Code yang Dibutuhkan:**
- `GET /api/fields` - List semua lapangan
- `GET /api/fields/:fieldId/availability?date=2024-07-18` - Cek ketersediaan
- `POST /api/bookings` - Create booking
- `PATCH /api/bookings/:bookingId` - Update booking status

---

### 💳 **HALAMAN: CHECKOUT PAGE**
**Data yang Dibutuhkan:**
- Booking details dari `Booking`
- Kalkulasi total harga
- Payment methods options

**Actions:**
1. Tampilkan booking details + total price
2. User pilih payment method (Bank Transfer / E-Wallet)
3. POST ke payment gateway (Midtrans/Xendit)
4. Terima webhook payment status
5. Update `Payment.status` + `Booking.status`
6. Generate Invoice ke `Invoice` table

**Code yang Dibutuhkan:**
- `GET /api/bookings/:bookingId` - Get booking details
- `POST /api/payments/create` - Create payment transaction
- `POST /api/payments/webhook` - Handle payment callback
- `POST /api/invoices` - Generate invoice

---

### 📜 **HALAMAN: BOOKING HISTORY PAGE**
**Data yang Dibutuhkan:**
- Semua booking user dari `Booking` dengan filter `userId`
- Payment status dari tabel `Payment`
- Invoice dari tabel `Invoice`

**Query:**
```sql
SELECT b.*, p.status as "paymentStatus", i."invoiceNumber"
FROM "Booking" b
LEFT JOIN "Payment" p ON b.id = p."bookingId"
LEFT JOIN "Invoice" i ON b.id = i."bookingId"
WHERE b."userId" = $1
ORDER BY b."createdAt" DESC
```

**Features:**
- Filter by status (pending, completed, cancelled)
- Download invoice (PDF)
- Cancel booking (jika belum pembayaran atau > 24 jam)

**Code yang Dibutuhkan:**
- `GET /api/bookings?userId=xxx` - Get user bookings
- `DELETE /api/bookings/:bookingId` - Cancel booking
- `GET /api/invoices/:invoiceId/download` - Download PDF

---

### 👤 **HALAMAN: PROFILE PAGE**
**Data yang Dibutuhkan:**
- User info dari `User`
- Booking statistics (total bookings, completed, cancelled)
- Recent bookings

**Actions:**
1. Display user info (name, email, phone, avatar)
2. Edit profile → UPDATE `User` table
3. Upload avatar → Update `User.avatar` URL
4. Show profile completion status

**Code yang Dibutuhkan:**
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/profile` - Update profile
- `POST /api/uploads/avatar` - Upload avatar
- `GET /api/users/:userId/statistics` - Get stats

---

### 🔐 **HALAMAN: LOGIN & REGISTER**
**Tabel yang Digunakan:** `User`

**Login:**
1. User submit email + password
2. Query `User` dengan email
3. Verifikasi password dengan bcrypt
4. Generate JWT token
5. Set cookie `auth-token`

**Register:**
1. User submit username, email, password, name, phone
2. Validasi uniqueness (username, email, phone)
3. Hash password dengan bcrypt
4. CREATE `User` record
5. Generate JWT token

**Code yang Dibutuhkan:**
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout (clear cookie)
- `GET /api/auth/me` - Get current user

---

### 📊 **HALAMAN: ADMIN DASHBOARD**

#### **Dashboard Overview:**
Dari tabel: `Booking`, `Payment`, `Review`
```sql
SELECT
  COUNT(DISTINCT b.id) as total_bookings,
  COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_bookings,
  SUM(p.amount) as total_revenue,
  AVG(r.rating) as avg_rating
FROM "Booking" b
LEFT JOIN "Payment" p ON b.id = p."bookingId"
LEFT JOIN "Review" r ON b."fieldId" = r."fieldId"
WHERE p.status = 'success'
```

#### **Booking Management:**
- List semua booking dari `Booking`
- Filter by status, date range
- Update booking status
- Cancel/Refund booking

#### **Payment Management:**
- List semua payment dari `Payment`
- Track payment status
- Verify proof of payment (`Payment.proofImageUrl`)
- Generate refunds

#### **Financial Reports:**
- Revenue by date/month dari `Invoice` dan `Payment`
- Outstanding payments (status: pending)
- Refund records

#### **User Management:**
- List users dari `User`
- View user activity dari `AuditLog`
- Ban/Block user

#### **Field Management:**
- CRUD fields di `Field`
- Manage field schedules di `FieldSchedule`
- View field ratings dari `Review`

#### **Audit Logs:**
- Display audit trail dari `AuditLog`
- Filter by action, user, date

#### **Settings:**
- Manage `AdminSetting` values

**Code yang Dibutuhkan:**
- `GET /api/admin/dashboard` - Dashboard metrics
- `GET /api/admin/bookings` - List bookings (admin)
- `GET /api/admin/payments` - List payments
- `GET /api/admin/users` - List users
- `GET /api/admin/fields` - List fields
- `GET /api/admin/audit-logs` - Audit trail
- `GET /api/admin/reports/revenue` - Financial reports
- `PATCH /api/admin/settings/:key` - Update settings

---

## 🔗 DATABASE RELATIONSHIPS

```
User (1) ──> (N) Booking
User (1) ──> (N) Payment
User (1) ──> (N) Review
User (1) ──> (N) AuditLog

Field (1) ──> (N) Booking
Field (1) ──> (N) FieldSchedule
Field (1) ──> (N) Review

Booking (1) ──> (1) Payment
Booking (1) ──> (1) Invoice
Booking (1) ──> (0-1) Review

Payment (1) ──> (1) Invoice
```

---

## 📂 STRUKTUR KODE YANG DIBUTUHKAN

### Backend APIs Required:

```
Authentication:
├── POST /api/auth/register
├── POST /api/auth/login
├── POST /api/auth/logout
├── GET /api/auth/me
└── PATCH /api/auth/profile

Booking:
├── GET /api/fields
├── GET /api/fields/:fieldId/availability
├── POST /api/bookings
├── GET /api/bookings
├── GET /api/bookings/:bookingId
├── PATCH /api/bookings/:bookingId
└── DELETE /api/bookings/:bookingId

Payment & Invoice:
├── POST /api/payments/create
├── GET /api/payments/:transactionId
├── POST /api/payments/webhook
├── GET /api/invoices/:invoiceId
└── GET /api/invoices/:invoiceId/download

Admin:
├── GET /api/admin/dashboard
├── GET /api/admin/bookings
├── GET /api/admin/payments
├── GET /api/admin/users
├── GET /api/admin/fields
├── GET /api/admin/audit-logs
├── GET /api/admin/reports/revenue
└── PATCH /api/admin/settings/:key

Reviews:
├── POST /api/reviews
├── GET /api/reviews
└── DELETE /api/reviews/:reviewId

Files:
└── POST /api/uploads/avatar
```

---

## 🚀 MIGRATION & DEPLOYMENT

### Untuk Supabase:

1. **Copy SQL dari `complete-database-setup.sql`**
2. **Buka Supabase SQL Editor**
3. **Paste dan Run SQL**
4. **Verify semua tabel sudah terbuat**

### Untuk Local Development:

```bash
# Generate Prisma Client
npx prisma generate

# Run migration
npx prisma migrate dev --name init

# Seed database
npx prisma db seed (dengan seed.js)
```

---

## 📊 MOCK DATA YANG TERSEDIA

- **5 Users** dengan berbagai profile status
- **5 Fields/Lapangan** dengan harga berbeda
- **6 Field Schedules** untuk availability
- **5 Bookings** dengan status berbeda (completed, confirmed, pending)
- **4 Payments** dengan mix status (success, pending)
- **3 Invoices** untuk paid bookings
- **4 Reviews** dengan rating 4-5 bintang
- **5 Audit Logs** untuk tracking

---

## ✅ CHECKLIST IMPLEMENTASI

- [ ] Update Prisma schema (sudah dilakukan)
- [ ] Create Supabase tables via SQL editor
- [ ] Insert mock data untuk testing
- [ ] Create auth APIs (register, login, logout, profile)
- [ ] Create booking APIs
- [ ] Create payment APIs + webhook handler
- [ ] Create invoice generation
- [ ] Create review APIs
- [ ] Create admin dashboard APIs
- [ ] Create audit logging middleware
- [ ] Update homepage dengan DB data
- [ ] Update booking page dengan real fields & availability
- [ ] Update booking history page
- [ ] Update profile page dengan user data
- [ ] Create admin dashboard pages
- [ ] Setup payment gateway (Midtrans/Xendit)
- [ ] Create file upload for avatars & proofs
- [ ] Setup email notifications
- [ ] Create PDF invoice generator

---

## 📞 KONEKSI DATA PER PAGE

### Login/Register Flow:
```
User Input → Validate → Check User table → 
Hash Password → Create User record → 
Generate Token → Return User Data
```

### Booking Flow:
```
Select Field → Check FieldSchedule availability → 
Create Booking → Create Payment (pending) → 
Update FieldSchedule (isAvailable=false) → 
Redirect to Payment
```

### Payment Flow:
```
Select Payment Method → POST to Gateway → 
Receive Webhook → Update Payment status → 
Update Booking status → Create Invoice → 
Send Notification
```

### Admin Flow:
```
Query Dashboard metrics → Query Bookings/Payments → 
Display Analytics → Filter & Export Data
```

---

**Database Design Complete! Ready for Implementation.** 🎉
