const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateVentaTourBusCreatedBy() {
  try {
    console.log('🔄 Iniciando migración de VentaTourBus createdBy...');

    // Obtener todas las ventas de tour bus
    const ventas = await prisma.ventaTourBus.findMany({
      select: {
        id: true,
        createdBy: true
      }
    });

    console.log(`📊 Encontradas ${ventas.length} ventas de tour bus`);

    let updated = 0;
    let errors = 0;

    for (const venta of ventas) {
      try {
        // Buscar el usuario por clerkId
        const user = await prisma.user.findUnique({
          where: { clerkId: venta.createdBy },
          select: { id: true, email: true }
        });

        if (user) {
          // Actualizar con el ID interno del usuario
          await prisma.ventaTourBus.update({
            where: { id: venta.id },
            data: { createdBy: user.id }
          });
          
          console.log(`✅ Venta ${venta.id}: ${venta.createdBy} → ${user.id} (${user.email})`);
          updated++;
        } else {
          console.log(`❌ Usuario no encontrado para clerkId: ${venta.createdBy}`);
          errors++;
        }
      } catch (error) {
        console.error(`❌ Error actualizando venta ${venta.id}:`, error.message);
        errors++;
      }
    }

    console.log('\n📈 Resumen de migración:');
    console.log(`✅ Actualizadas: ${updated}`);
    console.log(`❌ Errores: ${errors}`);
    console.log(`📊 Total procesadas: ${ventas.length}`);

  } catch (error) {
    console.error('❌ Error en la migración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateVentaTourBusCreatedBy();
