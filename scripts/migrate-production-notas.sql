-- =====================================================
-- MIGRACIÓN SEGURA PARA PRODUCCIÓN
-- Agregar campos de notas sin borrar datos
-- =====================================================
-- 
-- Este script agrega los siguientes campos:
-- 1. notaEsternaRicevuta y notaInterna a ventas_tour_bus
-- 2. notas y notasCoordinador a tour_bus
--
-- IMPORTANTE: Este script NO borra ningún dato existente
-- =====================================================

BEGIN;

-- =====================================================
-- 1. Agregar campos de notas a ventas_tour_bus
-- =====================================================
DO $$ 
BEGIN
    -- Verificar si las columnas ya existen antes de agregarlas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ventas_tour_bus' 
        AND column_name = 'notaEsternaRicevuta'
    ) THEN
        ALTER TABLE "ventas_tour_bus" 
        ADD COLUMN "notaEsternaRicevuta" TEXT;
        
        RAISE NOTICE 'Columna notaEsternaRicevuta agregada a ventas_tour_bus';
    ELSE
        RAISE NOTICE 'Columna notaEsternaRicevuta ya existe en ventas_tour_bus';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ventas_tour_bus' 
        AND column_name = 'notaInterna'
    ) THEN
        ALTER TABLE "ventas_tour_bus" 
        ADD COLUMN "notaInterna" TEXT;
        
        RAISE NOTICE 'Columna notaInterna agregada a ventas_tour_bus';
    ELSE
        RAISE NOTICE 'Columna notaInterna ya existe en ventas_tour_bus';
    END IF;
END $$;

-- =====================================================
-- 2. Agregar campos de notas a tour_bus
-- =====================================================
DO $$ 
BEGIN
    -- Verificar si las columnas ya existen antes de agregarlas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tour_bus' 
        AND column_name = 'notas'
    ) THEN
        ALTER TABLE "tour_bus" 
        ADD COLUMN "notas" TEXT;
        
        RAISE NOTICE 'Columna notas agregada a tour_bus';
    ELSE
        RAISE NOTICE 'Columna notas ya existe en tour_bus';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tour_bus' 
        AND column_name = 'notasCoordinador'
    ) THEN
        ALTER TABLE "tour_bus" 
        ADD COLUMN "notasCoordinador" TEXT;
        
        RAISE NOTICE 'Columna notasCoordinador agregada a tour_bus';
    ELSE
        RAISE NOTICE 'Columna notasCoordinador ya existe en tour_bus';
    END IF;
END $$;

-- =====================================================
-- Verificación final
-- =====================================================
DO $$
DECLARE
    ventas_columns_count INTEGER;
    tour_columns_count INTEGER;
BEGIN
    -- Verificar columnas en ventas_tour_bus
    SELECT COUNT(*) INTO ventas_columns_count
    FROM information_schema.columns
    WHERE table_name = 'ventas_tour_bus'
    AND column_name IN ('notaEsternaRicevuta', 'notaInterna');
    
    -- Verificar columnas en tour_bus
    SELECT COUNT(*) INTO tour_columns_count
    FROM information_schema.columns
    WHERE table_name = 'tour_bus'
    AND column_name IN ('notas', 'notasCoordinador');
    
    IF ventas_columns_count = 2 AND tour_columns_count = 2 THEN
        RAISE NOTICE '✅ Migración completada exitosamente. Todas las columnas fueron agregadas.';
    ELSE
        RAISE WARNING '⚠️ Algunas columnas no se agregaron. ventas_tour_bus: %, tour_bus: %', 
            ventas_columns_count, tour_columns_count;
    END IF;
END $$;

COMMIT;

-- =====================================================
-- NOTAS:
-- - Todas las columnas son opcionales (nullable)
-- - Los registros existentes tendrán NULL en estos campos
-- - No se requiere migración de datos ya que son campos nuevos
-- =====================================================

