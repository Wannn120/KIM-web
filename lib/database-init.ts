import { prisma } from "@/lib/prisma";

/**
 * Ensures the database has at least one field for bookings.
 * This is a safety measure to ensure the app works even if migrations haven't run.
 */
export async function ensureDefaultFieldExists() {
  try {
    const existingFields = await prisma.field.count();
    
    if (existingFields === 0) {
      console.log("[DB INIT] No fields found, creating default field...");
      
      const defaultField = await prisma.field.create({
        data: {
          id: "klaten-field-1",
          name: "Lapangan Klaten International",
          location: "Klaten",
          description: "Lapangan mini soccer premium dengan fasilitas lengkap di Klaten.",
          price: 110000,
          type: "Mini Soccer",
          size: "5v5",
          capacity: 10,
          rating: 4.9,
          isActive: true,
          status: "ACTIVE",
          imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
          isFeatured: true,
        },
      });
      
      console.log("[DB INIT] Default field created:", defaultField.id);
      
      // Create hourly schedule for the next 30 days
      const now = new Date();
      const schedules = [];
      
      for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
        const scheduleDate = new Date(now);
        scheduleDate.setDate(scheduleDate.getDate() + dayOffset);
        scheduleDate.setHours(0, 0, 0, 0);
        
        // Create slots from 06:00 to 22:00
        for (let hour = 6; hour < 22; hour++) {
          const startTime = `${String(hour).padStart(2, "0")}:00`;
          const endTime = `${String(hour + 1).padStart(2, "0")}:00`;
          
          schedules.push({
            fieldId: defaultField.id,
            date: scheduleDate,
            startTime,
            endTime,
            isAvailable: true,
          });
        }
      }
      
      await prisma.fieldSchedule.createMany({
        data: schedules,
        skipDuplicates: true,
      });
      
      console.log(`[DB INIT] Created ${schedules.length} schedule slots for default field`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("[DB INIT] Error ensuring default field:", error);
    return false;
  }
}

/**
 * Retrieves fields with fallback to ensure data is always available
 */
export async function getFieldsWithFallback() {
  try {
    const fields = await prisma.field.findMany({
      where: { isActive: true, status: "ACTIVE" },
      orderBy: { name: "asc" },
    });
    
    if (fields.length > 0) {
      return fields;
    }
    
    // Ensure default field exists if no fields found
    await ensureDefaultFieldExists();
    
    return prisma.field.findMany({
      where: { isActive: true, status: "ACTIVE" },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("[DB] Error fetching fields:", error);
    return [];
  }
}
