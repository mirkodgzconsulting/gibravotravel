const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function testCreadoPor() {
  try {
    console.log('👤 Probando nueva columna "creadoPor" en Biglietteria...');

    // Crear un registro de prueba con la nueva columna
    console.log('\n➕ Creando registro con creadoPor...');
    const testRecord = await prisma.biglietteria.create({
      data: {
        pagamento: 'acconto',
        data: new Date(),
        iata: 'ryan air',
        pnr: 'TEST123',
        passeggero: 'Giulia Bianchi',
        itinerario: 'Milano - Londra',
        servizio: 'biglietto',
        neto: 200.00,
        venduto: 250.00,
        acconto: 100.00,
        daPagare: 150.00,
        metodoPagamento: 'PostePay',
        feeAgv: 50.00,
        origine: 'Facebook',
        cliente: 'Giulia Bianchi',
        codiceFiscale: 'BNCGLI85B45F205X',
        indirizzo: 'Via Milano 456, Roma',
        email: 'giulia.bianchi@email.com',
        numeroTelefono: '+39 987 654 3210',
        creadoPor: 'Andrea Rossi' // Nueva columna
      }
    });

    console.log('✅ Registro creado exitosamente:');
    console.log(`   - ID: ${testRecord.id}`);
    console.log(`   - Pasajero: ${testRecord.passeggero}`);
    console.log(`   - Creado por: ${testRecord.creadoPor}`);
    console.log(`   - Itinerario: ${testRecord.itinerario}`);

    // Leer el registro y verificar la nueva columna
    console.log('\n📖 Verificando la columna creadoPor...');
    const foundRecord = await prisma.biglietteria.findUnique({
      where: { id: testRecord.id }
    });

    if (foundRecord && foundRecord.creadoPor) {
      console.log('✅ Columna creadoPor funcionando correctamente:');
      console.log(`   - Valor: "${foundRecord.creadoPor}"`);
    } else {
      console.log('❌ Error: Columna creadoPor no encontrada');
    }

    // Eliminar el registro de prueba
    console.log('\n🗑️ Limpiando registro de prueba...');
    await prisma.biglietteria.delete({
      where: { id: testRecord.id }
    });
    console.log('✅ Registro eliminado correctamente');

    console.log('\n🎉 Prueba de columna creadoPor completada exitosamente!');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la prueba
testCreadoPor()
  .then(() => {
    console.log('✅ Prueba completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en la prueba:', error);
    process.exit(1);
  });
