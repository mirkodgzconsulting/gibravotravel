-- Script de migración para TourBus
-- Preserva datos existentes al cambiar el schema

BEGIN;

-- 1. Agregar nuevas columnas con valores por defecto
ALTER TABLE tour_bus ADD COLUMN IF NOT EXISTS "precioAdulto" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE tour_bus ADD COLUMN IF NOT EXISTS "precioNino" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE tour_bus ADD COLUMN IF NOT EXISTS "fechaViaje" TIMESTAMP(3);

-- 2. Migrar datos existentes
-- Copiar costo a precioAdulto (asumiendo que el costo actual es para adultos)
UPDATE tour_bus SET "precioAdulto" = costo WHERE "precioAdulto" = 0;

-- Establecer precioNino como 80% del precioAdulto (o ajustar según necesidad)
UPDATE tour_bus SET "precioNino" = "precioAdulto" * 0.8 WHERE "precioNino" = 0;

-- Copiar fechaInicio a fechaViaje
UPDATE tour_bus SET "fechaViaje" = "fechaInicio" WHERE "fechaViaje" IS NULL AND "fechaInicio" IS NOT NULL;

-- 3. Eliminar columnas antiguas
ALTER TABLE tour_bus DROP COLUMN IF EXISTS costo;
ALTER TABLE tour_bus DROP COLUMN IF EXISTS paradas;
ALTER TABLE tour_bus DROP COLUMN IF EXISTS "fechaInicio";
ALTER TABLE tour_bus DROP COLUMN IF EXISTS "fechaFin";

-- 4. Agregar campo esAdulto a acompanantes_tour_bus
ALTER TABLE acompanantes_tour_bus ADD COLUMN IF NOT EXISTS "esAdulto" BOOLEAN DEFAULT true;

COMMIT;




