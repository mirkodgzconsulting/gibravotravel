const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMigrationStatus() {
  try {
    console.log('🔍 Verificando estado de la migración...\n');
    
    // Verificar si hay datos en pasajeros_biglietteria
    const pasajerosCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM pasajeros_biglietteria`;
    console.log(`📊 Total de pasajeros en pasajeros_biglietteria: ${pasajerosCount[0].count}`);
    
    // Verificar si hay datos en biglietteria
    const biglietteriaCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM biglietteria`;
    console.log(`📊 Total de registros en biglietteria: ${biglietteriaCount[0].count}`);
    
    // Verificar si hay algún problema con las columnas
    console.log('\n🔍 Verificando estructura de columnas...');
    
    const biglietteriaColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'biglietteria' 
      ORDER BY ordinal_position
    `;
    
    console.log('📋 Columnas en biglietteria:');
    biglietteriaColumns.forEach(col => {
      console.log(`  - ${col.column_name}`);
    });
    
    // Verificar si hay columnas problemáticas
    const problemColumns = biglietteriaColumns.filter(col => 
      col.column_name.toLowerCase().includes('passeggero') ||
      col.column_name.toLowerCase().includes('servizio') ||
      col.column_name.toLowerCase().includes('existe')
    );
    
    if (problemColumns.length > 0) {
      console.log('\n❌ Columnas problemáticas encontradas:');
      problemColumns.forEach(col => {
        console.log(`  - ${col.column_name}`);
      });
    } else {
      console.log('\n✅ No se encontraron columnas problemáticas');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkMigrationStatus();

