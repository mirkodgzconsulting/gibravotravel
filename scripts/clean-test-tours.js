const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * SCRIPT PARA LIMPIAR TOURS DE PRUEBA
 * 
 * Este script elimina SOLO los tours de ejemplo y sus datos relacionados.
 * NO toca: usuarios, configuración, ni tablas de referencia.
 */

async function cleanTestTours() {
  console.log('🧹 LIMPIANDO TOURS DE PRUEBA...\n');
  
  try {
    // ========================================
    // MOSTRAR QUÉ SE VA A ELIMINAR
    // ========================================
    console.log('📋 Contando registros a eliminar...');
    
    const toursBus = await prisma.tourBus.count();
    const toursAereo = await prisma.tourAereo.count();
    const asientos = await prisma.asientoBus.count();
    const ventasTourBus = await prisma.ventaTourBus.count();
    const ventasTourAereo = await prisma.ventaTourAereo.count();
    const clientes = await prisma.client.count();
    const biglietteria = await prisma.biglietteria.count();
    const agendas = await prisma.agendaPersonal.count();
    const info = await prisma.info.count();
    const routes = await prisma.route.count();
    const stops = await prisma.stop.count();
    const departures = await prisma.departure.count();

    console.log('\n📊 REGISTROS A ELIMINAR:');
    console.log('─'.repeat(60));
    console.log(`🚌 Tours Bus:                    ${toursBus}`);
    console.log(`🪑 Asientos de Bus:              ${asientos}`);
    console.log(`💰 Ventas Tour Bus:              ${ventasTourBus}`);
    console.log(`✈️  Tours Aéreo:                  ${toursAereo}`);
    console.log(`💰 Ventas Tour Aéreo:            ${ventasTourAereo}`);
    console.log(`👥 Clientes:                     ${clientes}`);
    console.log(`🎫 Biglietteria:                 ${biglietteria}`);
    console.log(`📅 Agendas Personales:           ${agendas}`);
    console.log(`📄 Info (Plantillas):            ${info}`);
    console.log(`🗺️  Routes (Plantillas):          ${routes}`);
    console.log(`🚏 Stops (Plantillas):           ${stops}`);
    console.log(`📅 Departures:                   ${departures}`);
    console.log('─'.repeat(60));

    console.log('\n⚠️  IMPORTANTE: NO se eliminarán:');
    console.log('   ✅ Usuarios (ti@test.com, admin@test.com, user@test.com)');
    console.log('   ✅ Métodos de pago');
    console.log('   ✅ Códigos IATA');
    console.log('   ✅ Servicios');
    console.log('   ✅ Paradas de bus');
    console.log('   ✅ Estados de bus');
    console.log('   ✅ Estados de pago');

    // ========================================
    // ELIMINAR DATOS EN ORDEN CORRECTO
    // ========================================
    console.log('\n🗑️  Eliminando registros...\n');

    // 1. Eliminar cuotas de ventas
    console.log('💳 Eliminando cuotas...');
    await prisma.cuotaVentaTourAereo.deleteMany();
    await prisma.cuotaTourBus.deleteMany();
    await prisma.cuota.deleteMany();
    console.log('   ✅ Cuotas eliminadas');

    // 2. Eliminar acompañantes
    console.log('👥 Eliminando acompañantes...');
    await prisma.acompananteTourBus.deleteMany();
    console.log('   ✅ Acompañantes eliminados');

    // 3. Eliminar ventas
    console.log('💰 Eliminando ventas...');
    await prisma.ventaTourAereo.deleteMany();
    await prisma.ventaTourBus.deleteMany();
    await prisma.ventaAsiento.deleteMany();
    console.log('   ✅ Ventas eliminadas');

    // 4. Eliminar pasajeros de biglietteria
    console.log('🎫 Eliminando pasajeros de biglietteria...');
    await prisma.pasajeroBiglietteria.deleteMany();
    console.log('   ✅ Pasajeros eliminados');

    // 5. Eliminar biglietteria
    console.log('🎫 Eliminando registros de biglietteria...');
    await prisma.biglietteria.deleteMany();
    console.log('   ✅ Biglietteria eliminada');

    // 6. Eliminar asientos de bus
    console.log('🪑 Eliminando asientos de bus...');
    await prisma.asientoBus.deleteMany();
    console.log('   ✅ Asientos eliminados');

    // 7. Eliminar tours
    console.log('🚌 Eliminando tours de bus...');
    await prisma.tourBus.deleteMany();
    console.log('   ✅ Tours Bus eliminados');

    console.log('✈️  Eliminando tours aéreos...');
    await prisma.tourAereo.deleteMany();
    console.log('   ✅ Tours Aéreo eliminados');

    // 8. Eliminar clientes
    console.log('👥 Eliminando clientes...');
    await prisma.client.deleteMany();
    console.log('   ✅ Clientes eliminados');

    // 9. Eliminar agendas personales y recordatorios
    console.log('📅 Eliminando agendas personales...');
    await prisma.recordatorioAgenda.deleteMany();
    await prisma.agendaPersonal.deleteMany();
    console.log('   ✅ Agendas eliminadas');

    // 10. Eliminar plantillas
    console.log('📄 Eliminando plantillas...');
    await prisma.info.deleteMany();
    await prisma.route.deleteMany();
    await prisma.stop.deleteMany();
    await prisma.departure.deleteMany();
    console.log('   ✅ Plantillas eliminadas');

    // ========================================
    // VERIFICAR LIMPIEZA
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ LIMPIEZA COMPLETADA');
    console.log('='.repeat(60));

    const finalStats = {
      usuarios: await prisma.user.count(),
      metodosPagamento: await prisma.metodoPagamento.count(),
      iatas: await prisma.iata.count(),
      servicios: await prisma.servizio.count(),
      fermate: await prisma.fermataBus.count(),
      stati: await prisma.statoBus.count(),
      pagamenti: await prisma.pagamento.count(),
      toursBus: await prisma.tourBus.count(),
      toursAereo: await prisma.tourAereo.count(),
      clientes: await prisma.client.count(),
      biglietteria: await prisma.biglietteria.count(),
    };

    console.log('\n📊 ESTADO FINAL:');
    console.log('─'.repeat(60));
    console.log('✅ MANTENIDOS (Configuración):');
    console.log(`   👥 Usuarios:              ${finalStats.usuarios}`);
    console.log(`   💳 Métodos de pago:       ${finalStats.metodosPagamento}`);
    console.log(`   ✈️  Códigos IATA:          ${finalStats.iatas}`);
    console.log(`   🎫 Servicios:             ${finalStats.servicios}`);
    console.log(`   🚏 Paradas de bus:        ${finalStats.fermate}`);
    console.log(`   📊 Estados de bus:        ${finalStats.stati}`);
    console.log(`   💰 Estados de pago:       ${finalStats.pagamenti}`);
    
    console.log('\n🗑️  ELIMINADOS (Tours de prueba):');
    console.log(`   🚌 Tours Bus:             ${finalStats.toursBus} (antes: ${toursBus})`);
    console.log(`   ✈️  Tours Aéreo:           ${finalStats.toursAereo} (antes: ${toursAereo})`);
    console.log(`   👥 Clientes:              ${finalStats.clientes} (antes: ${clientes})`);
    console.log(`   🎫 Biglietteria:          ${finalStats.biglietteria} (antes: ${biglietteria})`);
    console.log('─'.repeat(60));

    console.log('\n✅ ¡Sistema limpio y listo para usar!');
    console.log('   Puedes empezar a crear tus propios tours y ventas.');

  } catch (error) {
    console.error('\n❌ ERROR DURANTE LA LIMPIEZA:');
    console.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar limpieza
cleanTestTours()
  .then(() => {
    console.log('\n✅ Script finalizado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script finalizado con errores');
    console.error(error);
    process.exit(1);
  });



