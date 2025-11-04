const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

/**
 * SCRIPT PARA AGREGAR NUEVOS IATAs
 * 
 * Agrega los siguientes IATAs a la tabla "iata":
 * - Shop online
 * - Safer
 * - Dhl
 * - Tbo
 * - Jump Travel
 * - GetYourGuide
 * - Civitatis
 * - Dinamico kkm
 * - Booking hotel
 */

async function agregarIatas() {
  console.log('🔄 AGREGANDO NUEVOS IATAs...\n');
  
  try {
    // Mostrar IATAs actuales
    console.log('📋 IATAs actuales:');
    const currentIatas = await prisma.iata.findMany({
      orderBy: { iata: 'asc' }
    });
    currentIatas.forEach(i => console.log(`   - ${i.iata} (${i.isActive ? 'activo' : 'inactivo'})`));
    console.log(`\n   Total: ${currentIatas.length} IATAs\n`);

    // Nuevos IATAs a agregar
    const nuevosIatas = [
      'Shop online',
      'Safer',
      'Dhl',
      'Tbo',
      'Jump Travel',
      'GetYourGuide',
      'Civitatis',
      'Dinamico kkm',
      'Booking hotel'
    ];

    console.log('➕ Agregando nuevos IATAs...');
    let agregados = 0;
    let yaExistentes = 0;

    for (const iata of nuevosIatas) {
      try {
        const resultado = await prisma.iata.upsert({
          where: { iata: iata },
          update: {
            // Si ya existe, solo actualizamos isActive a true
            isActive: true
          },
          create: {
            iata: iata,
            isActive: true
          }
        });

        // Verificar si era nuevo o existente
        const existia = currentIatas.some(i => 
          i.iata.toLowerCase() === iata.toLowerCase()
        );

        if (existia) {
          console.log(`   ⚠️  "${iata}" ya existía (activado)`);
          yaExistentes++;
        } else {
          console.log(`   ✅ "${iata}" agregado`);
          agregados++;
        }
      } catch (error) {
        console.error(`   ❌ Error al agregar "${iata}":`, error.message);
      }
    }

    // Mostrar IATAs finales
    console.log('\n' + '='.repeat(60));
    console.log('✅ PROCESO COMPLETADO');
    console.log('='.repeat(60));
    console.log(`   📊 Nuevos IATAs agregados: ${agregados}`);
    console.log(`   📊 IATAs ya existentes: ${yaExistentes}`);
    console.log(`   📊 Total de nuevos IATAs procesados: ${nuevosIatas.length}\n`);

    const finalIatas = await prisma.iata.findMany({
      where: { isActive: true },
      orderBy: { iata: 'asc' }
    });

    console.log('📋 IATAs finales (activos):');
    console.log('─'.repeat(60));
    finalIatas.forEach(i => console.log(`   - ${i.iata}`));
    console.log(`\n   Total: ${finalIatas.length} IATAs activos`);

  } catch (error) {
    console.error('❌ Error durante el proceso:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
agregarIatas()
  .then(() => {
    console.log('\n✅ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error en el script:', error);
    process.exit(1);
  });

