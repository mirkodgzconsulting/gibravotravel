const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportLocalConfigData() {
  console.log('📤 Exportando datos de configuración de local...\n');

  try {
    await prisma.$connect();
    console.log('✅ Conexión exitosa\n');

    const configData = {};

    // 1. Exportar pagamento
    console.log('1. Exportando pagamento...');
    const pagamento = await prisma.pagamento.findMany();
    configData.pagamento = pagamento;
    console.log(`   ✅ ${pagamento.length} registros exportados`);

    // 2. Exportar metodoPagamento
    console.log('2. Exportando metodoPagamento...');
    const metodoPagamento = await prisma.metodoPagamento.findMany();
    configData.metodoPagamento = metodoPagamento;
    console.log(`   ✅ ${metodoPagamento.length} registros exportados`);

    // 3. Exportar servizio
    console.log('3. Exportando servizio...');
    const servizio = await prisma.servizio.findMany();
    configData.servizio = servizio;
    console.log(`   ✅ ${servizio.length} registros exportados`);

    // 4. Exportar iata
    console.log('4. Exportando iata...');
    const iata = await prisma.iata.findMany();
    configData.iata = iata;
    console.log(`   ✅ ${iata.length} registros exportados`);

    // 5. Exportar fermataBus
    console.log('5. Exportando fermataBus...');
    const fermataBus = await prisma.fermataBus.findMany();
    configData.fermataBus = fermataBus;
    console.log(`   ✅ ${fermataBus.length} registros exportados`);

    // 6. Exportar statoBus
    console.log('6. Exportando statoBus...');
    const statoBus = await prisma.statoBus.findMany();
    configData.statoBus = statoBus;
    console.log(`   ✅ ${statoBus.length} registros exportados`);

    // 7. Guardar en archivo JSON
    console.log('\n7. Guardando datos en archivo...');
    const fileName = 'local-config-data.json';
    fs.writeFileSync(fileName, JSON.stringify(configData, null, 2));
    console.log(`   ✅ Datos guardados en ${fileName}`);

    // 8. Resumen
    console.log('\n📊 RESUMEN DE EXPORTACIÓN:');
    console.log(`   • pagamento: ${configData.pagamento.length} registros`);
    console.log(`   • metodoPagamento: ${configData.metodoPagamento.length} registros`);
    console.log(`   • servizio: ${configData.servizio.length} registros`);
    console.log(`   • iata: ${configData.iata.length} registros`);
    console.log(`   • fermataBus: ${configData.fermataBus.length} registros`);
    console.log(`   • statoBus: ${configData.statoBus.length} registros`);

    console.log('\n✅ Exportación completada!');
    console.log(`📁 Archivo generado: ${fileName}`);

  } catch (error) {
    console.error('❌ Error durante exportación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportLocalConfigData();
