# Frontend-Backend Alignment Guide

Dokumen ini menjelaskan semua perubahan yang telah dilakukan untuk menyelaraskan frontend dengan database schema yang baru.

---

## 📋 Ringkasan Perubahan

### 1. **Authentication & User Management**

#### ✅ Register Form (`components/register-form.tsx`)
**Perubahan:**
- ✨ Tambahan input field untuk **username** (username adalah unique identifier)
- ✨ Validasi form meminta username, name, email, dan password
- ✨ Request body ke `/api/auth/register` sekarang include `username`

**Alur:**
```
User Input (username, name, phone, email, password)
  ↓
Form validation (semua field required)
  ↓
POST /api/auth/register
  ↓
Redirect ke /profile jika sukses
```

#### ✅ Register API (`app/api/auth/register/route.ts`)
**Perubahan:**
- ✨ Mengekstrak `username` dari request body
- ✨ Validate `username` wajib diisi
- ✨ Saat membuat user, include `username` di Prisma create
- ✨ Enhanced error handling untuk unique constraint violations:
  - Jika email sudah terdaftar → "Email already registered"
  - Jika username sudah terdaftar → "Username already taken"
  - Jika phone sudah terdaftar → "Phone number already registered"
- ✨ Response mencakup `username` di user object

**Database Fields Dipetakan:**
```
Form Input → Database (User table)
username → User.username
name → User.name
email → User.email (unique)
phone → User.phone (unique)
password → User.passwordHash (bcrypt hashed)
```

#### ✅ Login API (`app/api/auth/login/route.ts`)
**Perubahan:**
- ✨ Response mencakup `username` di user object
- Tetap menggunakan email untuk login (tidak berubah)

**Response Format:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "username": "ari_putra",
    "name": "Ari Putra",
    "email": "ari@example.com",
    "phone": "628123456789"
  }
}
```

#### ✅ Get User (Me) Endpoint (`app/api/auth/me/route.ts`)
**Perubahan:**
- ✨ Select query sekarang include `username`
- Endpoint tetap sama: `GET /api/auth/me`

**Response Format:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "username": "ari_putra",
    "name": "Ari Putra",
    "email": "ari@example.com",
    "phone": "628123456789",
    "createdAt": "2024-07-18T10:30:00Z"
  }
}
```

#### ✅ Update Profile API (`app/api/auth/profile/route.ts`)
**Perubahan:**
- ✨ PATCH select query sekarang include `username`
- Username readonly (tidak bisa diubah setelah creation)

---

### 2. **Profile Page Component**

#### ✅ Profile Page UI (`components/profile-page.tsx`)
**Perubahan:**
- ✨ Interface `UserProfile` sekarang include `id` dan `username`
- ✨ Tambahan display field untuk username (readonly dengan visual disabled)
- ✨ Username ditampilkan dengan label "Username cannot be changed after creation"
- ✨ Form tetap update name, email, phone (username hanya display)

**UI Tampilan:**
```
┌─────────────────────────────┐
│ My Profile                  │
├─────────────────────────────┤
│ Username (disabled)         │
│ [ari_putra]                 │
│ *Cannot be changed          │
│                             │
│ Full name                   │
│ [Ari Putra        ]         │
│                             │
│ Email                       │
│ [ari@example.com  ]         │
│                             │
│ WhatsApp / Phone            │
│ [628123456789     ]         │
│                             │
│ [Save profile]              │
└─────────────────────────────┘
```

---

### 3. **Fields Management**

#### ✨ NEW: Get Fields Endpoint (`app/api/fields/route.ts`)
**Fungsi:** Fetch semua lapangan aktif dari database

**Endpoint:** `GET /api/fields`

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Lapangan Kencana",
      "location": "Jl. Merdeka No. 123, Klaten",
      "description": "Lapangan futsal berkualitas dengan AC penuh",
      "price": 100000,
      "type": "5-aside",
      "size": "Medium",
      "capacity": 10,
      "rating": 4.5,
      "imageUrl": "https://...",
      "createdAt": "2024-07-18T10:30:00Z"
    }
  ]
}
```

#### ✨ NEW: Get Field Availability (`app/api/fields/[fieldId]/availability/route.ts`)
**Fungsi:** Cek ketersediaan slot waktu untuk lapangan tertentu

**Endpoint:** `GET /api/fields/[fieldId]/availability?date=2024-07-20`

**Response Format:**
```json
{
  "success": true,
  "field": {
    "id": "660e8400-...",
    "name": "Lapangan Kencana",
    "price": 100000
  },
  "schedules": [
    {
      "id": "schedule-uuid",
      "startTime": "08:00",
      "endTime": "09:00",
      "isAvailable": true
    },
    {
      "id": "schedule-uuid",
      "startTime": "09:00",
      "endTime": "10:00",
      "isAvailable": false
    }
  ]
}
```

---

### 4. **Booking System**

#### ✅ Updated: Bookings API (`app/api/bookings/route.ts`)

**POST /api/bookings - Create Booking**

**Perubahan:**
- ✨ Sekarang menggunakan database Booking table
- ✨ Memerlukan authentication (via JWT cookie)
- ✨ Input validation sesuai schema baru
- ✨ Auto-calculate duration dan total price berdasarkan field price
- ✨ Transaction: create booking + update FieldSchedule atomically
- ✨ Audit logging untuk setiap booking

**Request Format:**
```json
{
  "fieldId": "660e8400-...",
  "bookingDate": "2024-07-20",
  "startTime": "18:00",
  "endTime": "19:00",
  "customerName": "Ari Putra",
  "customerPhone": "628123456789",
  "customerEmail": "ari@example.com"
}
```

**Response Format:**
```json
{
  "success": true,
  "message": "Booking created successfully.",
  "booking": {
    "id": "770e8400-...",
    "fieldId": "660e8400-...",
    "bookingDate": "2024-07-20",
    "startTime": "18:00",
    "endTime": "19:00",
    "durationHours": 1,
    "totalPrice": 100000,
    "status": "pending",
    "createdAt": "2024-07-18T10:30:00Z"
  }
}
```

**GET /api/bookings - Get User Bookings**

**Perubahan:**
- ✨ Fetch semua booking untuk user yang authenticated
- ✨ Include field details (name, location, imageUrl)
- ✨ Order by bookingDate descending

**Response Format:**
```json
{
  "success": true,
  "bookings": [
    {
      "id": "770e8400-...",
      "userId": "550e8400-...",
      "fieldId": "660e8400-...",
      "bookingDate": "2024-07-20",
      "startTime": "18:00",
      "endTime": "19:00",
      "durationHours": 1,
      "totalPrice": 100000,
      "customerName": "Ari Putra",
      "customerPhone": "628123456789",
      "customerEmail": "ari@example.com",
      "status": "confirmed",
      "field": {
        "id": "660e8400-...",
        "name": "Lapangan Kencana",
        "location": "Jl. Merdeka No. 123",
        "imageUrl": "https://..."
      }
    }
  ]
}
```

---

### 5. **Reviews System**

#### ✅ Updated: Reviews API (`app/api/reviews/route.ts`)

**GET /api/reviews - Get All Reviews**

**Perubahan:**
- ✨ Sekarang fetch dari database Review table
- ✨ Include user name dan field name
- ✨ Order by createdAt descending
- ✨ Limit 10 reviews terbaru

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": "review-uuid",
      "userName": "Ari Putra",
      "fieldName": "Lapangan Kencana",
      "rating": 5,
      "comment": "Lapangan sangat bagus dan bersih!",
      "createdAt": "2024-07-18T10:30:00Z"
    }
  ]
}
```

**POST /api/reviews - Create Review**

**Perubahan:**
- ✨ Memerlukan authentication (via JWT)
- ✨ Input: fieldId, rating (1-5), comment
- ✨ Validasi: user hanya bisa review 1x per field (unique constraint)
- ✨ Audit logging untuk setiap review

**Request Format:**
```json
{
  "fieldId": "660e8400-...",
  "rating": 5,
  "comment": "Lapangan sangat bagus dan bersih!"
}
```

**Response Format:**
```json
{
  "success": true,
  "message": "Review created successfully.",
  "review": {
    "id": "review-uuid",
    "userName": "Ari Putra",
    "fieldName": "Lapangan Kencana",
    "rating": 5,
    "comment": "Lapangan sangat bagus dan bersih!",
    "createdAt": "2024-07-18T10:30:00Z"
  }
}
```

**Error Cases:**
- ❌ User belum authenticated → 401
- ❌ Field tidak ditemukan → 404
- ❌ User sudah review field ini → 409 Conflict
- ❌ Rating invalid (bukan 1-5) → 400

---

### 6. **Payment System**

#### ✅ Updated: Payment Service (`lib/payment-service.ts`)

**Perubahan:**
- ✨ Data creation sekarang include `userId` dari booking
- ✨ Reference field names dari Booking table yang baru:
  - `booking.customerName` bukan `booking.customer`
  - `booking.bookingDate` bukan `booking.startAt`
  - `booking.startTime` / `booking.endTime` bukan dalam timestamp
- ✨ Tetap support payment status transitions (pending → success/failed)

**Payment Creation Flow:**
```
POST /api/payments/create
  ↓
Validate booking exists
  ↓
Create Payment record di DB
  ├─ bookingId ✓
  ├─ userId ✓ (NEW)
  ├─ transactionId ✓
  ├─ paymentMethod
  ├─ provider
  ├─ status
  └─ expiredAt / paidAt
  ↓
If status = "success":
  ├─ Update Booking.status = "confirmed"
  └─ Send notification
  ↓
Return transaction details
```

---

## 🔄 Data Flow Diagram

### Registration Flow
```
RegisterForm Component
    ↓
user input: username, name, phone, email, password
    ↓
Validate all fields required
    ↓
POST /api/auth/register
    ↓
API: sanitize & validate input
    ↓
API: hash password dengan bcryptjs
    ↓
API: CREATE User (username UNIQUE)
    ↓
API: generate JWT token
    ↓
API: return user + token
    ↓
SetSecureCookie "auth-token"
    ↓
Router.push("/profile")
```

### Booking Flow
```
BookingForm Component
    ↓
user select: field, date, time
    ↓
GET /api/fields/[fieldId]/availability?date=...
    ↓
Check FieldSchedule isAvailable
    ↓
Return available slots
    ↓
User submit booking
    ↓
POST /api/bookings (+ auth token)
    ↓
API: Validate booking payload
    ↓
API: Calculate duration & total price
    ↓
API: Transaction:
  ├─ CREATE Booking record
  └─ UPDATE FieldSchedule.isAvailable = false
    ↓
API: auditLog "booking-created"
    ↓
Return booking details
    ↓
Router.push("/checkout")
```

### Payment Flow
```
CheckoutPage Component
    ↓
GET /api/bookings/:bookingId
    ↓
Display booking + calculate amount
    ↓
User select payment method
    ↓
POST /api/payments/create
    ↓
API: Create Payment record
  ├─ bookingId
  ├─ userId ✓ (NEW)
  ├─ amount
  ├─ status = "pending" / "success"
  └─ transactionId
    ↓
If status = "success":
  ├─ UPDATE Booking.status = "confirmed"
  ├─ CREATE Invoice record
  └─ Send notification
    ↓
Return payment status
    ↓
If success: Router.push("/booking-history")
```

---

## 📝 Database Schema Mapping

### User Table Alignment
```
Old Implementation → New Database Schema
localStorage user → User.{username, name, email, phone}
customerId → User.id (UUID)
token.sub → User.id
token.email → User.email
```

### Booking Table Alignment
```
Old: Mock booking object → New: Booking table
fieldId → Booking.fieldId (FK)
customerId → Booking.userId (FK)
customerName → Booking.customerName
customerEmail → Booking.customerEmail
customerPhone → Booking.customerPhone
startAt → Booking.bookingDate + startTime
endAt → Booking.bookingDate + endTime
status → Booking.status (pending/confirmed/active/completed/cancelled)
```

### Payment Table Alignment
```
Old: Demo payment → New: Payment table
bookingId → Payment.bookingId (FK, UNIQUE)
NEW: userId → Payment.userId (FK)
transactionId → Payment.transactionId (UNIQUE)
paymentMethod → Payment.paymentMethod
provider → Payment.provider
status → Payment.status
amount → Payment.amount
paidAt → Payment.paidAt
```

### Field Table Alignment
```
Old: Mock field → New: Field table
fieldId → Field.id (UUID)
name → Field.name
location → Field.location
price → Field.price (per hour)
type → Field.type (5-aside, 7-aside)
size → Field.size (Small, Medium, Large)
capacity → Field.capacity
rating → Field.rating (from Review)
imageUrl → Field.imageUrl
isActive → Field.isActive
```

### Review Table Alignment
```
Old: Mock review object → New: Review table
id → Review.id (UUID)
customerName → Review.user.name (JOIN User)
fieldName → Review.field.name (JOIN Field)
rating → Review.rating (1-5)
comment → Review.comment
date → Review.createdAt
NEW: userId → Review.userId (FK)
NEW: fieldId → Review.fieldId (FK)
CONSTRAINT: UNIQUE(userId, fieldId)
```

---

## ✅ Checklist Integrasi

### Authentication
- [x] Username field di register form
- [x] Register API handle username validation
- [x] Username ditampilkan di profile
- [x] Login API return username
- [x] Get user endpoint include username

### Booking
- [x] Fields API untuk fetch lapangan dari DB
- [x] Field availability API
- [x] Booking API create dengan database
- [x] Booking API get user bookings
- [x] Transaction untuk consistency (booking + schedule)
- [x] Price calculation based on field price

### Reviews
- [x] Reviews API updated ke schema baru
- [x] Include user name & field name
- [x] Unique constraint per user-field pair
- [x] Authentication required

### Payments
- [x] Payment service updated untuk DB schema
- [x] Include userId saat create payment
- [x] Update booking status saat payment success
- [x] Audit logging

---

## 🚀 Testing Checklist

### Register & Login
- [ ] Register dengan username baru → success
- [ ] Register dengan username yang sudah ada → error "Username already taken"
- [ ] Register dengan email yang sudah ada → error "Email already registered"
- [ ] Login dengan email → success, return username
- [ ] Profile page tampilkan username (readonly)

### Booking
- [ ] GET /api/fields → return list lapangan dari DB
- [ ] GET /api/fields/[id]/availability?date=... → return schedules
- [ ] POST /api/bookings → create booking, mark schedule unavailable
- [ ] GET /api/bookings → return user bookings dengan field details

### Reviews
- [ ] GET /api/reviews → return reviews dari DB
- [ ] POST /api/reviews → create review (auth required)
- [ ] Attempt duplicate review → error 409

### Payments
- [ ] POST /api/payments/create → create payment record
- [ ] Payment success → update booking status + create invoice

---

## 📋 Migration Checklist

Sebelum go-live:

- [ ] Supabase SQL script executed (create 10 tables)
- [ ] Mock data inserted untuk testing
- [ ] Prisma client generated: `npx prisma generate`
- [ ] All API routes tested dengan real DB
- [ ] Frontend components tested dengan real data
- [ ] Payment webhook integration tested
- [ ] Audit logging verified
- [ ] Error handling tested (edge cases)

---

## 📚 Environment Variables Required

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
DIRECT_URL=postgresql://user:pass@host:6543/db

# Payment
SKIP_PAYMENT_GATEWAY=false
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_SERVER_KEY=xxxxx
MIDTRANS_CLIENT_KEY=xxxxx

# Security
JWT_SECRET=xxxxx
CSRF_SECRET=xxxxx
```

---

**Status:** ✅ Alignment complete - Frontend siap untuk diintegrasikan dengan backend database.

**Selanjutnya:** 
1. Execute SQL script di Supabase
2. Test semua API endpoints
3. Verifikasi data consistency
4. Deploy ke production
