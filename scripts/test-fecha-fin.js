const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFechaFin() {
  try {
    console.log('🔍 Verificando campo fechaFin en la base de datos...\n');
    
    // Verificar estructura de TourBus
    console.log('📋 Estructura de TourBus:');
    const tourBusSample = await prisma.tourBus.findFirst({
      select: {
        id: true,
        titulo: true,
        fechaViaje: true,
        fechaFin: true,
        createdAt: true
      }
    });
    
    if (tourBusSample) {
      console.log('✅ TourBus encontrado:');
      console.log('  - ID:', tourBusSample.id);
      console.log('  - Título:', tourBusSample.titulo);
      console.log('  - Fecha Viaje:', tourBusSample.fechaViaje);
      console.log('  - Fecha Fin:', tourBusSample.fechaFin);
      console.log('  - Creado:', tourBusSample.createdAt);
    } else {
      console.log('❌ No se encontraron tours de bus');
    }
    
    console.log('\n📋 Estructura de TourAereo:');
    const tourAereoSample = await prisma.tourAereo.findFirst({
      select: {
        id: true,
        titulo: true,
        fechaViaje: true,
        fechaFin: true,
        createdAt: true
      }
    });
    
    if (tourAereoSample) {
      console.log('✅ TourAereo encontrado:');
      console.log('  - ID:', tourAereoSample.id);
      console.log('  - Título:', tourAereoSample.titulo);
      console.log('  - Fecha Viaje:', tourAereoSample.fechaViaje);
      console.log('  - Fecha Fin:', tourAereoSample.fechaFin);
      console.log('  - Creado:', tourAereoSample.createdAt);
    } else {
      console.log('❌ No se encontraron tours aéreos');
    }
    
    // Contar tours con fechaFin
    const toursConFechaFin = await prisma.tourBus.count({
      where: {
        fechaFin: { not: null }
      }
    });
    
    const toursAereoConFechaFin = await prisma.tourAereo.count({
      where: {
        fechaFin: { not: null }
      }
    });
    
    console.log('\n📊 Estadísticas:');
    console.log(`  - Tours Bus con fechaFin: ${toursConFechaFin}`);
    console.log(`  - Tours Aéreo con fechaFin: ${toursAereoConFechaFin}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFechaFin();

