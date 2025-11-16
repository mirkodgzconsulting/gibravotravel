-- Migración para convertir documentoViaggio a JSON (array de archivos)
-- Preserva TODOS los datos existentes convirtiendo el archivo único a un array

-- Paso 1: Agregar columna temporal para el JSON
ALTER TABLE "tour_aereo" ADD COLUMN IF NOT EXISTS "documentoViaggio_json" JSONB;

-- Paso 2: Migrar datos existentes: convertir archivo único a array JSON
-- Si existe documentoViaggio, crear array con un elemento (PRESERVA EL DATO)
UPDATE "tour_aereo"
SET "documentoViaggio_json" = jsonb_build_array(
  jsonb_build_object(
    'url', "documentoViaggio",
    'name', COALESCE("documentoViaggioName", 'documento')
  )
)
WHERE "documentoViaggio" IS NOT NULL;

-- Paso 3: Si no hay documentoViaggio, dejar como null (NO BORRA NADA)
UPDATE "tour_aereo"
SET "documentoViaggio_json" = NULL
WHERE "documentoViaggio" IS NULL;

-- Paso 4: Renombrar la nueva columna (ANTES de eliminar las antiguas)
ALTER TABLE "tour_aereo" RENAME COLUMN "documentoViaggio" TO "documentoViaggio_old";
ALTER TABLE "tour_aereo" RENAME COLUMN "documentoViaggioName" TO "documentoViaggioName_old";
ALTER TABLE "tour_aereo" RENAME COLUMN "documentoViaggio_json" TO "documentoViaggio";

-- NOTA: Las columnas antiguas (documentoViaggio_old y documentoViaggioName_old) 
-- se mantienen como respaldo. Se pueden eliminar manualmente después de verificar
-- que la migración funcionó correctamente.

