-- Add passwordHash to User model
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "passwordHash" TEXT NOT NULL DEFAULT '';
