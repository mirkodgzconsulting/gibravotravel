import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando datos iniciales para fermataBus y statoBus...');

  // Fermate iniciales
  const fermate = [
    'Lambrate Stazione',
    'Cologno Centro',
    "Trezzo Sull'ada",
    'Agrate Brianza',
    'Bergamo Piazzale Malpensata',
    'Bergamo 2 Persone Automunite',
    'Brescia',
    'Peschiera del Garda',
    'Trento Uscita TrentoSud',
    'Rovato',
    'Vicenza',
    'Lomazzo',
    'Monza',
  ];

  // Stati iniciales
  const stati = [
    'Libre',
    'Pagado',
    'Acconto',
    'Prenotato',
  ];

  // Insertar fermate
  for (const fermata of fermate) {
    const existente = await prisma.fermataBus.findUnique({
      where: { fermata }
    });

    if (!existente) {
      await prisma.fermataBus.create({
        data: { fermata }
      });
      console.log(`✅ Fermata creada: ${fermata}`);
    } else {
      console.log(`⏭️  Fermata ya existe: ${fermata}`);
    }
  }

  // Insertar stati
  for (const stato of stati) {
    const existente = await prisma.statoBus.findUnique({
      where: { stato }
    });

    if (!existente) {
      await prisma.statoBus.create({
        data: { stato }
      });
      console.log(`✅ Stato creado: ${stato}`);
    } else {
      console.log(`⏭️  Stato ya existe: ${stato}`);
    }
  }

  console.log('✨ Datos iniciales sembrados exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error sembrando datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });




