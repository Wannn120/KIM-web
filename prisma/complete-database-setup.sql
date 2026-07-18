-- ============================================================================
-- MINISOCCER DATABASE SCHEMA
-- Complete database design for booking system with user management
-- ============================================================================

-- ==================== DROP EXISTING TABLES ====================
DROP TABLE IF EXISTS "AuditLog" CASCADE;
DROP TABLE IF EXISTS "Review" CASCADE;
DROP TABLE IF EXISTS "Invoice" CASCADE;
DROP TABLE IF EXISTS "Payment" CASCADE;
DROP TABLE IF EXISTS "Booking" CASCADE;
DROP TABLE IF EXISTS "FieldSchedule" CASCADE;
DROP TABLE IF EXISTS "Field" CASCADE;
DROP TABLE IF EXISTS "AdminSetting" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- ==================== USER & AUTHENTICATION ====================
CREATE TABLE "User" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  "passwordHash" VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) UNIQUE NOT NULL,
  avatar VARCHAR(500),
  "profileStatus" VARCHAR(20) DEFAULT 'incomplete',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_username ON "User"(username);

-- ==================== FIELD MANAGEMENT ====================
CREATE TABLE "Field" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  location VARCHAR(200) NOT NULL,
  description TEXT,
  price INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  size VARCHAR(20) NOT NULL,
  capacity INT NOT NULL,
  rating FLOAT DEFAULT 0,
  "imageUrl" VARCHAR(500),
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_field_name ON "Field"(name);
CREATE INDEX idx_field_isActive ON "Field"("isActive");

-- ==================== FIELD SCHEDULE & AVAILABILITY ====================
CREATE TABLE "FieldSchedule" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "fieldId" UUID NOT NULL REFERENCES "Field"(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  "startTime" VARCHAR(5) NOT NULL,
  "endTime" VARCHAR(5) NOT NULL,
  "isAvailable" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("fieldId", date, "startTime")
);

CREATE INDEX idx_field_schedule_fieldId ON "FieldSchedule"("fieldId");
CREATE INDEX idx_field_schedule_date ON "FieldSchedule"(date);

-- ==================== BOOKING ====================
CREATE TABLE "Booking" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "fieldId" UUID NOT NULL REFERENCES "Field"(id) ON DELETE CASCADE,
  "bookingDate" DATE NOT NULL,
  "startTime" VARCHAR(5) NOT NULL,
  "endTime" VARCHAR(5) NOT NULL,
  "durationHours" INT NOT NULL,
  "totalPrice" INT NOT NULL,
  "customerName" VARCHAR(100) NOT NULL,
  "customerPhone" VARCHAR(15) NOT NULL,
  "customerEmail" VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_booking_userId ON "Booking"("userId");
CREATE INDEX idx_booking_fieldId ON "Booking"("fieldId");
CREATE INDEX idx_booking_status ON "Booking"(status);
CREATE INDEX idx_booking_date ON "Booking"("bookingDate");

-- ==================== PAYMENT & TRANSACTION ====================
CREATE TABLE "Payment" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "bookingId" UUID NOT NULL REFERENCES "Booking"(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "transactionId" VARCHAR(100) UNIQUE NOT NULL,
  amount INT NOT NULL,
  "paymentMethod" VARCHAR(50) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  "proofImageUrl" VARCHAR(500),
  "proofFileName" VARCHAR(200),
  "paidAt" TIMESTAMP,
  "expiredAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_bookingId ON "Payment"("bookingId");
CREATE INDEX idx_payment_userId ON "Payment"("userId");
CREATE INDEX idx_payment_transactionId ON "Payment"("transactionId");
CREATE INDEX idx_payment_status ON "Payment"(status);

-- ==================== INVOICE & RECEIPT ====================
CREATE TABLE "Invoice" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "invoiceNumber" VARCHAR(50) UNIQUE NOT NULL,
  "bookingId" UUID UNIQUE NOT NULL REFERENCES "Booking"(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "paymentId" UUID UNIQUE NOT NULL REFERENCES "Payment"(id) ON DELETE CASCADE,
  subtotal INT NOT NULL,
  tax INT DEFAULT 0,
  discount INT DEFAULT 0,
  total INT NOT NULL,
  status VARCHAR(20) DEFAULT 'issued',
  "issuedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "paidAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoice_userId ON "Invoice"("userId");
CREATE INDEX idx_invoice_invoiceNumber ON "Invoice"("invoiceNumber");
CREATE INDEX idx_invoice_status ON "Invoice"(status);

-- ==================== REVIEW & RATING ====================
CREATE TABLE "Review" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "fieldId" UUID NOT NULL REFERENCES "Field"(id) ON DELETE CASCADE,
  "bookingId" UUID REFERENCES "Booking"(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("userId", "fieldId")
);

CREATE INDEX idx_review_fieldId ON "Review"("fieldId");
CREATE INDEX idx_review_userId ON "Review"("userId");
CREATE INDEX idx_review_rating ON "Review"(rating);

-- ==================== AUDIT LOG ====================
CREATE TABLE "AuditLog" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  entity VARCHAR(50) NOT NULL,
  "entityId" VARCHAR(100) NOT NULL,
  changes TEXT,
  "ipAddress" VARCHAR(45),
  "userAgent" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_userId ON "AuditLog"("userId");
CREATE INDEX idx_audit_log_createdAt ON "AuditLog"("createdAt");
CREATE INDEX idx_audit_log_action ON "AuditLog"(action);

-- ==================== ADMIN SETTINGS ====================
CREATE TABLE "AdminSetting" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INSERT MOCK DATA
-- ============================================================================

-- ==================== INSERT USERS ====================
INSERT INTO "User" (id, username, email, "passwordHash", name, phone, avatar, "profileStatus")
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'arputra', 'ari@example.com', '$2b$10$somehash1', 'Ari Putra', '6281234567890', null, 'complete'),
  ('550e8400-e29b-41d4-a716-446655440002', 'budi88', 'budi@example.com', '$2b$10$somehash2', 'Budi Santoso', '6281234567891', null, 'complete'),
  ('550e8400-e29b-41d4-a716-446655440003', 'dina_sports', 'dina@example.com', '$2b$10$somehash3', 'Dina Wijaya', '6281234567892', null, 'incomplete'),
  ('550e8400-e29b-41d4-a716-446655440004', 'rinto_fc', 'rinto@example.com', '$2b$10$somehash4', 'Rinto Prabowo', '6281234567893', null, 'complete'),
  ('550e8400-e29b-41d4-a716-446655440005', 'siti_futsal', 'siti@example.com', '$2b$10$somehash5', 'Siti Nurhaliza', '6281234567894', null, 'complete');

-- ==================== INSERT FIELDS ====================
INSERT INTO "Field" (id, name, location, description, price, type, size, capacity, rating, "imageUrl", "isActive")
VALUES
  ('660e8400-e29b-41d4-a716-446655440001', 'Lapangan Kencana', 'Jl. Merdeka No. 123, Klaten', 'Lapangan futsal berkualitas dengan AC penuh', 100000, '5-aside', 'Medium', 10, 4.5, 'https://via.placeholder.com/400x300?text=Kencana', true),
  ('660e8400-e29b-41d4-a716-446655440002', 'Lapangan Jaya', 'Jl. Ahmad Yani No. 45, Klaten', 'Lapangan dengan lighting terbaik', 120000, '7-aside', 'Large', 14, 4.7, 'https://via.placeholder.com/400x300?text=Jaya', true),
  ('660e8400-e29b-41d4-a716-446655440003', 'Lapangan Mini', 'Jl. Sudirman No. 78, Klaten', 'Lapangan kecil untuk latihan', 80000, '5-aside', 'Small', 8, 4.2, 'https://via.placeholder.com/400x300?text=Mini', true),
  ('660e8400-e29b-41d4-a716-446655440004', 'Lapangan Bintang', 'Jl. Gatot Subroto No. 56, Klaten', 'Lapangan dengan fasilitas lengkap', 150000, '7-aside', 'Large', 14, 4.8, 'https://via.placeholder.com/400x300?text=Bintang', true),
  ('660e8400-e29b-41d4-a716-446655440005', 'Lapangan Ceria', 'Jl. Diponegoro No. 34, Klaten', 'Lapangan ramah untuk pemula', 75000, '5-aside', 'Small', 8, 4.0, 'https://via.placeholder.com/400x300?text=Ceria', true);

-- ==================== INSERT FIELD SCHEDULES ====================
INSERT INTO "FieldSchedule" ("fieldId", date, "startTime", "endTime", "isAvailable")
VALUES
  ('660e8400-e29b-41d4-a716-446655440001', CURRENT_DATE + INTERVAL '1 day', '08:00', '09:00', true),
  ('660e8400-e29b-41d4-a716-446655440001', CURRENT_DATE + INTERVAL '1 day', '09:00', '10:00', true),
  ('660e8400-e29b-41d4-a716-446655440001', CURRENT_DATE + INTERVAL '1 day', '10:00', '11:00', false),
  ('660e8400-e29b-41d4-a716-446655440001', CURRENT_DATE + INTERVAL '1 day', '18:00', '19:00', true),
  ('660e8400-e29b-41d4-a716-446655440002', CURRENT_DATE + INTERVAL '1 day', '08:00', '09:00', true),
  ('660e8400-e29b-41d4-a716-446655440002', CURRENT_DATE + INTERVAL '1 day', '19:00', '20:00', true);

-- ==================== INSERT BOOKINGS ====================
INSERT INTO "Booking" (id, "userId", "fieldId", "bookingDate", "startTime", "endTime", "durationHours", "totalPrice", "customerName", "customerPhone", "customerEmail", status)
VALUES
  ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', CURRENT_DATE, '18:00', '19:00', 1, 100000, 'Ari Putra', '6281234567890', 'ari@example.com', 'completed'),
  ('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', CURRENT_DATE + INTERVAL '1 day', '19:00', '20:00', 1, 120000, 'Budi Santoso', '6281234567891', 'budi@example.com', 'confirmed'),
  ('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', CURRENT_DATE + INTERVAL '2 days', '08:00', '10:00', 2, 200000, 'Dina Wijaya', '6281234567892', 'dina@example.com', 'pending'),
  ('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440004', CURRENT_DATE + INTERVAL '3 days', '17:00', '18:00', 1, 150000, 'Ari Putra', '6281234567890', 'ari@example.com', 'pending'),
  ('770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440005', CURRENT_DATE, '08:00', '09:00', 1, 75000, 'Rinto Prabowo', '6281234567893', 'rinto@example.com', 'completed');

-- ==================== INSERT PAYMENTS ====================
INSERT INTO "Payment" (id, "bookingId", "userId", "transactionId", amount, "paymentMethod", provider, status, "paidAt")
VALUES
  ('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'TXN-20240718-001', 100000, 'Bank Transfer', 'BCA', 'success', CURRENT_TIMESTAMP - INTERVAL '1 day'),
  ('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'TXN-20240718-002', 120000, 'E-Wallet', 'GoPay', 'success', CURRENT_TIMESTAMP),
  ('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'TXN-20240718-003', 200000, 'Virtual Account', 'BNI', 'pending', null),
  ('880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440004', 'TXN-20240718-004', 75000, 'E-Wallet', 'Dana', 'success', CURRENT_TIMESTAMP);

-- ==================== INSERT INVOICES ====================
INSERT INTO "Invoice" (id, "invoiceNumber", "bookingId", "userId", "paymentId", subtotal, tax, discount, total, status, "paidAt")
VALUES
  ('990e8400-e29b-41d4-a716-446655440001', 'INV-2024-001', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', 100000, 0, 0, 100000, 'paid', CURRENT_TIMESTAMP - INTERVAL '1 day'),
  ('990e8400-e29b-41d4-a716-446655440002', 'INV-2024-002', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440002', 120000, 0, 0, 120000, 'paid', CURRENT_TIMESTAMP),
  ('990e8400-e29b-41d4-a716-446655440005', 'INV-2024-005', '770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440004', 75000, 0, 0, 75000, 'paid', CURRENT_TIMESTAMP);

-- ==================== INSERT REVIEWS ====================
INSERT INTO "Review" ("userId", "fieldId", "bookingId", rating, comment)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 5, 'Lapangan sangat bagus dan bersih, pelayanan memuaskan!'),
  ('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', 4, 'Lapangan bagus tapi AC perlu diperbaiki'),
  ('550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440005', 4, 'Lapangan ok, parkir terbatas'),
  ('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', null, 5, 'Lokasi strategis dan harga terjangkau');

-- ==================== INSERT AUDIT LOGS ====================
INSERT INTO "AuditLog" ("userId", action, entity, "entityId", changes)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'register', 'User', '550e8400-e29b-41d4-a716-446655440001', '{"action":"user registered"}'),
  ('550e8400-e29b-41d4-a716-446655440001', 'login', 'User', '550e8400-e29b-41d4-a716-446655440001', '{"action":"user logged in"}'),
  ('550e8400-e29b-41d4-a716-446655440001', 'booking_created', 'Booking', '770e8400-e29b-41d4-a716-446655440001', '{"fieldId":"660e8400-e29b-41d4-a716-446655440001","status":"pending"}'),
  ('550e8400-e29b-41d4-a716-446655440001', 'payment_made', 'Payment', '880e8400-e29b-41d4-a716-446655440001', '{"status":"success","amount":100000}'),
  ('550e8400-e29b-41d4-a716-446655440002', 'register', 'User', '550e8400-e29b-41d4-a716-446655440002', '{"action":"user registered"}');

-- ==================== INSERT ADMIN SETTINGS ====================
INSERT INTO "AdminSetting" (key, value, description)
VALUES
  ('platform_name', 'Klaten International Minisoccer', 'Nama platform'),
  ('booking_cancellation_hours', '24', 'Jam sebelum booking untuk bisa cancel'),
  ('max_daily_bookings_per_field', '15', 'Maksimal booking per hari per lapangan'),
  ('tax_percentage', '0', 'Persentase pajak'),
  ('enable_online_payment', 'true', 'Aktifkan pembayaran online');

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Total tables created: 10
-- - User (5 users)
-- - Field (5 fields)
-- - FieldSchedule (6 schedules)
-- - Booking (5 bookings)
-- - Payment (4 payments)
-- - Invoice (3 invoices)
-- - Review (4 reviews)
-- - AuditLog (5 logs)
-- - AdminSetting (5 settings)
-- ============================================================================
