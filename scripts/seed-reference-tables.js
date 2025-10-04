const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function seedReferenceTables() {
  try {
    console.log('🌱 Iniciando seed de tablas de referencia...');

    // Datos para tabla Pagamento
    const pagamentiData = [
      'acconto',
      'acconto ricevuto', 
      'verificare',
      'ricevuto',
      'da pagare'
    ];

    // Datos para tabla Iata
    const iataData = [
      'suema',
      'ryan air',
      'flight genius',
      'kkm',
      'safer',
      'booking'
    ];

    // Datos para tabla Servizio
    const serviziData = [
      'biglietto',
      'express',
      'hotel',
      'bagaglio',
      'cambio data',
      'polizza',
      'lettera di invito'
    ];

    // Datos para tabla MetodoPagamento
    const metodiPagamentoData = [
      'cash',
      'PostePay',
      'bonifico',
      'POS',
      'Western',
      'RIA'
    ];

    // Datos para tabla Origine
    const originiData = [
      'WhatsApp',
      'Facebook',
      'Cliente',
      'Passaparola'
    ];

    console.log('📝 Insertando datos en tabla Pagamento...');
    for (const pagamento of pagamentiData) {
      await prisma.pagamento.upsert({
        where: { pagamento },
        update: {},
        create: { pagamento }
      });
    }

    console.log('📝 Insertando datos en tabla Iata...');
    for (const iata of iataData) {
      await prisma.iata.upsert({
        where: { iata },
        update: {},
        create: { iata }
      });
    }

    console.log('📝 Insertando datos en tabla Servizio...');
    for (const servizio of serviziData) {
      await prisma.servizio.upsert({
        where: { servizio },
        update: {},
        create: { servizio }
      });
    }

    console.log('📝 Insertando datos en tabla MetodoPagamento...');
    for (const metodoPagamento of metodiPagamentoData) {
      await prisma.metodoPagamento.upsert({
        where: { metodoPagamento },
        update: {},
        create: { metodoPagamento }
      });
    }

    console.log('📝 Insertando datos en tabla Origine...');
    for (const origine of originiData) {
      await prisma.origine.upsert({
        where: { origine },
        update: {},
        create: { origine }
      });
    }

    // Verificar los datos insertados
    console.log('✅ Verificando datos insertados...');
    
    const pagamenti = await prisma.pagamento.findMany();
    const iata = await prisma.iata.findMany();
    const servizi = await prisma.servizio.findMany();
    const metodiPagamento = await prisma.metodoPagamento.findMany();
    const origini = await prisma.origine.findMany();

    console.log(`📊 Resumen de datos insertados:`);
    console.log(`   - Pagamento: ${pagamenti.length} registros`);
    console.log(`   - Iata: ${iata.length} registros`);
    console.log(`   - Servizio: ${servizi.length} registros`);
    console.log(`   - MetodoPagamento: ${metodiPagamento.length} registros`);
    console.log(`   - Origine: ${origini.length} registros`);

    console.log('🎉 Seed completado exitosamente!');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el seed
seedReferenceTables()
  .then(() => {
    console.log('✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en el script:', error);
    process.exit(1);
  });
