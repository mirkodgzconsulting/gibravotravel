-- AlterTable
-- Agregar campos de notas a la tabla ventas_tour_bus sin borrar datos existentes

ALTER TABLE "ventas_tour_bus" 
ADD COLUMN IF NOT EXISTS "notaEsternaRicevuta" TEXT,
ADD COLUMN IF NOT EXISTS "notaInterna" TEXT;

-- Los campos son opcionales (nullable), por lo que los registros existentes tendrán NULL
-- No se requiere migración de datos ya que son campos nuevos

