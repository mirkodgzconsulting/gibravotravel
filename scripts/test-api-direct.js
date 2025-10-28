const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testApiDirect() {
  try {
    console.log('🔍 Probando API directamente...\n');
    
    // Probar la consulta que está fallando en la API
    console.log('📋 Probando consulta GET de biglietteria...');
    
    const whereCondition = { isActive: true };
    
    const records = await prisma.biglietteria.findMany({
      where: whereCondition,
      include: {
        cuotas: {
          orderBy: {
            numeroCuota: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('✅ Consulta GET exitosa!');
    console.log(`📊 Registros encontrados: ${records.length}`);
    
    if (records.length > 0) {
      console.log('\n📋 Primer registro:');
      const firstRecord = records[0];
      console.log(`  - ID: ${firstRecord.id}`);
      console.log(`  - Cliente: ${firstRecord.cliente}`);
      console.log(`  - Cuotas: ${firstRecord.cuotas?.length || 0}`);
    }
    
  } catch (error) {
    console.error('❌ Error en consulta GET:', error.message);
  }
  
  try {
    console.log('\n📋 Probando consulta POST simulada...');
    
    // Simular datos de un pasajero
    const pasajerosData = [{
      nombrePasajero: 'Test Pasajero',
      servicios: ['Biglietteria', 'Express'],
      andata: '2025-01-15',
      ritorno: '2025-01-20',
      netoBiglietteria: '100',
      vendutoBiglietteria: '120',
      tieneExpress: true,
      netoExpress: '50',
      vendutoExpress: '60',
      tienePolizza: false,
      tieneLetteraInvito: false,
      tieneHotel: false
    }];
    
    // Simular la creación de pasajeros
    const pasajerosParaCrear = pasajerosData.map((pasajero) => {
      let andataProcesada = null;
      let ritornoProcesada = null;
      
      if (pasajero.andata) {
        try {
          andataProcesada = new Date(pasajero.andata);
          if (isNaN(andataProcesada.getTime())) {
            andataProcesada = null;
          }
        } catch (error) {
          andataProcesada = null;
        }
      }
      
      if (pasajero.ritorno) {
        try {
          ritornoProcesada = new Date(pasajero.ritorno);
          if (isNaN(ritornoProcesada.getTime())) {
            ritornoProcesada = null;
          }
        } catch (error) {
          ritornoProcesada = null;
        }
      }
      
      return {
        nombrePasajero: pasajero.nombrePasajero,
        servizio: Array.isArray(pasajero.servicios) ? pasajero.servicios.join(', ') : pasajero.servizio || '',
        andata: andataProcesada,
        ritorno: ritornoProcesada,
        netoBiglietteria: pasajero.netoBiglietteria ? parseFloat(pasajero.netoBiglietteria) : null,
        vendutoBiglietteria: pasajero.vendutoBiglietteria ? parseFloat(pasajero.vendutoBiglietteria) : null,
        tieneExpress: pasajero.tieneExpress || false,
        netoExpress: pasajero.netoExpress ? parseFloat(pasajero.netoExpress) : null,
        vendutoExpress: pasajero.vendutoExpress ? parseFloat(pasajero.vendutoExpress) : null,
        tienePolizza: pasajero.tienePolizza || false,
        netoPolizza: pasajero.netoPolizza ? parseFloat(pasajero.netoPolizza) : null,
        vendutoPolizza: pasajero.vendutoPolizza ? parseFloat(pasajero.vendutoPolizza) : null,
        tieneLetteraInvito: pasajero.tieneLetteraInvito || false,
        netoLetteraInvito: pasajero.netoLetteraInvito ? parseFloat(pasajero.netoLetteraInvito) : null,
        vendutoLetteraInvito: pasajero.vendutoLetteraInvito ? parseFloat(pasajero.vendutoLetteraInvito) : null,
        tieneHotel: pasajero.tieneHotel || false,
        netoHotel: pasajero.netoHotel ? parseFloat(pasajero.netoHotel) : null,
        vendutoHotel: pasajero.vendutoHotel ? parseFloat(pasajero.vendutoHotel) : null
      };
    });
    
    console.log('✅ Datos de pasajeros preparados correctamente!');
    console.log(`📊 Pasajeros a crear: ${pasajerosParaCrear.length}`);
    
    // Probar la creación de un registro de prueba
    console.log('\n📋 Probando creación de registro de prueba...');
    
    const testRecord = await prisma.biglietteria.create({
      data: {
        cliente: 'Test Cliente',
        codiceFiscale: 'TEST123',
        indirizzo: 'Test Address',
        email: 'test@test.com',
        numeroTelefono: '123456789',
        pagamento: 'Test Payment',
        data: new Date(),
        iata: 'TEST',
        pnr: 'TESTPNR',
        itinerario: 'Test Itinerary',
        metodoPagamento: 'Test Method',
        numeroPasajeros: 1,
        netoPrincipal: 150,
        vendutoTotal: 180,
        acconto: 0,
        daPagare: 180,
        feeAgv: 30,
        creadoPor: 'Test User',
        isActive: true,
        pasajeros: {
          create: pasajerosParaCrear
        }
      },
      include: {
        cuotas: true,
        pasajeros: true
      }
    });
    
    console.log('✅ Registro de prueba creado exitosamente!');
    console.log(`📊 ID: ${testRecord.id}`);
    console.log(`📊 Pasajeros creados: ${testRecord.pasajeros.length}`);
    
    // Limpiar el registro de prueba
    await prisma.biglietteria.delete({
      where: { id: testRecord.id }
    });
    console.log('✅ Registro de prueba eliminado');
    
  } catch (error) {
    console.error('❌ Error en consulta POST:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiDirect();

