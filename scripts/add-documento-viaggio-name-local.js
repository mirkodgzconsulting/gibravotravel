const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addColumn() {
  try {
    console.log('🔍 Verificando si existe documentoViaggioName...');
    
    const exists = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tour_aereo' 
      AND column_name = 'documentoViaggioName'
    `;
    
    if (Array.isArray(exists) && exists.length > 0) {
      console.log('✅ La columna documentoViaggioName ya existe');
      return;
    }
    
    console.log('📦 Agregando columna documentoViaggioName...');
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "tour_aereo" ADD COLUMN "documentoViaggioName" TEXT`
    );
    
    console.log('✅ Columna documentoViaggioName agregada exitosamente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addColumn();

