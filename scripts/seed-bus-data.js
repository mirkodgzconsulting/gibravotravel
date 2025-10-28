const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos para Tour Bus...\n');

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

  let fermateCreadas = 0;
  let statiCreati = 0;

  console.log('📍 Creando Fermate...');
  // Insertar fermate
  for (const fermata of fermate) {
    try {
      const existente = await prisma.fermataBus.findUnique({
        where: { fermata }
      });

      if (!existente) {
        await prisma.fermataBus.create({
          data: { fermata }
        });
        console.log(`  ✅ Fermata creada: ${fermata}`);
        fermateCreadas++;
      } else {
        console.log(`  ⏭️  Fermata ya existe: ${fermata}`);
      }
    } catch (error) {
      console.error(`  ❌ Error creando fermata "${fermata}":`, error.message);
    }
  }

  console.log('\n🏷️  Creando Stati...');
  // Insertar stati
  for (const stato of stati) {
    try {
      const existente = await prisma.statoBus.findUnique({
        where: { stato }
      });

      if (!existente) {
        await prisma.statoBus.create({
          data: { stato }
        });
        console.log(`  ✅ Stato creado: ${stato}`);
        statiCreati++;
      } else {
        console.log(`  ⏭️  Stato ya existe: ${stato}`);
      }
    } catch (error) {
      console.error(`  ❌ Error creando stato "${stato}":`, error.message);
    }
  }

  console.log('\n✨ Resumen:');
  console.log(`  📍 Fermate creadas: ${fermateCreadas}/${fermate.length}`);
  console.log(`  🏷️  Stati creati: ${statiCreati}/${stati.length}`);
  console.log('\n🎉 ¡Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('\n❌ Error ejecutando seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });




