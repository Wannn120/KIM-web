-- Add passwordHash to User model
ALTER TABLE "User"
ADD COLUMN "passwordHash" TEXT NOT NULL DEFAULT '';
