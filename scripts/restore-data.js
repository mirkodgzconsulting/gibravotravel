const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function restoreData() {
  try {
    console.log('🔄 Iniciando restauración de datos...');

    // 1. Crear usuarios
    console.log('👤 Creando usuarios...');
    const adminUser = await prisma.user.create({
      data: {
        clerkId: 'user_admin_restore',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true
      }
    });

    const tiUser = await prisma.user.create({
      data: {
        clerkId: 'user_ti_restore',
        email: 'ti@test.com',
        firstName: 'TI',
        lastName: 'User',
        role: 'TI',
        isActive: true
      }
    });

    const normalUser = await prisma.user.create({
      data: {
        clerkId: 'user_normal_restore',
        email: 'user@test.com',
        firstName: 'Normal',
        lastName: 'User',
        role: 'USER',
        isActive: true
      }
    });

    // 2. Crear datos de configuración
    console.log('⚙️ Creando datos de configuración...');
    
    // Métodos de pago
    await prisma.metodoPagamento.createMany({
      data: [
        { metodoPagamento: 'Efectivo' },
        { metodoPagamento: 'Transferencia' },
        { metodoPagamento: 'Tarjeta' },
        { metodoPagamento: 'PayPal' }
      ]
    });

    // IATA codes
    await prisma.iata.createMany({
      data: [
        { iata: 'MAD' },
        { iata: 'BCN' },
        { iata: 'FCO' },
        { iata: 'CDG' },
        { iata: 'LHR' }
      ]
    });

    // Servicios
    await prisma.servizio.createMany({
      data: [
        { servizio: 'Vuelo' },
        { servizio: 'Hotel' },
        { servizio: 'Transfer' },
        { servizio: 'Seguro' }
      ]
    });

    // Pagamentos
    await prisma.pagamento.createMany({
      data: [
        { pagamento: 'Contado' },
        { pagamento: '2 Cuotas' },
        { pagamento: '3 Cuotas' }
      ]
    });

    // Fermate Bus
    await prisma.fermataBus.createMany({
      data: [
        { fermata: 'Roma Termini' },
        { fermata: 'Milano Centrale' },
        { fermata: 'Napoli Centrale' },
        { fermata: 'Firenze SMN' },
        { fermata: 'Bologna Centrale' }
      ]
    });

    // Estados Bus
    await prisma.statoBus.createMany({
      data: [
        { stato: 'Libero' },
        { stato: 'Prenotato' },
        { stato: 'Venduto' },
        { stato: 'Ocupado' }
      ]
    });

    // 3. Crear clientes de ejemplo
    console.log('👥 Creando clientes...');
    const clientes = await prisma.client.createMany({
      data: [
        {
          firstName: 'Mario',
          lastName: 'Rossi',
          fiscalCode: 'RSSMRA80A01H501U',
          address: 'Via Roma 123, Milano',
          phoneNumber: '+39 123 456 7890',
          email: 'mario.rossi@email.com',
          birthPlace: 'Milano',
          birthDate: new Date('1980-01-01'),
          createdBy: adminUser.clerkId
        },
        {
          firstName: 'Giulia',
          lastName: 'Bianchi',
          fiscalCode: 'BNCGLA85B15F205X',
          address: 'Via Firenze 456, Roma',
          phoneNumber: '+39 987 654 3210',
          email: 'giulia.bianchi@email.com',
          birthPlace: 'Roma',
          birthDate: new Date('1985-02-15'),
          createdBy: adminUser.clerkId
        }
      ]
    });

    // 4. Crear tours de ejemplo
    console.log('🚌 Creando tours...');
    
    // Tour Bus
    const tourBus = await prisma.tourBus.create({
      data: {
        titulo: 'Tour Roma - París',
        precioAdulto: 150.00,
        precioNino: 120.00,
        cantidadAsientos: 53,
        fechaViaje: new Date('2024-03-15'),
        fechaFin: new Date('2024-03-20'),
        bus: 2000.00,
        pasti: 500.00,
        parking: 200.00,
        coordinatore1: 300.00,
        coordinatore2: 300.00,
        ztl: 150.00,
        hotel: 800.00,
        polizza: 100.00,
        tkt: 400.00,
        autoservicio: 'Incluido',
        descripcion: 'Tour de 5 días de Roma a París',
        createdBy: adminUser.clerkId
      }
    });

    // Tour Aéreo
    const tourAereo = await prisma.tourAereo.create({
      data: {
        titulo: 'Tour Aéreo Madrid',
        precioAdulto: 200.00,
        precioNino: 160.00,
        fechaViaje: new Date('2024-04-10'),
        fechaFin: new Date('2024-04-15'),
        meta: 20,
        guidaLocale: 400.00,
        coordinatore: 300.00,
        transporte: 200.00,
        notas: 'Tour aéreo a Madrid con guía local',
        createdBy: adminUser.clerkId
      }
    });

    // 5. Crear asientos para el tour bus
    console.log('🪑 Creando asientos...');
    const asientos = [];
    for (let fila = 1; fila <= 13; fila++) {
      const columnas = ['A', 'B', 'C', 'D'];
      for (const columna of columnas) {
        const numeroAsiento = (fila - 1) * 4 + columnas.indexOf(columna) + 1;
        if (numeroAsiento <= 53) {
          asientos.push({
            tourBusId: tourBus.id,
            numeroAsiento,
            fila,
            columna,
            tipo: numeroAsiento === 1 ? 'CONDUCTOR' : 'NORMAL'
          });
        }
      }
    }
    
    await prisma.asientoBus.createMany({
      data: asientos
    });

    // 6. Crear algunas ventas de ejemplo
    console.log('💰 Creando ventas de ejemplo...');
    
    // Venta Biglietteria
    const biglietteria = await prisma.biglietteria.create({
      data: {
        pagamento: 'Contado',
        data: new Date('2024-02-15'),
        pnr: 'ABC123',
        itinerario: 'Roma - Madrid',
        metodoPagamento: 'Transferencia',
        cliente: 'Mario Rossi',
        codiceFiscale: 'RSSMRA80A01H501U',
        indirizzo: 'Via Roma 123, Milano',
        email: 'mario.rossi@email.com',
        numeroTelefono: '+39 123 456 7890',
        creadoPor: adminUser.id,
        netoPrincipal: 150.00,
        vendutoTotal: 200.00,
        acconto: 100.00,
        daPagare: 100.00,
        feeAgv: 50.00,
        numeroPasajeros: 1
      }
    });

    // Pasajero para la venta
    await prisma.pasajeroBiglietteria.create({
      data: {
        biglietteriaId: biglietteria.id,
        nombrePasajero: 'Mario Rossi',
        servizio: 'Vuelo',
        andata: new Date('2024-03-15'),
        ritorno: new Date('2024-03-20'),
        iata: 'MAD',
        netoBiglietteria: 150.00,
        vendutoBiglietteria: 200.00,
        tieneExpress: true,
        netoExpress: 20.00,
        vendutoExpress: 30.00,
        tienePolizza: true,
        netoPolizza: 15.00,
        vendutoPolizza: 25.00,
        estado: 'Pagado',
        fechaPago: new Date('2024-02-15')
      }
    });

    // Venta Tour Bus
    await prisma.ventaTourBus.create({
      data: {
        tourBusId: tourBus.id,
        clienteNombre: 'Giulia Bianchi',
        codiceFiscale: 'BNCGLA85B15F205X',
        indirizzo: 'Via Firenze 456, Roma',
        email: 'giulia.bianchi@email.com',
        numeroTelefono: '+39 987 654 3210',
        fechaNacimiento: new Date('1985-02-15'),
        fermata: 'Roma Termini',
        numeroAsiento: 2,
        totalAPagar: 150.00,
        acconto: 75.00,
        daPagare: 75.00,
        metodoPagamento: 'Efectivo',
        estadoPago: 'Acconto',
        numeroAcompanantes: 1,
        numeroCuotas: 2,
        createdBy: adminUser.id
      }
    });

    // Venta Tour Aéreo
    await prisma.ventaTourAereo.create({
      data: {
        tourAereoId: tourAereo.id,
        pasajero: 'Mario Rossi',
        codiceFiscale: 'RSSMRA80A01H501U',
        indirizzo: 'Via Roma 123, Milano',
        email: 'mario.rossi@email.com',
        numeroTelefono: '+39 123 456 7890',
        paisOrigen: 'Italia',
        iata: 'MAD',
        pnr: 'XYZ789',
        hotel: 50.00,
        transfer: 30.00,
        venduto: 200.00,
        acconto: 100.00,
        daPagare: 100.00,
        metodoPagamento: 'Transferencia',
        metodoCompra: 'Online',
        stato: 'Acconto',
        createdBy: adminUser.id
      }
    });

    // 7. Crear algunas agendas personales
    console.log('📅 Creando agendas...');
    await prisma.agendaPersonal.create({
      data: {
        titulo: 'Reunión con cliente',
        descripcion: 'Reunión importante con cliente para discutir nuevos tours',
        fecha: new Date('2024-03-01T10:00:00Z'),
        tipo: 'REUNION',
        createdBy: adminUser.id
      }
    });

    console.log('✅ ¡Datos restaurados exitosamente!');
    console.log('📊 Resumen:');
    console.log(`- 3 usuarios creados`);
    console.log(`- Configuración básica restaurada`);
    console.log(`- 2 clientes de ejemplo`);
    console.log(`- 1 tour bus con 53 asientos`);
    console.log(`- 1 tour aéreo`);
    console.log(`- 3 ventas de ejemplo`);
    console.log(`- 1 agenda personal`);

  } catch (error) {
    console.error('❌ Error al restaurar datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreData();

