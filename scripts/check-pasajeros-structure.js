const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPasajerosStructure() {
  try {
    console.log('🔍 Verificando estructura de la tabla pasajeros_biglietteria...\n');
    
    // Obtener columnas de la tabla
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'pasajeros_biglietteria' 
      ORDER BY ordinal_position
    `;
    
    console.log('📋 Columnas de la tabla pasajeros_biglietteria:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('\n🔍 Verificando si hay alguna columna problemática...');
    
    // Buscar columnas que contengan 'existe'
    const problemColumns = columns.filter(col => 
      col.column_name.toLowerCase().includes('existe')
    );
    
    if (problemColumns.length > 0) {
      console.log('❌ Columnas problemáticas encontradas:');
      problemColumns.forEach(col => {
        console.log(`  - ${col.column_name}`);
      });
    } else {
      console.log('✅ No se encontraron columnas problemáticas');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPasajerosStructure();

