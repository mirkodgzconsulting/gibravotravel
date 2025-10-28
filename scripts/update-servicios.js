const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * SCRIPT PARA ACTUALIZAR SERVICIOS
 * 
 * Actualiza:
 * - "lettera di invito" → "Lettera d'Invito"
 * - "biglietto" → "Biglietteria"
 */

async function updateServicios() {
  console.log('🔄 ACTUALIZANDO SERVICIOS...\n');
  
  try {
    // Mostrar servicios actuales
    console.log('📋 Servicios actuales:');
    const currentServicios = await prisma.servizio.findMany({
      orderBy: { servizio: 'asc' }
    });
    currentServicios.forEach(s => console.log(`   - ${s.servizio}`));

    // Actualizar "lettera di invito" → "Lettera d'Invito"
    console.log('\n🔄 Actualizando "lettera di invito"...');
    const letteraInvito = await prisma.servizio.findFirst({
      where: { servizio: 'lettera di invito' }
    });

    if (letteraInvito) {
      await prisma.servizio.update({
        where: { id: letteraInvito.id },
        data: { servizio: "Lettera d'Invito" }
      });
      console.log('   ✅ "lettera di invito" → "Lettera d\'Invito"');
    } else {
      console.log('   ⚠️  "lettera di invito" no encontrado');
    }

    // Actualizar "biglietto" → "Biglietteria"
    console.log('\n🔄 Actualizando "biglietto"...');
    const biglietto = await prisma.servizio.findFirst({
      where: { servizio: 'biglietto' }
    });

    if (biglietto) {
      await prisma.servizio.update({
        where: { id: biglietto.id },
        data: { servizio: 'Biglietteria' }
      });
      console.log('   ✅ "biglietto" → "Biglietteria"');
    } else {
      console.log('   ⚠️  "biglietto" no encontrado');
    }

    // Mostrar servicios finales
    console.log('\n' + '='.repeat(60));
    console.log('✅ SERVICIOS ACTUALIZADOS');
    console.log('='.repeat(60));

    const finalServicios = await prisma.servizio.findMany({
      orderBy: { servizio: 'asc' }
    });

    console.log('\n📊 SERVICIOS FINALES:');
    console.log('─'.repeat(60));
    finalServicios.forEach(s => console.log(`   ✅ ${s.servizio}`));
    console.log('─'.repeat(60));

    console.log('\n✅ ¡Servicios actualizados correctamente!');

  } catch (error) {
    console.error('\n❌ ERROR DURANTE LA ACTUALIZACIÓN:');
    console.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar actualización
updateServicios()
  .then(() => {
    console.log('\n✅ Script finalizado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script finalizado con errores');
    console.error(error);
    process.exit(1);
  });



