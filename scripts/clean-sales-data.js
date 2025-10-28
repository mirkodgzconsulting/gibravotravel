const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanSalesData() {
  try {
    console.log('🧹 Iniciando limpieza de datos de ventas...\n');

    // 1. Limpiar ventas de BIGLIETTERIA
    console.log('📊 Limpiando ventas de BIGLIETTERIA...');
    
    // Primero eliminar pasajeros relacionados
    const deletedPasajeros = await prisma.pasajeroBiglietteria.deleteMany({});
    console.log(`   ✅ Eliminados ${deletedPasajeros.count} pasajeros de biglietteria`);
    
    // Luego eliminar cuotas
    const deletedCuotas = await prisma.cuota.deleteMany({});
    console.log(`   ✅ Eliminadas ${deletedCuotas.count} cuotas`);
    
    // Finalmente eliminar registros de biglietteria
    const deletedBiglietteria = await prisma.biglietteria.deleteMany({});
    console.log(`   ✅ Eliminados ${deletedBiglietteria.count} registros de biglietteria`);

    // 2. Limpiar ventas de TOURS BUS
    console.log('\n🚌 Limpiando ventas de TOURS BUS...');
    
    // Eliminar acompañantes
    const deletedAcompanantes = await prisma.acompananteTourBus.deleteMany({});
    console.log(`   ✅ Eliminados ${deletedAcompanantes.count} acompañantes`);
    
    // Eliminar cuotas de tour bus
    const deletedCuotasTourBus = await prisma.cuotaTourBus.deleteMany({});
    console.log(`   ✅ Eliminadas ${deletedCuotasTourBus.count} cuotas de tour bus`);
    
    // Eliminar ventas de asientos
    const deletedVentasAsientos = await prisma.ventaAsiento.deleteMany({});
    console.log(`   ✅ Eliminadas ${deletedVentasAsientos.count} ventas de asientos`);
    
    // Eliminar ventas de tour bus
    const deletedVentasTourBus = await prisma.ventaTourBus.deleteMany({});
    console.log(`   ✅ Eliminadas ${deletedVentasTourBus.count} ventas de tour bus`);
    
    // Resetear asientos (pero mantener la estructura)
    const resetAsientos = await prisma.asientoBus.updateMany({
      data: {
        isVendido: false,
        stato: 'Libero',
        precioVenta: null,
        fechaVenta: null,
        clienteNombre: null,
        clienteTelefono: null,
        clienteEmail: null,
        observaciones: null
      }
    });
    console.log(`   ✅ Reseteados ${resetAsientos.count} asientos`);
    
    // Resetear feeAgv de tours bus
    const resetFeeAgvBus = await prisma.tourBus.updateMany({
      data: { feeAgv: 0 }
    });
    console.log(`   ✅ Reseteados ${resetFeeAgvBus.count} feeAgv de tours bus`);

    // 3. Limpiar ventas de TOUR AEREO
    console.log('\n✈️ Limpiando ventas de TOUR AEREO...');
    
    // Eliminar cuotas de tour aereo
    const deletedCuotasTourAereo = await prisma.cuotaVentaTourAereo.deleteMany({});
    console.log(`   ✅ Eliminadas ${deletedCuotasTourAereo.count} cuotas de tour aereo`);
    
    // Eliminar ventas de tour aereo
    const deletedVentasTourAereo = await prisma.ventaTourAereo.deleteMany({});
    console.log(`   ✅ Eliminadas ${deletedVentasTourAereo.count} ventas de tour aereo`);
    
    // Resetear feeAgv de tours aereo
    const resetFeeAgvAereo = await prisma.tourAereo.updateMany({
      data: { feeAgv: 0 }
    });
    console.log(`   ✅ Reseteados ${resetFeeAgvAereo.count} feeAgv de tours aereo`);

    console.log('\n🎉 ¡Limpieza completada exitosamente!');
    console.log('\n📋 Resumen:');
    console.log('   • BIGLIETTERIA: Pasajeros, cuotas y registros eliminados');
    console.log('   • TOURS BUS: Acompañantes, cuotas, ventas y asientos reseteados');
    console.log('   • TOUR AEREO: Cuotas y ventas eliminadas');
    console.log('   • Configuraciones: Tours, asientos y usuarios MANTENIDOS');
    console.log('\n✅ Ahora puedes insertar datos de ventas realistas para los gráficos.');

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la limpieza
cleanSalesData()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
