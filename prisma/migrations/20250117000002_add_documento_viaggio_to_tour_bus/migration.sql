-- AlterTable
-- Agregar campos documentoViaggio y documentoViaggioName a tour_bus
-- documentoViaggio es JSONB para almacenar un array de objetos {url, name}
-- documentoViaggioName se mantiene por compatibilidad pero no se usa en el nuevo formato
ALTER TABLE "tour_bus"
ADD COLUMN IF NOT EXISTS "documentoViaggio" JSONB,
ADD COLUMN IF NOT EXISTS "documentoViaggioName" TEXT;

