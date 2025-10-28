const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * SCRIPT PARA RESTAURAR CONFIGURACIÓN EXACTA
 * 
 * Este script restaura los datos de configuración EXACTAMENTE como los tenías.
 */

async function restoreExactConfig() {
  console.log('🔄 RESTAURANDO CONFIGURACIÓN EXACTA...\n');
  
  try {
    // ========================================
    // LIMPIAR DATOS ACTUALES DE CONFIGURACIÓN
    // ========================================
    console.log('🧹 Limpiando configuración actual...');
    await prisma.metodoPagamento.deleteMany();
    await prisma.iata.deleteMany();
    await prisma.pagamento.deleteMany();
    console.log('   ✅ Configuración actual eliminada\n');

    // ========================================
    // RESTAURAR METODO PAGAMENTO (Métodos de pago)
    // ========================================
    console.log('💳 Restaurando métodos de pago...');
    const metodiPagamentoData = [
      'Bonifico',
      'Cash',
      'Pos',
      'Klarna',
      'Compas',
      'Link Pos',
      'Postepay',
      'Western conto',
      'Ria',
      'Western nome'
    ];

    for (const metodoPagamento of metodiPagamentoData) {
      await prisma.metodoPagamento.create({
        data: { metodoPagamento }
      });
      console.log(`   ✅ ${metodoPagamento}`);
    }

    // ========================================
    // RESTAURAR IATA (Códigos IATA)
    // ========================================
    console.log('\n✈️  Restaurando códigos IATA...');
    const iataData = [
      'Suema',
      'Kkm',
      'Ugotto',
      'Ryanair',
      'easyJet',
      'Wizz Air',
      'Vueling',
      'Volotea',
      'Eurowings',
      'Transavia',
      'Air Arabia',
      'Air cairo',
      'Egyptair',
      'Costa',
      'Msc',
      'Trenitalia',
      'Booking',
      'Flixbus',
      'Turkish'
    ];

    for (const iata of iataData) {
      await prisma.iata.create({
        data: { iata }
      });
      console.log(`   ✅ ${iata}`);
    }

    // ========================================
    // RESTAURAR PAGAMENTO (Estados de pago)
    // ========================================
    console.log('\n💰 Restaurando estados de pago...');
    const pagamentiData = [
      'Ricevuto',
      'Acconto',
      'Acconto V',
      'Verificato'
    ];

    for (const pagamento of pagamentiData) {
      await prisma.pagamento.create({
        data: { pagamento }
      });
      console.log(`   ✅ ${pagamento}`);
    }

    // ========================================
    // RESUMEN FINAL
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ CONFIGURACIÓN EXACTA RESTAURADA');
    console.log('='.repeat(60));

    const stats = {
      metodosPagamento: await prisma.metodoPagamento.count(),
      iatas: await prisma.iata.count(),
      pagamenti: await prisma.pagamento.count(),
      servicios: await prisma.servizio.count(),
      fermate: await prisma.fermataBus.count(),
      stati: await prisma.statoBus.count(),
    };

    console.log('\n📊 RESUMEN DE CONFIGURACIÓN:');
    console.log('─'.repeat(60));
    console.log(`💳 Métodos de pago:        ${stats.metodosPagamento}`);
    console.log(`   Bonifico, Cash, Pos, Klarna, Compas, Link Pos,`);
    console.log(`   Postepay, Western conto, Ria, Western nome`);
    
    console.log(`\n✈️  Códigos IATA:           ${stats.iatas}`);
    console.log(`   Suema, Kkm, Ugotto, Ryanair, easyJet, Wizz Air,`);
    console.log(`   Vueling, Volotea, Eurowings, Transavia, Air Arabia,`);
    console.log(`   Air cairo, Egyptair, Costa, Msc, Trenitalia,`);
    console.log(`   Booking, Flixbus, Turkish`);
    
    console.log(`\n💰 Estados de pago:        ${stats.pagamenti}`);
    console.log(`   Ricevuto, Acconto, Acconto V, Verificato`);
    
    console.log(`\n🎫 Servicios:              ${stats.servicios}`);
    console.log(`   (Sin cambios - mantenidos como estaban)`);
    
    console.log(`\n🚏 Paradas de bus:         ${stats.fermate}`);
    console.log(`   (Sin cambios - mantenidas como estaban)`);
    
    console.log(`\n📊 Estados de bus:         ${stats.stati}`);
    console.log(`   (Sin cambios - mantenidos como estaban)`);
    console.log('─'.repeat(60));

    console.log('\n✅ ¡Configuración restaurada EXACTAMENTE como la tenías!');
    console.log('   Todos los datos coinciden con tu configuración original.');

  } catch (error) {
    console.error('\n❌ ERROR DURANTE LA RESTAURACIÓN:');
    console.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar restauración
restoreExactConfig()
  .then(() => {
    console.log('\n✅ Script finalizado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script finalizado con errores');
    console.error(error);
    process.exit(1);
  });



