# Database & Deployment Guide

## Database Schema

The application now uses a **guest-only booking system**. No user authentication or registration is required.

### Tables Overview

#### `field`
Stores information about each football/soccer field available for booking.

```
- id (UUID): Unique identifier
- name (VARCHAR): Field name
- location (VARCHAR): Field location
- price (INT): Price per hour in IDR
- type (VARCHAR): Field type (5-aside, 7-aside, futsal, etc)
- size (VARCHAR): Field size (Small, Medium, Large)
- capacity (INT): Player capacity
- rating (DECIMAL): Field rating (0-5)
- image_url (VARCHAR): Field image
- is_active (BOOLEAN): Active status
```

#### `field_schedule`
Manages available time slots for each field.

```
- id (UUID): Unique identifier
- field_id (UUID): Reference to field
- date (DATE): Date of availability
- start_time (TIME): Start time (HH:mm)
- end_time (TIME): End time (HH:mm)
- is_available (BOOLEAN): Slot availability
```

#### `booking`
Guest bookings without requiring authentication.

```
- id (UUID): Unique identifier
- field_id (UUID): Reference to field
- booking_date (DATE): Date of booking
- start_time (TIME): Start time
- end_time (TIME): End time
- duration_hours (INT): Duration in hours
- total_price (INT): Total price in IDR
- customer_name (VARCHAR): Guest's name
- customer_phone (VARCHAR): Guest's phone (required for contact)
- customer_email (VARCHAR): Guest's email (for invoices & receipts)
- status (VARCHAR): pending, confirmed, completed, cancelled
```

#### `payment`
Payment transactions via Midtrans Sandbox.

```
- id (UUID): Unique identifier
- booking_id (UUID): Reference to booking
- transaction_id (VARCHAR): Midtrans transaction ID
- amount (INT): Payment amount in IDR
- payment_method (VARCHAR): Payment method
- provider (VARCHAR): Always "Midtrans"
- status (VARCHAR): pending, success, failed, cancelled, refunded
- paid_at (TIMESTAMP): When payment was completed
- expired_at (TIMESTAMP): When payment expires
```

#### `invoice`
Generated invoices for bookings.

```
- id (UUID): Unique identifier
- invoice_number (VARCHAR): Unique invoice number
- booking_id (UUID): Reference to booking
- payment_id (UUID): Reference to payment
- subtotal (INT): Amount before tax/discount
- tax (INT): Tax amount
- discount (INT): Discount amount
- total (INT): Final total
- status (VARCHAR): issued, paid, cancelled
```

#### `audit_log`
Activity logs for tracking.

```
- id (UUID): Unique identifier
- action (VARCHAR): booking_created, payment_made, etc
- entity (VARCHAR): Entity type (Booking, Payment)
- entity_id (VARCHAR): ID of entity
- reference_email (VARCHAR): Email associated with action
- ip_address (VARCHAR): IP address of requester
```

## Database Views

### `guest_booking_history`
Shows booking history with payment status for a customer.

```sql
SELECT * FROM guest_booking_history
WHERE customer_email = 'example@email.com';
```

### `daily_revenue`
Revenue report by date.

```sql
SELECT * FROM daily_revenue
WHERE booking_date >= CURRENT_DATE - INTERVAL '30 days';
```

### `field_availability`
Available slots for booking.

```sql
SELECT * FROM field_availability
WHERE date >= CURRENT_DATE;
```

## Configuration

### Environment Variables

Update `.env.local` with these Midtrans sandbox credentials:

```env
# Database
DATABASE_URL="postgresql://user:password@host/dbname"
DIRECT_URL="postgresql://user:password@host/dbname"

# Midtrans Sandbox
MIDTRANS_SERVER_KEY="YOUR_SANDBOX_SERVER_KEY"
MIDTRANS_CLIENT_KEY="YOUR_SANDBOX_CLIENT_KEY"
MIDTRANS_BASE_URL="https://app.sandbox.midtrans.com/snap/v1/transactions"

# App Settings
NEXT_PUBLIC_APP_URL="http://localhost:3000"
GUEST_USER_ID="00000000-0000-0000-0000-000000000000"
```

## Key Changes from Previous Version

1. **No User Authentication** - All login, register, and profile pages are removed
2. **Guest-Only Booking** - Customers only need to provide name, email, and phone
3. **Midtrans Integration** - All payments go through Midtrans Sandbox
4. **Simplified Schema** - Removed user authentication fields (username, passwordHash)
5. **Direct Payment** - No offline payment option, all payments use Midtrans

## Booking Flow

```
1. Guest selects field, date, and time slot
2. Guest enters name, email, and phone
3. System creates pending booking
4. Midtrans payment page opens
5. Guest completes payment
6. Booking status updates to confirmed
7. Invoice is generated and sent to email
```

## SQL Editor

Access the SQL editor at `/sql-editor` to:
- Query booking history
- View payment status
- Generate revenue reports
- Check available slots
- Monitor audit logs

Pre-built templates include:
- All Bookings
- Today's Bookings
- Payment Summary
- Fields List
- Available Slots
- Revenue Report

## Deployment Checklist

- [ ] Database migrated and seeded
- [ ] Midtrans sandbox credentials configured
- [ ] Environment variables set in production
- [ ] Payment webhook configured for Midtrans
- [ ] Email service configured for invoices
- [ ] Database backups enabled
- [ ] SSL certificates configured
- [ ] Rate limiting configured

## API Endpoints

### GET `/api/bookings`
Lookup bookings by email or phone.

**Query Parameters:**
- `email` - Guest's email (optional)
- `phone` - Guest's phone (optional)

### POST `/api/bookings`
Create a new booking.

**Request Body:**
```json
{
  "fieldId": "uuid",
  "bookingDate": "2026-07-20",
  "startTime": "18:00",
  "endTime": "20:00",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+62812345678",
  "validateOnly": false
}
```

### POST `/api/payments/create`
Create a Midtrans payment transaction.

**Request Body:**
```json
{
  "bookingId": "uuid",
  "amount": 500000,
  "customerName": "John Doe",
  "email": "john@example.com",
  "phone": "+62812345678"
}
```

## Notes

- All prices are in Indonesian Rupiah (IDR)
- Phone numbers are stored without processing
- Email is required for invoice delivery
- Bookings are guest-only (no registration needed)
- Payments are processed in real-time through Midtrans
