const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

async function main() {
  console.log('Starting seed...');

  // First, fix the database schema by dropping and recreating tables with correct column types
  try {
    console.log('Fixing database schema (converting TIME to VARCHAR)...');
    
    // Drop views first
    await prisma.$queryRawUnsafe(`DROP VIEW IF EXISTS field_availability CASCADE;`);
    await prisma.$queryRawUnsafe(`DROP VIEW IF EXISTS daily_revenue CASCADE;`);
    await prisma.$queryRawUnsafe(`DROP VIEW IF EXISTS guest_booking_history CASCADE;`);
    
    // Drop tables in reverse dependency order
    await prisma.$queryRawUnsafe(`DROP TABLE IF EXISTS invoice CASCADE;`);
    await prisma.$queryRawUnsafe(`DROP TABLE IF EXISTS review CASCADE;`);
    await prisma.$queryRawUnsafe(`DROP TABLE IF EXISTS payment CASCADE;`);
    await prisma.$queryRawUnsafe(`DROP TABLE IF EXISTS booking CASCADE;`);
    await prisma.$queryRawUnsafe(`DROP TABLE IF EXISTS field_schedule CASCADE;`);
    await prisma.$queryRawUnsafe(`DROP TABLE IF EXISTS admin_setting CASCADE;`);
    await prisma.$queryRawUnsafe(`DROP TABLE IF EXISTS audit_log CASCADE;`);
    await prisma.$queryRawUnsafe(`DROP TABLE IF EXISTS field CASCADE;`);
    
    console.log('✅ Tables dropped successfully');
  } catch (error) {
    console.log('Note: Schema reset skipped (tables may not exist)');
  }

  // Recreate tables with proper VARCHAR columns for time fields
  try {
    console.log('Creating tables with correct schema...');
    
    await prisma.$queryRawUnsafe(`
      CREATE TABLE field (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        type VARCHAR(50),
        size VARCHAR(50),
        capacity INTEGER,
        rating DECIMAL(3, 2) DEFAULT 0,
        image_url VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await prisma.$queryRawUnsafe(`
      CREATE TABLE field_schedule (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        field_id UUID NOT NULL REFERENCES field(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        start_time VARCHAR(10) NOT NULL,
        end_time VARCHAR(10) NOT NULL,
        is_available BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(field_id, date, start_time)
      );
    `);
    
    await prisma.$queryRawUnsafe(`
      CREATE TABLE booking (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        field_id UUID NOT NULL REFERENCES field(id) ON DELETE CASCADE,
        booking_date DATE NOT NULL,
        start_time VARCHAR(10) NOT NULL,
        end_time VARCHAR(10) NOT NULL,
        duration_hours INTEGER NOT NULL,
        total_price INTEGER NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        customer_email VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await prisma.$queryRawUnsafe(`
      CREATE TABLE payment (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID NOT NULL REFERENCES booking(id) ON DELETE CASCADE,
        transaction_id VARCHAR(255) UNIQUE NOT NULL,
        amount INTEGER NOT NULL,
        payment_method VARCHAR(100) DEFAULT 'Midtrans',
        provider VARCHAR(100) DEFAULT 'Midtrans',
        status VARCHAR(50) DEFAULT 'pending',
        paid_at TIMESTAMP,
        expired_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await prisma.$queryRawUnsafe(`
      CREATE TABLE invoice (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        booking_id UUID UNIQUE NOT NULL REFERENCES booking(id) ON DELETE CASCADE,
        payment_id UUID UNIQUE NOT NULL REFERENCES payment(id) ON DELETE CASCADE,
        subtotal INTEGER NOT NULL,
        tax INTEGER DEFAULT 0,
        discount INTEGER DEFAULT 0,
        total INTEGER NOT NULL,
        status VARCHAR(50) DEFAULT 'issued',
        issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await prisma.$queryRawUnsafe(`
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
    `);
    
    await prisma.$queryRawUnsafe(`
      CREATE TABLE admin_setting (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key VARCHAR(100) UNIQUE NOT NULL,
        value TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await prisma.$queryRawUnsafe(`
      CREATE TABLE audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        action VARCHAR(100) NOT NULL,
        entity VARCHAR(100) NOT NULL,
        entity_id VARCHAR(255) NOT NULL,
        changes TEXT,
        ip_address VARCHAR(45),
        reference_email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error.message);
    throw error;
  }

  // Create indexes
  try {
    console.log('Creating indexes...');
    
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_booking_customer_email ON booking(customer_email);`);
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_booking_customer_phone ON booking(customer_phone);`);
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_booking_booking_date ON booking(booking_date);`);
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_booking_status ON booking(status);`);
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_booking_field_id ON booking(field_id);`);
    
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_review_field_id ON review(field_id);`);
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_review_booking_id ON review(booking_id);`);
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_admin_setting_key ON admin_setting(key);`);
    
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_payment_booking_id ON payment(booking_id);`);
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_payment_transaction_id ON payment(transaction_id);`);
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_payment_status ON payment(status);`);
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_payment_created_at ON payment(created_at);`);
    
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_invoice_booking_id ON invoice(booking_id);`);
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_invoice_payment_id ON invoice(payment_id);`);
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_invoice_status ON invoice(status);`);
    
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_field_is_active ON field(is_active);`);
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_field_schedule_available ON field_schedule(is_available);`);
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);`);
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_audit_log_entity_id ON audit_log(entity_id);`);
    await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);`);
    
    console.log('✅ Indexes created successfully');
  } catch (error) {
    console.log('Note: Some indexes may already exist');
  }

  // Check if data already exists
  const existingFields = await prisma.field.findMany();
  
  if (existingFields.length === 0) {
    console.log('Creating fields...');
    await prisma.field.createMany({
      data: [
        {
          name: 'Lapangan Klaten International',
          location: 'Klaten',
          price: 110000,
          type: 'Mini Soccer',
          size: '5v5',
          capacity: 10,
          rating: 4.9,
          imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80',
        },
        {
          name: 'Lapangan Merdeka A',
          location: 'Jalan Merdeka No. 123, Klaten',
          price: 130000,
          type: 'Futsal',
          size: '5-aside',
          capacity: 10,
          rating: 4.7,
          imageUrl: 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1200&q=80',
        },
      ],
    });
  }

  const fields = await prisma.field.findMany();
  const fieldId = fields[0]?.id;

  if (fieldId) {
    // Check existing bookings
    const existingBookings = await prisma.booking.findMany({ where: { fieldId } });
    
    if (existingBookings.length === 0) {
      console.log('Creating bookings...');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      await prisma.booking.createMany({
        data: [
          {
            fieldId,
            bookingDate: tomorrow,
            startTime: '18:00',
            endTime: '20:00',
            durationHours: 2,
            totalPrice: 220000,
            customerName: 'Ahmad Rahman',
            customerPhone: '08123456789',
            customerEmail: 'ahmad@email.com',
            status: 'confirmed',
          },
          {
            fieldId,
            bookingDate: dayAfter,
            startTime: '19:00',
            endTime: '21:00',
            durationHours: 2,
            totalPrice: 220000,
            customerName: 'Budi Santoso',
            customerPhone: '08987654321',
            customerEmail: 'budi@email.com',
            status: 'pending',
          },
        ],
      });
    }

    const bookings = await prisma.booking.findMany({
      where: { fieldId },
      orderBy: { createdAt: 'asc' },
      take: 2,
    });

    for (const booking of bookings) {
      const existingPayment = await prisma.payment.findFirst({
        where: { bookingId: booking.id },
      });

      if (!existingPayment) {
        console.log('Creating payment for booking...');
        await prisma.payment.create({
          data: {
            bookingId: booking.id,
            transactionId: `${booking.id}-${Date.now()}`,
            amount: booking.totalPrice,
            paymentMethod: 'Midtrans',
            provider: 'Midtrans',
            status: booking.status === 'confirmed' ? 'success' : 'pending',
            paidAt: booking.status === 'confirmed' ? new Date() : null,
            expiredAt: new Date(Date.now() + 30 * 60 * 1000),
          },
        });
      }
    }

    // Create reviews
    const existingReviews = await prisma.review.findMany({ where: { fieldId } });
    
    if (existingReviews.length === 0) {
      console.log('Creating reviews...');
      await prisma.review.createMany({
        data: [
          {
            fieldId,
            customerName: 'Ari Putra',
            rating: 5,
            comment: 'Lapangan bersih, proses booking cepat, dan pelayanan ramah.',
          },
          {
            fieldId,
            customerName: 'Nina Sari',
            rating: 4,
            comment: 'Fasilitas bagus dan suasana nyaman. Parkir bisa ditingkatkan.',
          },
        ],
      });
    }
  }

  // Create admin settings
  const existingSettings = await prisma.adminSetting.findMany();
  if (existingSettings.length === 0) {
    console.log('Creating admin settings...');
    await prisma.adminSetting.createMany({
      data: [
        { key: 'site_title', value: 'Klaten International Minisoccer', description: 'Nama utama situs web' },
        { key: 'contact_email', value: 'info@klatenminisoccer.id', description: 'Email kontak utama' },
        { key: 'contact_phone', value: '+62 821-1234-5678', description: 'Nomor telepon kontak utama' },
      ],
    });
  }

  console.log('✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
