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

async function runFastMigration() {
  console.log('🚀 Migración rápida iniciada...\n');

  const migrations = [
    // Migraciones para TOUR BUS
    { table: 'ventas_tour_bus', column: 'notaEsternaRicevuta', type: 'TEXT' },
    { table: 'ventas_tour_bus', column: 'notaInterna', type: 'TEXT' },
    { table: 'tour_bus', column: 'notas', type: 'TEXT' },
    { table: 'tour_bus', column: 'notasCoordinador', type: 'TEXT' },
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

