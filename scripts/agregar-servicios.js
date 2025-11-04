const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

/**
 * SCRIPT PARA AGREGAR NUEVOS SERVICIOS
 * 
 * Agrega los siguientes servicios a la tabla "servizio":
 * - Volo
 * - Corriere
 * - Fideiussione
 * - Etias
 * - Esta
 * - Eta
 * - Caf
 * - Transfer
 * - Bus
 * - Tkt
 */

async function agregarServicios() {
  console.log('🔄 AGREGANDO NUEVOS SERVICIOS...\n');
  
  try {
    // Mostrar servicios actuales
    console.log('📋 Servicios actuales:');
    const currentServicios = await prisma.servizio.findMany({
      orderBy: { servizio: 'asc' }
    });
    currentServicios.forEach(s => console.log(`   - ${s.servizio} (${s.isActive ? 'activo' : 'inactivo'})`));
    console.log(`\n   Total: ${currentServicios.length} servicios\n`);

    // Nuevos servicios a agregar
    const nuevosServicios = [
      'Volo',
      'Corriere',
      'Fideiussione',
      'Etias',
      'Esta',
      'Eta',
      'Caf',
      'Transfer',
      'Bus',
      'Tkt'
    ];

    console.log('➕ Agregando nuevos servicios...');
    let agregados = 0;
    let yaExistentes = 0;

    for (const servicio of nuevosServicios) {
      try {
        const resultado = await prisma.servizio.upsert({
          where: { servizio: servicio },
          update: {
            // Si ya existe, solo actualizamos isActive a true
            isActive: true
          },
          create: {
            servizio: servicio,
            isActive: true
          }
        });

        // Verificar si era nuevo o existente
        const existia = currentServicios.some(s => 
          s.servizio.toLowerCase() === servicio.toLowerCase()
        );

        if (existia) {
          console.log(`   ⚠️  "${servicio}" ya existía (activado)`);
          yaExistentes++;
        } else {
          console.log(`   ✅ "${servicio}" agregado`);
          agregados++;
        }
      } catch (error) {
        console.error(`   ❌ Error al agregar "${servicio}":`, error.message);
      }
    }

    // Mostrar servicios finales
    console.log('\n' + '='.repeat(60));
    console.log('✅ PROCESO COMPLETADO');
    console.log('='.repeat(60));
    console.log(`   📊 Nuevos servicios agregados: ${agregados}`);
    console.log(`   📊 Servicios ya existentes: ${yaExistentes}`);
    console.log(`   📊 Total de nuevos servicios procesados: ${nuevosServicios.length}\n`);

    const finalServicios = await prisma.servizio.findMany({
      where: { isActive: true },
      orderBy: { servizio: 'asc' }
    });

    console.log('📋 Servicios finales (activos):');
    console.log('─'.repeat(60));
    finalServicios.forEach(s => console.log(`   - ${s.servizio}`));
    console.log(`\n   Total: ${finalServicios.length} servicios activos`);

  } catch (error) {
    console.error('❌ Error durante el proceso:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
agregarServicios()
  .then(() => {
    console.log('\n✅ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error en el script:', error);
    process.exit(1);
  });

