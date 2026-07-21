-- ==================== DROP EXISTING TABLES ====================
-- Drop tables dalam urutan reverse dependencies
DROP VIEW IF EXISTS field_availability CASCADE;
DROP VIEW IF EXISTS daily_revenue CASCADE;
DROP VIEW IF EXISTS guest_booking_history CASCADE;

DROP TABLE IF EXISTS invoice CASCADE;
DROP TABLE IF EXISTS review CASCADE;
DROP TABLE IF EXISTS payment CASCADE;
DROP TABLE IF EXISTS booking CASCADE;
DROP TABLE IF EXISTS field_schedule CASCADE;
DROP TABLE IF EXISTS admin_setting CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS field CASCADE;

-- ==================== FIELD MANAGEMENT ====================
CREATE TABLE field (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- Price per hour in IDR
  type VARCHAR(50), -- 5-aside, 7-aside, futsal, etc
  size VARCHAR(50), -- Small, Medium, Large
  capacity INTEGER, -- Number of players
  rating DECIMAL(3, 2) DEFAULT 0,
  image_url VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== FIELD SCHEDULE & AVAILABILITY ====================
CREATE TABLE field_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES field(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time VARCHAR(10) NOT NULL, -- HH:mm format
  end_time VARCHAR(10) NOT NULL, -- HH:mm format
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(field_id, date, start_time)
);

-- ==================== BOOKING (GUEST ONLY) ====================
CREATE TABLE booking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Field reference
  field_id UUID NOT NULL REFERENCES field(id) ON DELETE CASCADE,
  
  -- Booking details
  booking_date DATE NOT NULL,
  start_time VARCHAR(10) NOT NULL, -- HH:mm format
  end_time VARCHAR(10) NOT NULL, -- HH:mm format
  duration_hours INTEGER NOT NULL, -- Number of hours
  total_price INTEGER NOT NULL, -- Total price in IDR
  
  -- Customer info (guest only - no login required)
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, completed, cancelled
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== PAYMENT & TRANSACTION (MIDTRANS) ====================
CREATE TABLE payment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES booking(id) ON DELETE CASCADE,
  
  -- Transaction details
  transaction_id VARCHAR(255) UNIQUE NOT NULL,
  amount INTEGER NOT NULL, -- Amount in IDR
  payment_method VARCHAR(100) DEFAULT 'Midtrans', -- Payment method used
  provider VARCHAR(100) DEFAULT 'Midtrans', -- Payment provider
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, success, failed, cancelled, refunded
  
  -- Timestamps
  paid_at TIMESTAMP,
  expired_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== INVOICE & RECEIPT ====================
CREATE TABLE invoice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  booking_id UUID UNIQUE NOT NULL REFERENCES booking(id) ON DELETE CASCADE,
  payment_id UUID UNIQUE NOT NULL REFERENCES payment(id) ON DELETE CASCADE,
  
  -- Invoice details
  subtotal INTEGER NOT NULL,
  tax INTEGER DEFAULT 0,
  discount INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'issued', -- issued, paid, cancelled
  
  -- Timestamps
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== REVIEW & RATING ====================
CREATE TABLE review (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID REFERENCES field(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES booking(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== ADMIN SETTINGS ====================
CREATE TABLE admin_setting (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== AUDIT LOG ====================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  action VARCHAR(100) NOT NULL, -- booking_created, payment_made, etc
  entity VARCHAR(100) NOT NULL, -- Booking, Payment, etc
  entity_id VARCHAR(255) NOT NULL,
  changes TEXT, -- JSON string of what changed
  ip_address VARCHAR(45),
  reference_email VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== CREATE INDEXES ====================
CREATE INDEX IF NOT EXISTS idx_booking_customer_email ON booking(customer_email);
CREATE INDEX IF NOT EXISTS idx_booking_customer_phone ON booking(customer_phone);
CREATE INDEX IF NOT EXISTS idx_booking_booking_date ON booking(booking_date);
CREATE INDEX IF NOT EXISTS idx_booking_status ON booking(status);
CREATE INDEX IF NOT EXISTS idx_booking_field_id ON booking(field_id);

CREATE INDEX IF NOT EXISTS idx_review_field_id ON review(field_id);
CREATE INDEX IF NOT EXISTS idx_review_booking_id ON review(booking_id);
CREATE INDEX IF NOT EXISTS idx_admin_setting_key ON admin_setting(key);

CREATE INDEX IF NOT EXISTS idx_payment_booking_id ON payment(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_transaction_id ON payment(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_status ON payment(status);
CREATE INDEX IF NOT EXISTS idx_payment_created_at ON payment(created_at);

CREATE INDEX IF NOT EXISTS idx_invoice_booking_id ON invoice(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payment_id ON invoice(payment_id);
CREATE INDEX IF NOT EXISTS idx_invoice_status ON invoice(status);

CREATE INDEX IF NOT EXISTS idx_field_is_active ON field(is_active);
CREATE INDEX IF NOT EXISTS idx_field_schedule_available ON field_schedule(is_available);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_id ON audit_log(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- ==================== SEED DATA ====================
-- Insert sample fields
INSERT INTO field (id, name, location, price, type, size, capacity, rating, is_active)
VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Lapangan A - Futsal Premium', 'Jalan Merdeka No. 123, Jakarta', 250000, '5-aside', 'Medium', 10, 4.5, true),
  ('550e8400-e29b-41d4-a716-446655440001', 'Lapangan B - Mini Soccer', 'Jalan Sudirman No. 456, Jakarta', 200000, '7-aside', 'Large', 14, 4.2, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'Lapangan C - Training', 'Jalan Ahmad Yani No. 789, Surabaya', 150000, '5-aside', 'Small', 10, 3.8, true),
  ('550e8400-e29b-41d4-a716-446655440003', 'Lapangan D - Premium Plus', 'Jalan Gatot Subroto No. 321, Bandung', 300000, '7-aside', 'Large', 14, 4.7, true);

-- Insert sample field schedules for today through next 7 days
INSERT INTO field_schedule (field_id, date, start_time, end_time, is_available)
SELECT 
  f.id,
  CURRENT_DATE + (d - 1) * INTERVAL '1 day',
  times.start_time,
  times.end_time,
  CASE WHEN d <= 3 THEN false ELSE true END -- First 3 days some slots are booked
FROM field f
CROSS JOIN generate_series(1, 7) AS d
CROSS JOIN (
  SELECT * FROM (VALUES
    ('08:00', '09:00'),
    ('09:00', '10:00'),
    ('10:00', '11:00'),
    ('15:00', '16:00'),
    ('16:00', '17:00'),
    ('17:00', '18:00'),
    ('18:00', '19:00'),
    ('19:00', '20:00'),
    ('20:00', '21:00'),
    ('21:00', '22:00')
  ) AS times(start_time, end_time)
) AS times;

-- Insert sample bookings (guest bookings)
INSERT INTO booking (id, field_id, booking_date, start_time, end_time, duration_hours, total_price, customer_name, customer_phone, customer_email, status)
VALUES
  ('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE + 1, '18:00', '20:00', 2, 500000, 'Ahmad Rahman', '08123456789', 'ahmad@email.com', 'confirmed'),
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE + 1, '19:00', '21:00', 2, 400000, 'Budi Santoso', '08987654321', 'budi@email.com', 'pending'),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE + 2, '17:00', '19:00', 2, 500000, 'Citra Dewi', '08765432109', 'citra@email.com', 'confirmed');

-- Insert sample payments (Midtrans)
INSERT INTO payment (id, booking_id, transaction_id, amount, payment_method, provider, status, paid_at, created_at)
VALUES
  ('770e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 500000, 'Midtrans', 'Midtrans', 'success', NOW(), NOW()),
  ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 400000, 'Midtrans', 'Midtrans', 'pending', NULL, NOW()),
  ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 500000, 'Midtrans', 'Midtrans', 'success', NOW(), NOW());

-- Insert sample invoices
INSERT INTO invoice (id, invoice_number, booking_id, payment_id, subtotal, tax, discount, total, status, paid_at, created_at)
VALUES
  ('880e8400-e29b-41d4-a716-446655440000', 'INV-20260720-001', '660e8400-e29b-41d4-a716-446655440000', '770e8400-e29b-41d4-a716-446655440000', 500000, 0, 0, 500000, 'paid', NOW(), NOW()),
  ('880e8400-e29b-41d4-a716-446655440001', 'INV-20260720-002', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 400000, 0, 0, 400000, 'issued', NULL, NOW()),
  ('880e8400-e29b-41d4-a716-446655440002', 'INV-20260720-003', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', 500000, 0, 0, 500000, 'paid', NOW(), NOW());

-- Insert review data
INSERT INTO review (id, field_id, booking_id, customer_name, rating, comment, created_at, updated_at)
VALUES
  ('a70e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 'Ahmad Rahman', 5, 'Lapangan bersih, proses booking cepat, dan pelayanan ramah.', NOW(), NOW()),
  ('a70e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', NULL, 'Nina Sari', 4, 'Fasilitas bagus dan suasana nyaman. Parkir bisa ditingkatkan.', NOW(), NOW()),
  ('a70e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440002', 'Bima Kusuma', 5, 'Cocok untuk latihan tim kecil, booking mudah dan transparan.', NOW(), NOW());

-- Insert admin settings
INSERT INTO admin_setting (id, key, value, description, created_at, updated_at)
VALUES
  ('b80e8400-e29b-41d4-a716-446655440000', 'site_title', 'Klaten International Minisoccer', 'Nama utama situs web', NOW(), NOW()),
  ('b80e8400-e29b-41d4-a716-446655440001', 'contact_email', 'info@klatenminisoccer.id', 'Email kontak utama', NOW(), NOW()),
  ('b80e8400-e29b-41d4-a716-446655440002', 'contact_phone', '+62 821-1234-5678', 'Nomor telepon kontak utama', NOW(), NOW());

-- Insert audit logs
INSERT INTO audit_log (id, action, entity, entity_id, changes, reference_email, created_at)
VALUES
  ('990e8400-e29b-41d4-a716-446655440000', 'booking_created', 'Booking', '660e8400-e29b-41d4-a716-446655440000', NULL, 'ahmad@email.com', NOW()),
  ('990e8400-e29b-41d4-a716-446655440001', 'payment_made', 'Payment', '770e8400-e29b-41d4-a716-446655440000', NULL, 'ahmad@email.com', NOW()),
  ('990e8400-e29b-41d4-a716-446655440002', 'booking_created', 'Booking', '660e8400-e29b-41d4-a716-446655440001', NULL, 'budi@email.com', NOW());

-- ==================== VIEWS FOR COMMON QUERIES ====================
-- Guest Booking View - For easy history lookup
CREATE VIEW guest_booking_history AS
SELECT 
  b.id,
  b.customer_name,
  b.customer_email,
  b.customer_phone,
  b.booking_date,
  b.start_time,
  b.end_time,
  b.total_price,
  b.status,
  f.name AS field_name,
  f.location,
  p.status AS payment_status,
  p.transaction_id
FROM booking b
JOIN field f ON b.field_id = f.id
LEFT JOIN payment p ON b.id = p.booking_id
ORDER BY b.booking_date DESC;

-- Revenue View - For admin dashboard
CREATE VIEW daily_revenue AS
SELECT 
  DATE(b.booking_date) AS booking_date,
  COUNT(DISTINCT b.id) AS total_bookings,
  COUNT(DISTINCT CASE WHEN p.status = 'success' THEN b.id END) AS successful_bookings,
  SUM(CASE WHEN p.status = 'success' THEN p.amount ELSE 0 END) AS total_revenue,
  SUM(b.total_price) AS total_amount
FROM booking b
LEFT JOIN payment p ON b.id = p.booking_id
GROUP BY DATE(b.booking_date)
ORDER BY booking_date DESC;

-- Field Availability View
CREATE VIEW field_availability AS
SELECT 
  fs.field_id,
  f.name,
  fs.date,
  fs.start_time,
  fs.end_time,
  fs.is_available,
  CASE WHEN fs.is_available THEN 'Available' ELSE 'Booked' END AS availability_status
FROM field_schedule fs
JOIN field f ON fs.field_id = f.id
WHERE fs.date >= CURRENT_DATE
ORDER BY fs.date, fs.start_time;
