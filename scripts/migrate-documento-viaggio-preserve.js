/**
 * Script de migración para preservar documentoViaggioName
 * Este script migra los datos de documentoViaggioName a documentoViaggioName_old
 * antes de que Prisma intente eliminar la columna
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

async function migrateDocumentoViaggioName() {
  console.log('🔄 Migrando documentoViaggioName...\n');

  try {
    // Verificar si existe la columna documentoViaggioName con timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), CONNECTION_TIMEOUT)
    );
    
    const queryPromise = prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'tour_aereo'
      AND column_name = 'documentoViaggioName'
    `;
    
    const columnExists = await Promise.race([queryPromise, timeoutPromise]);

    if (!Array.isArray(columnExists) || columnExists.length === 0) {
      console.log('✓ Columna documentoViaggioName no existe, saltando migración');
      return;
    }

    // Verificar si existe documentoViaggioName_old con timeout
    const oldTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), CONNECTION_TIMEOUT)
    );
    
    const oldQueryPromise = prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'tour_aereo'
      AND column_name = 'documentoViaggioName_old'
    `;
    
    const oldColumnExists = await Promise.race([oldQueryPromise, oldTimeoutPromise]);

    if (!Array.isArray(oldColumnExists) || oldColumnExists.length === 0) {
      // Crear la columna _old si no existe
      console.log('📦 Creando columna documentoViaggioName_old...');
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "tour_aereo" ADD COLUMN IF NOT EXISTS "documentoViaggioName_old" TEXT`
      );
    }

    // Migrar datos de documentoViaggioName a documentoViaggioName_old
    console.log('📦 Migrando datos de documentoViaggioName a documentoViaggioName_old...');
    const result = await prisma.$executeRawUnsafe(`
      UPDATE "tour_aereo" 
      SET "documentoViaggioName_old" = "documentoViaggioName"
      WHERE "documentoViaggioName" IS NOT NULL 
      AND "documentoViaggioName_old" IS NULL
    `);

    console.log(`✓ Datos migrados exitosamente\n`);

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la migración
if (require.main === module) {
  migrateDocumentoViaggioName()
    .then(() => {
      console.log('✨ Migración completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { migrateDocumentoViaggioName };

