-- ========================================
-- MIGRACIÓN SEGURA DE BIGLIETTERIA
-- Convierte estructura antigua a múltiples pasajeros
-- ========================================

BEGIN;

-- PASO 1: Agregar nuevas columnas a biglietteria (sin eliminar las antiguas aún)
ALTER TABLE biglietteria ADD COLUMN IF NOT EXISTS "netoPrincipal" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE biglietteria ADD COLUMN IF NOT EXISTS "vendutoTotal" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE biglietteria ADD COLUMN IF NOT EXISTS "numeroPasajeros" INTEGER DEFAULT 1;

-- PASO 2: Crear tabla de pasajeros
CREATE TABLE IF NOT EXISTS pasajeros_biglietteria (
    id TEXT PRIMARY KEY,
    "biglietteriaId" TEXT NOT NULL,
    "nombrePasajero" TEXT NOT NULL,
    servizio TEXT NOT NULL,
    andata TIMESTAMP(3),
    ritorno TIMESTAMP(3),
    "netoBiglietteria" DOUBLE PRECISION,
    "vendutoBiglietteria" DOUBLE PRECISION,
    "tieneExpress" BOOLEAN DEFAULT false,
    "netoExpress" DOUBLE PRECISION,
    "vendutoExpress" DOUBLE PRECISION,
    "tienePolizza" BOOLEAN DEFAULT false,
    "netoPolizza" DOUBLE PRECISION,
    "vendutoPolizza" DOUBLE PRECISION,
    "tieneLetteraInvito" BOOLEAN DEFAULT false,
    "netoLetteraInvito" DOUBLE PRECISION,
    "vendutoLetteraInvito" DOUBLE PRECISION,
    "tieneHotel" BOOLEAN DEFAULT false,
    "netoHotel" DOUBLE PRECISION,
    "vendutoHotel" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pasajeros_biglietteria_biglietteriaId_fkey" 
        FOREIGN KEY ("biglietteriaId") 
        REFERENCES biglietteria(id) 
        ON DELETE CASCADE
);

-- PASO 3: Migrar datos existentes
-- Por cada registro de biglietteria, crear un pasajero con los datos actuales
INSERT INTO pasajeros_biglietteria (
    id,
    "biglietteriaId",
    "nombrePasajero",
    servizio,
    andata,
    ritorno,
    "netoBiglietteria",
    "vendutoBiglietteria",
    "tieneExpress",
    "netoExpress",
    "vendutoExpress",
    "tienePolizza",
    "netoPolizza",
    "tieneLetteraInvito",
    "netoLetteraInvito",
    "tieneHotel",
    "netoHotel",
    "createdAt",
    "updatedAt"
)
SELECT 
    gen_random_uuid()::TEXT as id,
    b.id as "biglietteriaId",
    COALESCE(b.passeggero, 'Pasajero 1') as "nombrePasajero",
    COALESCE(b.servizio, '') as servizio,
    b.andata,
    b.ritorno,
    -- Si tiene biglietteria en el servicio, usar neto y venduto
    CASE 
        WHEN LOWER(b.servizio) LIKE '%biglietteria%' THEN b.neto
        ELSE NULL
    END as "netoBiglietteria",
    CASE 
        WHEN LOWER(b.servizio) LIKE '%biglietteria%' THEN b.venduto
        ELSE NULL
    END as "vendutoBiglietteria",
    -- Express
    (b.express IS NOT NULL OR LOWER(b.servizio) LIKE '%express%') as "tieneExpress",
    b.express as "netoExpress",
    b."expressVenduto" as "vendutoExpress",
    -- Polizza
    (b.polizza IS NOT NULL OR LOWER(b.servizio) LIKE '%polizza%') as "tienePolizza",
    b.polizza as "netoPolizza",
    b."polizzaVenduto" as "vendutoPolizza",
    -- Lettera di Invito
    (b."letteraInvito" IS NOT NULL OR LOWER(b.servizio) LIKE '%lettera%') as "tieneLetteraInvito",
    b."letteraInvito" as "netoLetteraInvito",
    b."letteraInvitoVenduto" as "vendutoLetteraInvito",
    -- Hotel
    (b.hotel IS NOT NULL OR LOWER(b.servizio) LIKE '%hotel%') as "tieneHotel",
    b.hotel as "netoHotel",
    b."hotelVenduto" as "vendutoHotel",
    b."createdAt",
    b."updatedAt"
FROM biglietteria b
WHERE NOT EXISTS (
    SELECT 1 FROM pasajeros_biglietteria p WHERE p."biglietteriaId" = b.id
);

-- PASO 4: Actualizar campos calculados en biglietteria
UPDATE biglietteria b
SET 
    "netoPrincipal" = COALESCE(b.neto, 0),
    "vendutoTotal" = COALESCE(b.venduto, 0),
    "numeroPasajeros" = 1
WHERE b."netoPrincipal" = 0 AND b."vendutoTotal" = 0;

-- PASO 5: Eliminar columnas antiguas que ya no se usan
ALTER TABLE biglietteria DROP COLUMN IF EXISTS passeggero;
ALTER TABLE biglietteria DROP COLUMN IF EXISTS servizio;
ALTER TABLE biglietteria DROP COLUMN IF EXISTS neto;
ALTER TABLE biglietteria DROP COLUMN IF EXISTS venduto;
ALTER TABLE biglietteria DROP COLUMN IF EXISTS andata;
ALTER TABLE biglietteria DROP COLUMN IF EXISTS ritorno;
ALTER TABLE biglietteria DROP COLUMN IF EXISTS express;
ALTER TABLE biglietteria DROP COLUMN IF EXISTS "expressVenduto";
ALTER TABLE biglietteria DROP COLUMN IF EXISTS polizza;
ALTER TABLE biglietteria DROP COLUMN IF EXISTS "polizzaVenduto";
ALTER TABLE biglietteria DROP COLUMN IF EXISTS "letteraInvito";
ALTER TABLE biglietteria DROP COLUMN IF EXISTS "letteraInvitoVenduto";
ALTER TABLE biglietteria DROP COLUMN IF EXISTS hotel;
ALTER TABLE biglietteria DROP COLUMN IF EXISTS "hotelVenduto";

COMMIT;

-- Verificar migración
SELECT 
    'Registros en biglietteria' as tabla, 
    COUNT(*) as total 
FROM biglietteria
UNION ALL
SELECT 
    'Registros en pasajeros_biglietteria' as tabla, 
    COUNT(*) as total 
FROM pasajeros_biglietteria;


