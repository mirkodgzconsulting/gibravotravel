-- CreateEnum (solo si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TipoStanza') THEN
        CREATE TYPE "TipoStanza" AS ENUM ('Singola', 'Doppia', 'Matrimoniale', 'Tripla', 'Suite', 'FamilyRoom');
    END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "stanze_tour_aereo" (
    "id" TEXT NOT NULL,
    "tourAereoId" TEXT NOT NULL,
    "tipo" "TipoStanza" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stanze_tour_aereo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "asignaciones_stanza" (
    "id" TEXT NOT NULL,
    "stanzaId" TEXT NOT NULL,
    "ventaTourAereoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asignaciones_stanza_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_stanze_tour_aereo_tour" ON "stanze_tour_aereo"("tourAereoId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_stanze_tour_aereo_tipo" ON "stanze_tour_aereo"("tipo");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_asignaciones_stanza_stanza" ON "asignaciones_stanza"("stanzaId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_asignaciones_stanza_venta" ON "asignaciones_stanza"("ventaTourAereoId");

-- CreateUniqueIndex
CREATE UNIQUE INDEX IF NOT EXISTS "asignaciones_stanza_stanzaId_ventaTourAereoId_key" ON "asignaciones_stanza"("stanzaId", "ventaTourAereoId");

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'stanze_tour_aereo_tourAereoId_fkey'
    ) THEN
        ALTER TABLE "stanze_tour_aereo" ADD CONSTRAINT "stanze_tour_aereo_tourAereoId_fkey" 
        FOREIGN KEY ("tourAereoId") REFERENCES "tour_aereo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'asignaciones_stanza_stanzaId_fkey'
    ) THEN
        ALTER TABLE "asignaciones_stanza" ADD CONSTRAINT "asignaciones_stanza_stanzaId_fkey" 
        FOREIGN KEY ("stanzaId") REFERENCES "stanze_tour_aereo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'asignaciones_stanza_ventaTourAereoId_fkey'
    ) THEN
        ALTER TABLE "asignaciones_stanza" ADD CONSTRAINT "asignaciones_stanza_ventaTourAereoId_fkey" 
        FOREIGN KEY ("ventaTourAereoId") REFERENCES "ventas_tour_aereo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

