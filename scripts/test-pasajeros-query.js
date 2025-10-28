const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPasajerosQuery() {
  try {
    console.log('🔍 Probando consulta directa a pasajeros_biglietteria...\n');
    
    // Probar consulta directa a la tabla pasajeros_biglietteria
    const pasajeros = await prisma.pasajeroBiglietteria.findMany({
      take: 5
    });
    
    console.log('✅ Consulta directa a pasajeros exitosa!');
    console.log(`📊 Pasajeros encontrados: ${pasajeros.length}`);
    
    if (pasajeros.length > 0) {
      console.log('\n📋 Primer pasajero:');
      const firstPasajero = pasajeros[0];
      console.log(`  - ID: ${firstPasajero.id}`);
      console.log(`  - Nombre: ${firstPasajero.nombrePasajero}`);
      console.log(`  - Servicio: ${firstPasajero.servizio}`);
    }
    
  } catch (error) {
    console.error('❌ Error en la consulta directa a pasajeros:', error.message);
  }
  
  try {
    console.log('\n🔍 Probando consulta con relación desde pasajeros...\n');
    
    // Probar consulta con relación desde pasajeros
    const pasajeros = await prisma.pasajeroBiglietteria.findMany({
      include: {
        biglietteria: true
      },
      take: 5
    });
    
    console.log('✅ Consulta con relación desde pasajeros exitosa!');
    console.log(`📊 Pasajeros encontrados: ${pasajeros.length}`);
    
  } catch (error) {
    console.error('❌ Error en la consulta con relación desde pasajeros:', error.message);
  }
  
  try {
    console.log('\n🔍 Probando consulta con relación desde biglietteria...\n');
    
    // Probar consulta con relación desde biglietteria
    const records = await prisma.biglietteria.findMany({
      include: {
        pasajeros: true
      },
      take: 5
    });
    
    console.log('✅ Consulta con relación desde biglietteria exitosa!');
    console.log(`📊 Registros encontrados: ${records.length}`);
    
  } catch (error) {
    console.error('❌ Error en la consulta con relación desde biglietteria:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPasajerosQuery();

