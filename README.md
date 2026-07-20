This is a [Next.js](https://nextjs.org) project for booking soccer fields online.

# Mini Soccer - Guest-Only Booking System

A modern web application for booking soccer fields with **guest-only checkout** and **Midtrans Sandbox payment integration**.

## Features

🎯 **Guest-Only Booking** - No registration or login required  
💳 **Midtrans Integration** - Secure payment processing via Midtrans Sandbox  
📧 **Email Invoices** - Automatic invoice generation and delivery  
🗂️ **SQL Editor** - Built-in database query tool for admin use  
📱 **Responsive Design** - Works on mobile, tablet, and desktop  
🔍 **Booking History** - Guests can find bookings by email or phone  

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Supabase compatible)
- **Payment**: Midtrans Sandbox API
- **Authentication**: None (guest-only system)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd minisoccer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Midtrans credentials and database URL
   ```

4. **Setup database**
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

## Database Setup

### Option 1: Using Prisma (Recommended)
```bash
npx prisma migrate deploy
npx prisma db seed
```

### Option 2: Using Direct SQL
```bash
psql -U username -d dbname -f prisma/guest-booking-schema.sql
```

## Configuration

### Required Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@host/dbname"
DIRECT_URL="postgresql://user:password@host/dbname"

# Midtrans Sandbox
MIDTRANS_SERVER_KEY="Mid-server-xxxxx"
MIDTRANS_CLIENT_KEY="Mid-client-xxxxx"

# App Settings
GUEST_USER_ID="00000000-0000-0000-0000-000000000000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Getting Midtrans Credentials

1. Visit [Midtrans Sandbox Dashboard](https://dashboard.sandbox.midtrans.com/)
2. Sign up for a free sandbox account
3. Navigate to Settings → Access Keys
4. Copy `Server Key` and `Client Key`
5. Add to `.env.local`

## Available Pages

| URL | Purpose |
|-----|---------|
| `/` | Homepage |
| `/book` | Field selection and booking |
| `/checkout` | Guest info and payment confirmation |
| `/booking-history` | View past bookings |
| `/sql-editor` | Database query tool |

## API Endpoints

### Bookings
- `GET /api/bookings?email=xxx&phone=xxx` - Get guest bookings
- `POST /api/bookings` - Create new booking

### Payments
- `POST /api/payments/create` - Create Midtrans transaction

### Admin
- `POST /api/admin/query` - Execute SQL queries

## Booking Flow

```
1. Guest visits /book
2. Guest selects field, date, and time slot
3. System validates availability
4. Guest is directed to /checkout
5. Guest enters name, email, and phone
6. System creates booking and initiates payment
7. Midtrans payment page opens
8. Guest completes payment
9. Booking confirmed, invoice sent to email
10. Guest can view booking at /booking-history
```

## Database Schema

### Key Tables
- **field** - Available soccer fields
- **field_schedule** - Time slots for booking
- **booking** - Guest bookings (guest-only, no user auth)
- **payment** - Midtrans transactions
- **invoice** - Generated invoices

See [SQL_SCHEMA_GUIDE.md](./SQL_SCHEMA_GUIDE.md) for detailed schema documentation.

## SQL Editor

Access the built-in SQL editor at `/sql-editor`:
- Query booking data
- View payment status
- Generate revenue reports
- Monitor available slots
- Pre-built query templates

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy (auto-deploy on push)

### Manual Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

## Development

### Run Tests
```bash
npm run test
```

### Build for Production
```bash
npm run build
npm start
```

### Lint Code
```bash
npm run lint
```

## Troubleshooting

### Payment not working?
- Verify Midtrans credentials in `.env.local`
- Check network tab in browser dev tools
- Ensure database is properly migrated

### Bookings not saving?
- Check database connection string
- Verify Prisma migrations were applied
- Check server logs for errors

### Can't find bookings?
- Use exact email or phone from booking
- Verify booking was created (check database)
- Try SQL editor to query directly

## Documentation

- [Migration Summary](./MIGRATION_SUMMARY.md) - Overview of auth removal
- [SQL Schema Guide](./SQL_SCHEMA_GUIDE.md) - Database documentation
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Production deployment steps

## Security Considerations

✅ No user passwords stored  
✅ Guest info only stored with bookings  
✅ SQL queries restricted to SELECT only  
✅ Rate limiting on booking creation  
✅ CORS protection  
✅ Environment variables for secrets  

## Support

For issues or questions:
1. Check documentation files
2. Review error messages in browser console
3. Check server logs: `npm run dev`
4. Query database using SQL editor for debugging

## License

See LICENSE file for details.

---

**Note**: This is a guest-only booking system. No user authentication or registration is required.
