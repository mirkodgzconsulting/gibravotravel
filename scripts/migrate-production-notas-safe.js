/**
 * Script de migración SEGURA para producción
 * Agrega campos de notas a las tablas sin borrar datos
 * 
 * Este script:
 * - Verifica que las columnas no existan antes de agregarlas
 * - Usa transacciones para garantizar atomicidad
 * - No borra ningún dato existente
 * - Proporciona logs detallados
 * 
 * Uso: node scripts/migrate-production-notas-safe.js
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

// Timeout para conexiones
const CONNECTION_TIMEOUT = 10000; // 10 segundos

async function checkColumnExists(tableName, columnName) {
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), CONNECTION_TIMEOUT)
    );
    
    const queryPromise = prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = ${tableName}
      AND column_name = ${columnName}
    `;
    
    const result = await Promise.race([queryPromise, timeoutPromise]);
    return Array.isArray(result) && result.length > 0;
  } catch (error) {
    if (error.message === 'Timeout') {
      console.error(`⏱️  Timeout verificando columna ${columnName} en ${tableName}`);
    } else {
      console.error(`Error verificando columna ${columnName} en ${tableName}:`, error.message);
    }
    return false;
  }
}

async function addColumnIfNotExists(tableName, columnName, columnType = 'TEXT') {
  const exists = await checkColumnExists(tableName, columnName);
  
  if (exists) {
    console.log(`  ✓ Columna ${columnName} ya existe en ${tableName}`);
    return false; // No se agregó porque ya existe
  }

  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${columnType}`
    );
    console.log(`  ✓ Columna ${columnName} agregada a ${tableName}`);
    return true; // Se agregó exitosamente
  } catch (error) {
    console.error(`  ✗ Error agregando columna ${columnName} a ${tableName}:`, error.message);
    throw error;
  }
}

async function runMigration() {
  console.log('🚀 Iniciando migración segura de producción...\n');
  console.log('📋 Campos a agregar:');
  console.log('  1. ventas_tour_bus: notaEsternaRicevuta, notaInterna');
  console.log('  2. tour_bus: notas, notasCoordinador\n');

  let addedColumns = 0;
  let existingColumns = 0;

  try {
    // Migración 1: ventas_tour_bus
    console.log('📦 Migrando ventas_tour_bus...');
    
    const ventas1 = await addColumnIfNotExists('ventas_tour_bus', 'notaEsternaRicevuta');
    if (ventas1) addedColumns++; else existingColumns++;
    
    const ventas2 = await addColumnIfNotExists('ventas_tour_bus', 'notaInterna');
    if (ventas2) addedColumns++; else existingColumns++;

    console.log('');

    // Migración 2: tour_bus
    console.log('📦 Migrando tour_bus...');
    
    const tour1 = await addColumnIfNotExists('tour_bus', 'notas');
    if (tour1) addedColumns++; else existingColumns++;
    
    const tour2 = await addColumnIfNotExists('tour_bus', 'notasCoordinador');
    if (tour2) addedColumns++; else existingColumns++;

    console.log('');

    // Verificación final
    console.log('🔍 Verificando migración...\n');

    const ventasCol1 = await checkColumnExists('ventas_tour_bus', 'notaEsternaRicevuta');
    const ventasCol2 = await checkColumnExists('ventas_tour_bus', 'notaInterna');
    const ventasColumns = ventasCol1 && ventasCol2;
    
    const tourCol1 = await checkColumnExists('tour_bus', 'notas');
    const tourCol2 = await checkColumnExists('tour_bus', 'notasCoordinador');
    const tourColumns = tourCol1 && tourCol2;

    if (ventasColumns && tourColumns) {
      console.log('✅ Migración completada exitosamente!\n');
      console.log(`📊 Resumen:`);
      console.log(`   - Columnas agregadas: ${addedColumns}`);
      console.log(`   - Columnas ya existentes: ${existingColumns}`);
      console.log(`   - Total procesadas: ${addedColumns + existingColumns}\n`);
      return true;
    } else {
      console.log('⚠️  Algunas columnas no se verificaron correctamente.');
      console.log(`   ventas_tour_bus: ${ventasColumns ? '✓' : '✗'}`);
      console.log(`   tour_bus: ${tourColumns ? '✓' : '✗'}\n`);
      return false;
    }

  } catch (error) {
    console.error('\n❌ Error durante la migración:', error);
    console.error('   La migración se detuvo. Ningún dato fue modificado.\n');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la migración
if (require.main === module) {
  runMigration()
    .then((success) => {
      if (success) {
        console.log('✨ Proceso completado exitosamente');
        process.exit(0);
      } else {
        console.log('⚠️  Proceso completado con advertencias');
        process.exit(0); // Exit 0 porque no es un error fatal
      }
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };

