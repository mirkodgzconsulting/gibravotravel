-- AlterTable
ALTER TABLE "ventas_tour_bus" ADD COLUMN IF NOT EXISTS "attachedFile" TEXT,
ADD COLUMN IF NOT EXISTS "attachedFileName" TEXT;

