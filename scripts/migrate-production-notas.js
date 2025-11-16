/**
 * Script de migración para producción
 * Agrega campos de notas a las tablas sin borrar datos
 * 
 * Uso: node scripts/migrate-production-notas.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runMigration() {
  console.log('🚀 Iniciando migración de producción...\n');

  try {
    // Leer el archivo SQL de migración
    const sqlPath = path.join(__dirname, 'migrate-production-notas.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Ejecutando migración SQL...\n');

    // Ejecutar la migración SQL
    await prisma.$executeRawUnsafe(sql);

    console.log('\n✅ Migración completada exitosamente!\n');

    // Verificar que las columnas fueron agregadas
    console.log('🔍 Verificando columnas...\n');

    const ventasColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ventas_tour_bus' 
      AND column_name IN ('notaEsternaRicevuta', 'notaInterna')
    `;

    const tourColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tour_bus' 
      AND column_name IN ('notas', 'notasCoordinador')
    `;

    console.log('Columnas en ventas_tour_bus:', ventasColumns);
    console.log('Columnas en tour_bus:', tourColumns);

    if (ventasColumns.length === 2 && tourColumns.length === 2) {
      console.log('\n✅ Todas las columnas fueron agregadas correctamente!\n');
    } else {
      console.log('\n⚠️  Algunas columnas pueden no haberse agregado. Verifica manualmente.\n');
    }

  } catch (error) {
    console.error('\n❌ Error durante la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la migración
runMigration()
  .then(() => {
    console.log('✨ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });

