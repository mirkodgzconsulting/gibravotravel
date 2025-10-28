const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testBiglietteriaQuery() {
  try {
    console.log('🔍 Probando consulta de biglietteria...\n');
    
    // Probar la consulta exacta que está fallando
    const records = await prisma.biglietteria.findMany({
      where: { isActive: true },
      include: {
        cuotas: {
          orderBy: {
            numeroCuota: 'asc'
          }
        },
        pasajeros: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('✅ Consulta exitosa!');
    console.log(`📊 Registros encontrados: ${records.length}`);
    
    if (records.length > 0) {
      console.log('\n📋 Primer registro:');
      const firstRecord = records[0];
      console.log(`  - ID: ${firstRecord.id}`);
      console.log(`  - Cliente: ${firstRecord.cliente}`);
      console.log(`  - Pasajeros: ${firstRecord.pasajeros?.length || 0}`);
      console.log(`  - Cuotas: ${firstRecord.cuotas?.length || 0}`);
    }
    
  } catch (error) {
    console.error('❌ Error en la consulta:', error.message);
    console.error('❌ Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testBiglietteriaQuery();

