import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando datos iniciales para Acquisto...');

  // Datos iniciales de Acquisto
  const acquisti = [
    'Paypal',
    '0571',
    '3016',
    'bonifico',
    'Revolut Anthony',
    'Revolut Katia',
    'Revolut Dante',
    'Revolut Rocio',
    'Revolut GB',
  ];

  for (const acquisto of acquisti) {
    try {
      // Usar upsert para evitar duplicados
      await prisma.acquisto.upsert({
        where: { acquisto },
        update: {
          isActive: true, // Asegurar que esté activo
        },
        create: {
          acquisto,
          isActive: true,
        },
      });
      console.log(`✅ Acquisto "${acquisto}" creado/actualizado`);
    } catch (error) {
      console.error(`❌ Error al crear acquisto "${acquisto}":`, error);
    }
  }

  console.log('✅ Sembrado de Acquisto completado');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
