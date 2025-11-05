import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Renombrando servicio "biglietteria" a "volo"...');

  try {
    // Buscar el servicio "biglietteria"
    const biglietteria = await prisma.servizio.findFirst({
      where: {
        OR: [
          { servizio: 'biglietteria' },
          { servizio: 'Biglietteria' },
          { servizio: 'BIGLIETTERIA' },
        ],
      },
    });

    // Buscar el servicio "volo" existente
    const voloExistente = await prisma.servizio.findFirst({
      where: {
        OR: [
          { servizio: 'volo' },
          { servizio: 'Volo' },
          { servizio: 'VOLO' },
        ],
      },
    });

    if (biglietteria) {
      if (voloExistente) {
        // Si "volo" ya existe, eliminar "biglietteria" y asegurar que "volo" esté activo
        console.log('⚠️  El servicio "volo" ya existe. Eliminando "biglietteria"...');
        
        // Asegurar que "volo" esté activo
        await prisma.servizio.update({
          where: { id: voloExistente.id },
          data: { isActive: true },
        });
        console.log('✅ Servicio "volo" actualizado y activado');

        // Eliminar "biglietteria"
        await prisma.servizio.delete({
          where: { id: biglietteria.id },
        });
        console.log('✅ Servicio "biglietteria" eliminado');
      } else {
        // Si "volo" no existe, renombrar "biglietteria" a "volo"
        await prisma.servizio.update({
          where: { id: biglietteria.id },
          data: {
            servizio: 'volo',
            isActive: true,
          },
        });
        console.log('✅ Servicio "biglietteria" renombrado a "volo"');
      }
    } else {
      if (voloExistente) {
        // Si "biglietteria" no existe pero "volo" sí, asegurar que "volo" esté activo
        await prisma.servizio.update({
          where: { id: voloExistente.id },
          data: { isActive: true },
        });
        console.log('✅ Servicio "volo" ya existe y está activo');
      } else {
        // Si ninguno existe, crear "volo"
        await prisma.servizio.create({
          data: {
            servizio: 'volo',
            isActive: true,
          },
        });
        console.log('✅ Servicio "volo" creado');
      }
    }

    console.log('✅ Migración completada');
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Error en el script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

