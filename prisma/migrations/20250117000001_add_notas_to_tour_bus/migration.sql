-- AlterTable
-- Agregar campos de notas a la tabla tour_bus sin borrar datos existentes

ALTER TABLE "tour_bus" 
ADD COLUMN IF NOT EXISTS "notas" TEXT,
ADD COLUMN IF NOT EXISTS "notasCoordinador" TEXT;

-- Los campos son opcionales (nullable), por lo que los registros existentes tendrán NULL
-- No se requiere migración de datos ya que son campos nuevos

