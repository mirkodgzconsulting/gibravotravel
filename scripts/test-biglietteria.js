const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function testBiglietteria() {
  try {
    console.log('🎫 Iniciando pruebas de tabla Biglietteria...');

    // Verificar que la tabla existe y está vacía inicialmente
    console.log('\n📋 Verificando tabla Biglietteria...');
    const initialCount = await prisma.biglietteria.count();
    console.log(`✅ Tabla Biglietteria creada correctamente. Registros iniciales: ${initialCount}`);

    // Crear un registro de prueba
    console.log('\n➕ Creando registro de prueba...');
    const testRecord = await prisma.biglietteria.create({
      data: {
        pagamento: 'acconto',
        data: new Date(),
        iata: 'ryan air',
        pnr: 'ABC123',
        passeggero: 'Mario Rossi',
        itinerario: 'Roma - Parigi',
        servizio: 'biglietto',
        neto: 150.50,
        venduto: 180.00,
        acconto: 50.00,
        daPagare: 130.00,
        metodoPagamento: 'cash',
        feeAgv: 29.50,
        origine: 'WhatsApp',
        cliente: 'Mario Rossi',
        codiceFiscale: 'RSSMRA80A01H501U',
        indirizzo: 'Via Roma 123, Milano',
        email: 'mario.rossi@email.com',
        numeroTelefono: '+39 123 456 7890'
      }
    });

    console.log('✅ Registro creado exitosamente:');
    console.log(`   - ID: ${testRecord.id}`);
    console.log(`   - Pasajero: ${testRecord.passeggero}`);
    console.log(`   - Itinerario: ${testRecord.itinerario}`);
    console.log(`   - Precio Neto: €${testRecord.neto}`);
    console.log(`   - Precio Vendido: €${testRecord.venduto}`);

    // Leer el registro
    console.log('\n📖 Leyendo registro...');
    const foundRecord = await prisma.biglietteria.findUnique({
      where: { id: testRecord.id }
    });

    if (foundRecord) {
      console.log('✅ Registro encontrado correctamente');
      console.log(`   - Aerolínea: ${foundRecord.iata}`);
      console.log(`   - PNR: ${foundRecord.pnr}`);
      console.log(`   - Método de Pago: ${foundRecord.metodoPagamento}`);
    }

    // Actualizar el registro
    console.log('\n✏️ Actualizando registro...');
    const updatedRecord = await prisma.biglietteria.update({
      where: { id: testRecord.id },
      data: {
        venduto: 200.00,
        daPagare: 150.00
      }
    });

    console.log('✅ Registro actualizado:');
    console.log(`   - Nuevo precio vendido: €${updatedRecord.venduto}`);
    console.log(`   - Nuevo monto a pagar: €${updatedRecord.daPagare}`);

    // Listar todos los registros
    console.log('\n📋 Listando todos los registros...');
    const allRecords = await prisma.biglietteria.findMany();
    console.log(`✅ Total de registros en Biglietteria: ${allRecords.length}`);

    allRecords.forEach((record, index) => {
      console.log(`   ${index + 1}. ${record.passeggero} - ${record.itinerario} (€${record.venduto})`);
    });

    // Probar consultas con filtros
    console.log('\n🔍 Probando consultas con filtros...');
    
    // Filtrar por aerolínea
    const ryanAirRecords = await prisma.biglietteria.findMany({
      where: { iata: 'ryan air' }
    });
    console.log(`✅ Registros de Ryan Air: ${ryanAirRecords.length}`);

    // Filtrar por método de pago
    const cashRecords = await prisma.biglietteria.findMany({
      where: { metodoPagamento: 'cash' }
    });
    console.log(`✅ Registros con pago en efectivo: ${cashRecords.length}`);

    // Filtrar por rango de precios
    const highValueRecords = await prisma.biglietteria.findMany({
      where: {
        venduto: {
          gte: 150.00
        }
      }
    });
    console.log(`✅ Registros con precio >= €150: ${highValueRecords.length}`);

    // Eliminar el registro de prueba
    console.log('\n🗑️ Eliminando registro de prueba...');
    await prisma.biglietteria.delete({
      where: { id: testRecord.id }
    });
    console.log('✅ Registro eliminado correctamente');

    // Verificar que se eliminó
    const finalCount = await prisma.biglietteria.count();
    console.log(`✅ Registros finales en Biglietteria: ${finalCount}`);

    console.log('\n🎉 Todas las pruebas de Biglietteria completadas exitosamente!');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar las pruebas
testBiglietteria()
  .then(() => {
    console.log('✅ Pruebas completadas');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en las pruebas:', error);
    process.exit(1);
  });
