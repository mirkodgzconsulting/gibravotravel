import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Renombrando servicio "Lettera d\'Invito" a "L.invito"...');

  try {
    // Buscar el servicio "Lettera d'Invito" (con diferentes variaciones)
    const letteraInvito = await prisma.servizio.findFirst({
      where: {
        OR: [
          { servizio: 'Lettera d\'Invito' },
          { servizio: 'Lettera d\'Invito' },
          { servizio: 'LETTERA D\'INVITO' },
          { servizio: 'lettera d\'invito' },
          { servizio: 'Lettera di Invito' },
          { servizio: 'LETTERA DI INVITO' },
        ],
      },
    });

    // Buscar el servicio "L.invito" existente
    const linvitoExistente = await prisma.servizio.findFirst({
      where: {
        OR: [
          { servizio: 'L.invito' },
          { servizio: 'L.INVITO' },
          { servizio: 'l.invito' },
        ],
      },
    });

    if (letteraInvito) {
      if (linvitoExistente) {
        // Si "L.invito" ya existe, desactivar "Lettera d'Invito" (soft delete) y asegurar que "L.invito" esté activo
        console.log('⚠️  El servicio "L.invito" ya existe. Desactivando "Lettera d\'Invito"...');
        
        // Asegurar que "L.invito" esté activo
        await prisma.servizio.update({
          where: { id: linvitoExistente.id },
          data: { isActive: true },
        });
        console.log('✅ Servicio "L.invito" actualizado y activado');

        // Desactivar "Lettera d'Invito" (soft delete, no se elimina)
        await prisma.servizio.update({
          where: { id: letteraInvito.id },
          data: { isActive: false },
        });
        console.log('✅ Servicio "Lettera d\'Invito" desactivado (no eliminado)');
      } else {
        // Si "L.invito" no existe, renombrar "Lettera d'Invito" a "L.invito"
        await prisma.servizio.update({
          where: { id: letteraInvito.id },
          data: {
            servizio: 'L.invito',
            isActive: true,
          },
        });
        console.log('✅ Servicio "Lettera d\'Invito" renombrado a "L.invito"');
      }
    } else {
      if (linvitoExistente) {
        // Si "Lettera d'Invito" no existe pero "L.invito" sí, asegurar que "L.invito" esté activo
        await prisma.servizio.update({
          where: { id: linvitoExistente.id },
          data: { isActive: true },
        });
        console.log('✅ Servicio "L.invito" ya existe y está activo');
      } else {
        // Si ninguno existe, crear "L.invito"
        await prisma.servizio.create({
          data: {
            servizio: 'L.invito',
            isActive: true,
          },
        });
        console.log('✅ Servicio "L.invito" creado');
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

