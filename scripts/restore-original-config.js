const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * SCRIPT PARA RESTAURAR CONFIGURACIÓN ORIGINAL
 * 
 * Este script restaura los datos de configuración exactamente como estaban
 * antes de que se borraran, basándose en los archivos de seed originales.
 */

async function restoreOriginalConfig() {
  console.log('🔄 RESTAURANDO CONFIGURACIÓN ORIGINAL...\n');
  
  try {
    // ========================================
    // LIMPIAR DATOS ACTUALES DE CONFIGURACIÓN
    // ========================================
    console.log('🧹 Limpiando configuración actual...');
    await prisma.metodoPagamento.deleteMany();
    await prisma.iata.deleteMany();
    await prisma.servizio.deleteMany();
    await prisma.fermataBus.deleteMany();
    await prisma.statoBus.deleteMany();
    await prisma.pagamento.deleteMany();
    console.log('   ✅ Configuración actual eliminada\n');

    // ========================================
    // RESTAURAR PAGAMENTO (Estados de pago)
    // ========================================
    console.log('💰 Restaurando estados de pago (Pagamento)...');
    const pagamentiData = [
      'acconto',
      'acconto ricevuto',
      'verificare',
      'ricevuto',
      'da pagare'
    ];

    for (const pagamento of pagamentiData) {
      await prisma.pagamento.create({
        data: { pagamento }
      });
      console.log(`   ✅ ${pagamento}`);
    }

    // ========================================
    // RESTAURAR IATA (Códigos IATA)
    // ========================================
    console.log('\n✈️  Restaurando códigos IATA...');
    const iataData = [
      'suema',
      'ryan air',
      'flight genius',
      'kkm',
      'safer',
      'booking'
    ];

    for (const iata of iataData) {
      await prisma.iata.create({
        data: { iata }
      });
      console.log(`   ✅ ${iata}`);
    }

    // ========================================
    // RESTAURAR SERVIZIO (Servicios)
    // ========================================
    console.log('\n🎫 Restaurando servicios...');
    const serviziData = [
      'biglietto',
      'express',
      'hotel',
      'bagaglio',
      'cambio data',
      'polizza',
      'lettera di invito'
    ];

    for (const servizio of serviziData) {
      await prisma.servizio.create({
        data: { servizio }
      });
      console.log(`   ✅ ${servizio}`);
    }

    // ========================================
    // RESTAURAR METODO PAGAMENTO (Métodos de pago)
    // ========================================
    console.log('\n💳 Restaurando métodos de pago...');
    const metodiPagamentoData = [
      'cash',
      'PostePay',
      'bonifico',
      'POS',
      'Western',
      'RIA'
    ];

    for (const metodoPagamento of metodiPagamentoData) {
      await prisma.metodoPagamento.create({
        data: { metodoPagamento }
      });
      console.log(`   ✅ ${metodoPagamento}`);
    }

    // ========================================
    // RESTAURAR FERMATA BUS (Paradas de bus)
    // ========================================
    console.log('\n🚏 Restaurando paradas de bus...');
    const fermateData = [
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
      'Monza'
    ];

    for (const fermata of fermateData) {
      await prisma.fermataBus.create({
        data: { fermata }
      });
      console.log(`   ✅ ${fermata}`);
    }

    // ========================================
    // RESTAURAR STATO BUS (Estados de bus)
    // ========================================
    console.log('\n📊 Restaurando estados de bus...');
    const statiData = [
      'Libre',
      'Pagado',
      'Acconto',
      'Prenotato'
    ];

    for (const stato of statiData) {
      await prisma.statoBus.create({
        data: { stato }
      });
      console.log(`   ✅ ${stato}`);
    }

    // ========================================
    // RESUMEN FINAL
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ CONFIGURACIÓN ORIGINAL RESTAURADA');
    console.log('='.repeat(60));

    const stats = {
      pagamenti: await prisma.pagamento.count(),
      iatas: await prisma.iata.count(),
      servicios: await prisma.servizio.count(),
      metodosPagamento: await prisma.metodoPagamento.count(),
      fermate: await prisma.fermataBus.count(),
      stati: await prisma.statoBus.count(),
    };

    console.log('\n📊 RESUMEN DE CONFIGURACIÓN RESTAURADA:');
    console.log('─'.repeat(60));
    console.log(`💰 Estados de pago:        ${stats.pagamenti}`);
    console.log(`   - acconto, acconto ricevuto, verificare, ricevuto, da pagare`);
    console.log(`\n✈️  Códigos IATA:           ${stats.iatas}`);
    console.log(`   - suema, ryan air, flight genius, kkm, safer, booking`);
    console.log(`\n🎫 Servicios:              ${stats.servicios}`);
    console.log(`   - biglietto, express, hotel, bagaglio, cambio data, polizza, lettera di invito`);
    console.log(`\n💳 Métodos de pago:        ${stats.metodosPagamento}`);
    console.log(`   - cash, PostePay, bonifico, POS, Western, RIA`);
    console.log(`\n🚏 Paradas de bus:         ${stats.fermate}`);
    console.log(`   - Lambrate Stazione, Cologno Centro, Trezzo Sull'ada, etc.`);
    console.log(`\n📊 Estados de bus:         ${stats.stati}`);
    console.log(`   - Libre, Pagado, Acconto, Prenotato`);
    console.log('─'.repeat(60));

    console.log('\n✅ ¡Configuración restaurada exitosamente!');
    console.log('   Tus datos de configuración están exactamente como estaban antes.');

  } catch (error) {
    console.error('\n❌ ERROR DURANTE LA RESTAURACIÓN:');
    console.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar restauración
restoreOriginalConfig()
  .then(() => {
    console.log('\n✅ Script finalizado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script finalizado con errores');
    console.error(error);
    process.exit(1);
  });



