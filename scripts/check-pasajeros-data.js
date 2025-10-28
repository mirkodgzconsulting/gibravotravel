const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPasajerosData() {
  try {
    console.log('🔍 Verificando datos de pasajeros_biglietteria...\n');
    
    // Verificar datos usando consulta SQL directa
    const pasajeros = await prisma.$queryRaw`
      SELECT id, "nombrePasajero", servizio, "biglietteriaId"
      FROM pasajeros_biglietteria 
      LIMIT 5
    `;
    
    console.log('✅ Consulta SQL directa exitosa!');
    console.log(`📊 Pasajeros encontrados: ${pasajeros.length}`);
    
    if (pasajeros.length > 0) {
      console.log('\n📋 Primeros pasajeros:');
      pasajeros.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.nombrePasajero} - ${p.servizio} (${p.biglietteriaId})`);
      });
    }
    
    // Verificar si hay algún problema con las columnas
    console.log('\n🔍 Verificando estructura de columnas de pasajeros_biglietteria...');
    
    const pasajerosColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'pasajeros_biglietteria' 
      ORDER BY ordinal_position
    `;
    
    console.log('📋 Columnas en pasajeros_biglietteria:');
    pasajerosColumns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Verificar si hay columnas problemáticas
    const problemColumns = pasajerosColumns.filter(col => 
      col.column_name.toLowerCase().includes('existe')
    );
    
    if (problemColumns.length > 0) {
      console.log('\n❌ Columnas problemáticas encontradas:');
      problemColumns.forEach(col => {
        console.log(`  - ${col.column_name}`);
      });
    } else {
      console.log('\n✅ No se encontraron columnas problemáticas en pasajeros_biglietteria');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPasajerosData();

