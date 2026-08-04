# Payment Status Verification & Database Sync

## Ringkasan Sistem

Sistem payment sekarang memiliki mekanisme verifikasi multi-layer untuk memastikan status payment dari Midtrans selalu tersinkronisasi dengan database lokal:

### 1. **Webhook Processing** ✅
Ketika Midtrans mengirim webhook:
- Status diterima dan dinormalisasi (`success`, `failed`, `expired`, `cancelled`, `pending`)
- Payment record diupdate dengan status baru dan timestamp
- Booking status diupdate sesuai payment status:
  - `payment.success` → `booking.confirmed` (slot terkunci)
  - `payment.failed/expired/cancelled` → `booking.cancelled` (slot terbuka)
- Invoice diupdate (paid/issued)
- Notifikasi dikirim (email confirmation atau booking cancelled)

**Lokasi**: `lib/payment-service.ts` → `processWebhookEvent()`

### 2. **User Redirect Reconciliation** ✅
Ketika user diarahkan dari Midtrans ke success/failure page:
- Status parameter diambil dari URL
- `reconcilePaymentStatus()` dipanggil untuk memproses status
- Ini berfungsi sebagai fallback jika webhook tertunda/terlewat

**Lokasi**: `app/payment/success/page.tsx` dan `app/payment/failure/page.tsx`

### 3. **Real-time Polling** ✅
Di payment page, component melakukan polling setiap 3 detik:
- Mengambil status payment terbaru dari database
- Jika status berubah dari "pending" ke "success" → redirect otomatis
- Jika status berubah ke "failed/expired/cancelled" → tampilkan error

**Lokasi**: `components/booking-payment-embed.tsx` → `useEffect` polling

### 4. **Initial Load Check** ✅
Saat payment page pertama kali dimuat:
- Fetch payment status dari database
- Jika sudah `success` → redirect otomatis (catch webhook yang sudah diproses)
- Jika sudah `failed/expired/cancelled` → tampilkan error message

**Lokasi**: `components/booking-payment-embed.tsx` → `useEffect` initialization

### 5. **Slot Availability Logic** ✅
Slot hanya diblokir untuk booking dengan status CONFIRMED atau COMPLETED:

```typescript
// HANYA booking yang sudah DIBAYAR yang blokir slot
status: {
  in: ["confirmed", "completed"],
}
```

- ✅ Confirmed booking (sudah bayar) → BLOKIR SLOT
- ✅ Completed booking (sudah digunakan) → BLOKIR SLOT
- ❌ Pending booking (belum bayar) → TIDAK blokir slot
- ❌ Cancelled booking (pembayaran gagal) → TIDAK blokir slot
- ❌ Expired booking → TIDAK blokir slot

**Lokasi**: `lib/booking-engine.ts` → `hasOverlap()`

### 6. **Scheduled Cleanup** ✅
Fungsi `expirePendingPayments()` dipanggil saat:
- User membuat booking baru
- User mengakses payment transaction API

Ini memastikan payment yang expired otomatis diproses.

---

## Testing & Debugging Endpoints

### Audit Trail API
```bash
# Lihat complete audit trail untuk payment
GET /api/payments/audit?transactionId=xxx

# Lihat complete audit trail untuk booking
GET /api/payments/audit?bookingId=xxx
```

**Response mencakup**:
- Payment status history
- Booking status
- Timestamp semua update
- Summary: apakah slot terblokir atau tidak
- Last update info

### Manual Sync Endpoint
```bash
# Manually sync payment status dari database
POST /api/payments/sync-status
Content-Type: application/json

{
  "transactionId": "xxx"
}
```

**Response mencakup**:
- Sebelum/sesudah status comparison
- Apakah ada perubahan
- Current state di database
- Error details jika ada

---

## Database Update Flow

### Skenario 1: Payment SUCCESS ✅

```
1. Midtrans Snap popup → User klik pembayaran berhasil
2. Midtrans webhook → POST /api/midtrans/notification
3. processWebhookEvent("success")
   ├─ payment.status = "success"
   ├─ payment.paidAt = now
   ├─ booking.status = "confirmed"
   ├─ invoice.status = "paid"
   └─ kirim email confirmation
4. Browser polling detects change
   ├─ redirect ke /payment/success
   ├─ slot sekarang TERKUNCI untuk user lain
   └─ invoice ready untuk download
```

### Skenario 2: Payment FAILED/EXPIRED ✅

```
1. Midtrans Snap popup → Payment timeout atau user reject
2. Midtrans webhook → POST /api/midtrans/notification
3. processWebhookEvent("failed" / "expired")
   ├─ payment.status = "failed/expired"
   ├─ payment.expiredAt = now
   ├─ booking.status = "cancelled"
   ├─ invoice.status = "issued"
   └─ kirim notification booking-cancelled
4. Browser polling detects change
   ├─ show error message
   ├─ slot LANGSUNG available untuk user lain
   └─ user bisa buat booking baru
```

### Skenario 3: Webhook Delay (Fallback) ✅

```
1. Payment berhasil tapi webhook delayed
2. User di-redirect ke /payment/success
3. reconcilePaymentStatus() dijalankan
4. Status dari URL diproses seperti webhook
5. Database update jalan walaupun webhook belum tiba
6. Ketika webhook akhirnya tiba, statusnya sudah benar
```

### Skenario 4: Page Reload (Early Completion Detection) ✅

```
1. User submit pembayaran → webpack berhasil tapi UI belum update
2. User reload payment page
3. Component load → fetch payment from DB
4. Status sudah "success" di database
5. Auto-redirect langsung (tidak perlu polling)
6. Slot LANGSUNG terkunci
```

---

## Database Schema Consistency

### Payment Table
```
id                    
transactionId         ← Unique identifier dari Midtrans
bookingId            
status                ← "pending", "success", "failed", "expired", "cancelled", "refunded"
amount               
paidAt               ← Set ketika status = "success"
expiredAt            ← Set ketika status = "failed/expired/cancelled"
createdAt            
updatedAt            ← Tracks semua perubahan
```

### Booking Table
```
id                   
bookingDate          
startTime            
endTime              
status               ← "pending", "confirmed", "completed", "cancelled", "expired", "refunded"
totalPrice           
createdAt            
updatedAt            ← Tracks status changes
```

### Sync Status
- ✅ `payment.status` dan `booking.status` selalu dalam sync
- ✅ Slot blocking logic hanya untuk `booking.status IN ["confirmed", "completed"]`
- ✅ Failed payment otomatis sets `booking.status = "cancelled"`
- ✅ Cancelled booking tidak memblokir slot untuk user lain

---

## Monitoring & Alert Points

### Critical Checks
1. **Payment status mismatch**: payment.status ≠ booking.status
   - Debug dengan `/api/payments/audit?bookingId=xxx`
   - Sync dengan `/api/payments/sync-status`

2. **Slot wrongly blocked**: pending booking blocking slot
   - Check: `booking.status` seharusnya bukan "pending"
   - Verify: `payment.status` mungkin tertinggal update

3. **Double booking**: dua booking confirmed di slot yang sama
   - Check database: apakah ada dua `booking.status = "confirmed"`
   - Ini tidak seharusnya terjadi dengan logic sekarang

### Debugging Process
```bash
# 1. Check payment audit trail
curl "https://app.vercel.com/api/payments/audit?bookingId=xxx"

# 2. Jika tidak sync, manual sync
curl -X POST "https://app.vercel.com/api/payments/sync-status" \
  -H "Content-Type: application/json" \
  -d '{"bookingId":"xxx"}'

# 3. Verify slot availability
curl "https://app.vercel.com/api/fields/[fieldId]/availability?date=2026-08-04"
```

---

## Kesimpulan

✅ **System Status: PRODUCTION READY**

Sistem sekarang memiliki:
1. Real-time payment status sync
2. Multiple fallback mechanisms
3. Auto-redirect on completion
4. Proper slot blocking logic
5. Comprehensive audit trail
6. Manual sync for emergencies
7. Scheduled cleanup tasks

Database akan selalu accurate karena ada 4 layer verifikasi:
- Webhook processing
- Redirect reconciliation
- Real-time polling
- Scheduled cleanup

Slot status akan selalu konsisten dengan payment status.
