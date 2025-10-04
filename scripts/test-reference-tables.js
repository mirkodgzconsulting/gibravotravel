const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function testReferenceTables() {
  try {
    console.log('🧪 Iniciando pruebas de tablas de referencia...');

    // Probar tabla Pagamento
    console.log('\n📋 Probando tabla Pagamento...');
    const pagamenti = await prisma.pagamento.findMany();
    console.log(`✅ Encontrados ${pagamenti.length} tipos de pago:`);
    pagamenti.forEach(p => console.log(`   - ${p.pagamento}`));

    // Probar tabla Iata
    console.log('\n✈️ Probando tabla Iata...');
    const iata = await prisma.iata.findMany();
    console.log(`✅ Encontradas ${iata.length} aerolíneas:`);
    iata.forEach(i => console.log(`   - ${i.iata}`));

    // Probar tabla Servizio
    console.log('\n🛠️ Probando tabla Servizio...');
    const servizi = await prisma.servizio.findMany();
    console.log(`✅ Encontrados ${servizi.length} servicios:`);
    servizi.forEach(s => console.log(`   - ${s.servizio}`));

    // Probar tabla MetodoPagamento
    console.log('\n💳 Probando tabla MetodoPagamento...');
    const metodiPagamento = await prisma.metodoPagamento.findMany();
    console.log(`✅ Encontrados ${metodiPagamento.length} métodos de pago:`);
    metodiPagamento.forEach(m => console.log(`   - ${m.metodoPagamento}`));

    // Probar tabla Origine
    console.log('\n📍 Probando tabla Origine...');
    const origini = await prisma.origine.findMany();
    console.log(`✅ Encontradas ${origini.length} fuentes de origen:`);
    origini.forEach(o => console.log(`   - ${o.origine}`));

    // Probar operaciones CRUD básicas
    console.log('\n🔧 Probando operaciones CRUD...');
    
    // Crear un registro temporal
    const tempPagamento = await prisma.pagamento.create({
      data: { pagamento: 'test_pagamento_temp' }
    });
    console.log('✅ Crear: Registro temporal creado');

    // Leer el registro
    const foundPagamento = await prisma.pagamento.findUnique({
      where: { id: tempPagamento.id }
    });
    console.log('✅ Leer: Registro encontrado');

    // Actualizar el registro
    await prisma.pagamento.update({
      where: { id: tempPagamento.id },
      data: { pagamento: 'test_pagamento_actualizado' }
    });
    console.log('✅ Actualizar: Registro actualizado');

    // Eliminar el registro temporal
    await prisma.pagamento.delete({
      where: { id: tempPagamento.id }
    });
    console.log('✅ Eliminar: Registro temporal eliminado');

    console.log('\n🎉 Todas las pruebas completadas exitosamente!');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar las pruebas
testReferenceTables()
  .then(() => {
    console.log('✅ Pruebas completadas');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en las pruebas:', error);
    process.exit(1);
  });
