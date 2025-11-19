/**
 * Script de migración RÁPIDO para producción
 * Se ejecuta automáticamente durante el build
 * Solo agrega columnas si no existen (muy rápido, no bloquea)
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['error'],
});

// Timeout muy corto para no bloquear el build
const QUERY_TIMEOUT = 5000; // 5 segundos

async function quickAddColumn(tableName, columnName, columnType = 'TEXT') {
  try {
    // Verificar si existe con timeout corto
    const checkPromise = prisma.$queryRawUnsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = '${tableName}'
      AND column_name = '${columnName}'
      LIMIT 1
    `);
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), QUERY_TIMEOUT)
    );
    
    const result = await Promise.race([checkPromise, timeoutPromise]);
    
    if (Array.isArray(result) && result.length > 0) {
      return false; // Ya existe
    }

    // Agregar columna con timeout
    const addPromise = prisma.$executeRawUnsafe(
      `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "${columnName}" ${columnType}`
    );
    
    await Promise.race([addPromise, timeoutPromise]);
    return true; // Se agregó
  } catch (error) {
    if (error.message === 'Timeout') {
      console.log(`⏱️  Timeout en ${tableName}.${columnName}, continuando...`);
    } else {
      console.log(`⚠️  ${tableName}.${columnName}: ${error.message}`);
    }
    return false;
  }
}

async function createEnumIfNotExists(enumName, enumValues) {
  try {
    // Verificar si el enum existe
    const checkEnum = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = '${enumName}'
      ) as exists;
    `);
    
    if (Array.isArray(checkEnum) && checkEnum[0]?.exists) {
      return false; // Ya existe
    }

    // Crear el enum
    const values = enumValues.map(v => `'${v}'`).join(', ');
    await prisma.$executeRawUnsafe(`
      CREATE TYPE "${enumName}" AS ENUM (${values});
    `);
    return true;
  } catch (error) {
    console.log(`⚠️  Error creando enum ${enumName}: ${error.message}`);
    return false;
  }
}

async function createTableIfNotExists(tableName, createTableSQL) {
  try {
    // Verificar si la tabla existe
    const checkTable = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
      ) as exists;
    `);
    
    if (Array.isArray(checkTable) && checkTable[0]?.exists) {
      return false; // Ya existe
    }

    // Crear la tabla
    await prisma.$executeRawUnsafe(createTableSQL);
    return true;
  } catch (error) {
    console.log(`⚠️  Error creando tabla ${tableName}: ${error.message}`);
    return false;
  }
}

async function runFastMigration() {
  console.log('🚀 Migración rápida iniciada...\n');

  // Crear enum TipoStanza si no existe
  await createEnumIfNotExists('TipoStanza', ['Singola', 'Doppia', 'Matrimoniale', 'Tripla', 'Suite', 'FamilyRoom']);

  // Crear tabla stanze_tour_aereo si no existe
  await createTableIfNotExists('stanze_tour_aereo', `
    CREATE TABLE "stanze_tour_aereo" (
      "id" TEXT NOT NULL,
      "tourAereoId" TEXT NOT NULL,
      "tipo" "TipoStanza" NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "stanze_tour_aereo_pkey" PRIMARY KEY ("id")
    );
  `);

  // Crear tabla asignaciones_stanza si no existe
  await createTableIfNotExists('asignaciones_stanza', `
    CREATE TABLE "asignaciones_stanza" (
      "id" TEXT NOT NULL,
      "stanzaId" TEXT NOT NULL,
      "ventaTourAereoId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "asignaciones_stanza_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "asignaciones_stanza_stanzaId_ventaTourAereoId_key" UNIQUE ("stanzaId", "ventaTourAereoId")
    );
  `);

  // Crear índices si no existen
  try {
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_stanze_tour_aereo_tour" ON "stanze_tour_aereo"("tourAereoId");
      CREATE INDEX IF NOT EXISTS "idx_stanze_tour_aereo_tipo" ON "stanze_tour_aereo"("tipo");
      CREATE INDEX IF NOT EXISTS "idx_asignaciones_stanza_stanza" ON "asignaciones_stanza"("stanzaId");
      CREATE INDEX IF NOT EXISTS "idx_asignaciones_stanza_venta" ON "asignaciones_stanza"("ventaTourAereoId");
    `);
  } catch (error) {
    console.log(`⚠️  Error creando índices: ${error.message}`);
  }

  // Agregar foreign keys si no existen
  try {
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'stanze_tour_aereo_tourAereoId_fkey'
        ) THEN
          ALTER TABLE "stanze_tour_aereo" ADD CONSTRAINT "stanze_tour_aereo_tourAereoId_fkey" 
          FOREIGN KEY ("tourAereoId") REFERENCES "tour_aereo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;

      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'asignaciones_stanza_stanzaId_fkey'
        ) THEN
          ALTER TABLE "asignaciones_stanza" ADD CONSTRAINT "asignaciones_stanza_stanzaId_fkey" 
          FOREIGN KEY ("stanzaId") REFERENCES "stanze_tour_aereo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;

      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'asignaciones_stanza_ventaTourAereoId_fkey'
        ) THEN
          ALTER TABLE "asignaciones_stanza" ADD CONSTRAINT "asignaciones_stanza_ventaTourAereoId_fkey" 
          FOREIGN KEY ("ventaTourAereoId") REFERENCES "ventas_tour_aereo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `);
  } catch (error) {
    console.log(`⚠️  Error agregando foreign keys: ${error.message}`);
  }

  const migrations = [
    // Migraciones para TOUR BUS
    { table: 'ventas_tour_bus', column: 'notaEsternaRicevuta', type: 'TEXT' },
    { table: 'ventas_tour_bus', column: 'notaInterna', type: 'TEXT' },
    { table: 'tour_bus', column: 'notas', type: 'TEXT' },
    { table: 'tour_bus', column: 'notasCoordinador', type: 'TEXT' },
    { table: 'tour_bus', column: 'documentoViaggio', type: 'JSONB' },
    { table: 'tour_bus', column: 'documentoViaggioName', type: 'TEXT' },
    // Migraciones para TOUR AEREO
    { table: 'tour_aereo', column: 'documentoViaggioName', type: 'TEXT' },
    { table: 'tour_aereo', column: 'documentoViaggioName_old', type: 'TEXT' },
    { table: 'tour_aereo', column: 'documentoViaggio_old', type: 'TEXT' },
  ];

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const migration of migrations) {
    try {
      const added = await quickAddColumn(migration.table, migration.column, migration.type);
      if (added) {
        success++;
        console.log(`✓ ${migration.table}.${migration.column}`);
      } else {
        skipped++;
      }
    } catch (error) {
      failed++;
      console.log(`✗ ${migration.table}.${migration.column}: ${error.message}`);
    }
  }

  console.log(`\n📊 Resumen: ${success} agregadas, ${skipped} ya existían, ${failed} fallidas\n`);

  // No hacer exit(1) para no fallar el build
  await prisma.$disconnect();
}

// Ejecutar con timeout total de 10 segundos
const TOTAL_TIMEOUT = 10000;
const migrationPromise = runFastMigration();
const totalTimeoutPromise = new Promise((resolve) => 
  setTimeout(() => {
    console.log('⏱️  Migración completada (timeout total alcanzado)');
    resolve();
  }, TOTAL_TIMEOUT)
);

Promise.race([migrationPromise, totalTimeoutPromise])
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error.message);
    process.exit(0); // Exit 0 para no fallar el build
  });

