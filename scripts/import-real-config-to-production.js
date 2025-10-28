const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function importRealConfigToProduction() {
  console.log('📥 Importando datos reales de configuración a producción...\n');

  try {
    await prisma.$connect();
    console.log('✅ Conexión exitosa\n');

    // 1. Leer datos del archivo JSON
    console.log('1. Leyendo datos del archivo...');
    const fileName = 'local-config-data.json';
    
    if (!fs.existsSync(fileName)) {
      console.log('❌ Archivo local-config-data.json no encontrado');
      console.log('   Ejecuta primero: node scripts/export-local-config-data.js');
      return;
    }

    const configData = JSON.parse(fs.readFileSync(fileName, 'utf8'));
    console.log('✅ Datos cargados del archivo\n');

    // 2. Limpiar tablas existentes en producción
    console.log('2. Limpiando tablas existentes...');
    
    const tablesToClean = [
      'pagamento',
      'metodoPagamento', 
      'servizio',
      'iata',
      'fermataBus',
      'statoBus'
    ];

    for (const tableName of tablesToClean) {
      try {
        await prisma[tableName].deleteMany({});
        console.log(`   ✅ ${tableName}: Limpiada`);
      } catch (error) {
        console.log(`   ⚠️  ${tableName}: Error limpiando - ${error.message}`);
      }
    }

    // 3. Importar datos reales
    console.log('\n3. Importando datos reales...');

    // Pagamento
    if (configData.pagamento && configData.pagamento.length > 0) {
      console.log('   Importando pagamento...');
      for (const item of configData.pagamento) {
        await prisma.pagamento.create({
          data: {
            id: item.id,
            pagamento: item.pagamento,
            isActive: item.isActive
          }
        });
      }
      console.log(`   ✅ pagamento: ${configData.pagamento.length} registros importados`);
    }

    // MetodoPagamento
    if (configData.metodoPagamento && configData.metodoPagamento.length > 0) {
      console.log('   Importando metodoPagamento...');
      for (const item of configData.metodoPagamento) {
        await prisma.metodoPagamento.create({
          data: {
            id: item.id,
            metodoPagamento: item.metodoPagamento,
            isActive: item.isActive
          }
        });
      }
      console.log(`   ✅ metodoPagamento: ${configData.metodoPagamento.length} registros importados`);
    }

    // Servizio
    if (configData.servizio && configData.servizio.length > 0) {
      console.log('   Importando servizio...');
      for (const item of configData.servizio) {
        await prisma.servizio.create({
          data: {
            id: item.id,
            servizio: item.servizio,
            isActive: item.isActive
          }
        });
      }
      console.log(`   ✅ servizio: ${configData.servizio.length} registros importados`);
    }

    // Iata
    if (configData.iata && configData.iata.length > 0) {
      console.log('   Importando iata...');
      for (const item of configData.iata) {
        await prisma.iata.create({
          data: {
            id: item.id,
            iata: item.iata,
            isActive: item.isActive
          }
        });
      }
      console.log(`   ✅ iata: ${configData.iata.length} registros importados`);
    }

    // FermataBus
    if (configData.fermataBus && configData.fermataBus.length > 0) {
      console.log('   Importando fermataBus...');
      for (const item of configData.fermataBus) {
        await prisma.fermataBus.create({
          data: {
            id: item.id,
            fermata: item.fermata,
            isActive: item.isActive
          }
        });
      }
      console.log(`   ✅ fermataBus: ${configData.fermataBus.length} registros importados`);
    }

    // StatoBus
    if (configData.statoBus && configData.statoBus.length > 0) {
      console.log('   Importando statoBus...');
      for (const item of configData.statoBus) {
        await prisma.statoBus.create({
          data: {
            id: item.id,
            stato: item.stato,
            isActive: item.isActive
          }
        });
      }
      console.log(`   ✅ statoBus: ${configData.statoBus.length} registros importados`);
    }

    // 4. Verificación final
    console.log('\n4. Verificación final...');
    
    const finalChecks = [
      { name: 'pagamento', query: () => prisma.pagamento.count() },
      { name: 'metodoPagamento', query: () => prisma.metodoPagamento.count() },
      { name: 'servizio', query: () => prisma.servizio.count() },
      { name: 'iata', query: () => prisma.iata.count() },
      { name: 'fermataBus', query: () => prisma.fermataBus.count() },
      { name: 'statoBus', query: () => prisma.statoBus.count() }
    ];

    for (const check of finalChecks) {
      try {
        const count = await check.query();
        console.log(`   ✅ ${check.name}: ${count} registros`);
      } catch (error) {
        console.log(`   ❌ ${check.name}: Error - ${error.message}`);
      }
    }

    console.log('\n✅ Importación de datos reales completada!');
    console.log('🎉 La base de datos de producción ahora tiene los datos reales de configuración');

  } catch (error) {
    console.error('❌ Error durante importación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importRealConfigToProduction();
