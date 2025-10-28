const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBiglietteriaStructure() {
  try {
    console.log('🔍 Verificando estructura de la tabla biglietteria...\n');
    
    // Obtener columnas de la tabla
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'biglietteria' 
      ORDER BY ordinal_position
    `;
    
    console.log('📋 Columnas de la tabla biglietteria:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('\n🔍 Verificando si existe la tabla pasajeros_biglietteria...');
    
    const pasajerosTable = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'pasajeros_biglietteria' 
      ORDER BY ordinal_position
    `;
    
    if (pasajerosTable.length > 0) {
      console.log('📋 Columnas de la tabla pasajeros_biglietteria:');
      pasajerosTable.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    } else {
      console.log('❌ La tabla pasajeros_biglietteria no existe');
    }
    
    console.log('\n🔍 Verificando registros existentes...');
    
    const recordCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM biglietteria`;
    console.log(`📊 Total de registros en biglietteria: ${recordCount[0].count}`);
    
    const pasajerosCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM pasajeros_biglietteria`;
    console.log(`📊 Total de registros en pasajeros_biglietteria: ${pasajerosCount[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkBiglietteriaStructure();

