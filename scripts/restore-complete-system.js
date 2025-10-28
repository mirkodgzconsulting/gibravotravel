const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * SCRIPT DE RESTAURACIÓN COMPLETA DEL SISTEMA
 * 
 * Este script restaura TODAS las tablas necesarias para que el sistema funcione correctamente
 * siguiendo la arquitectura definida en el frontend y backend.
 * 
 * ARQUITECTURA DEL SISTEMA:
 * 
 * 1. USUARIOS Y AUTENTICACIÓN
 *    - users: Usuarios del sistema (USER, ADMIN, TI)
 *    - clients: Base de datos de clientes con documentos
 * 
 * 2. CONFIGURACIÓN BÁSICA (Tablas de referencia)
 *    - metodo_pagamento: Métodos de pago disponibles
 *    - iata: Códigos IATA de aeropuertos
 *    - servizio: Servicios disponibles
 *    - fermata_bus: Paradas de autobús
 *    - stato_bus: Estados de asientos de bus
 *    - pagamento: Estados de pago
 * 
 * 3. BIGLIETTERIA (Sistema principal de ventas)
 *    - biglietteria: Ventas principales con totales calculados
 *    - pasajeros_biglietteria: Múltiples pasajeros por venta
 *    - cuotas: Sistema de pagos fraccionados
 * 
 * 4. TOURS BUS
 *    - tour_bus: Tours con costos detallados y feeAgv
 *    - asientos_bus: 53 asientos por tour (fila/columna A,B,C,D)
 *    - ventas_tour_bus: Ventas principales
 *    - acompanantes_tour_bus: Acompañantes de cada venta
 *    - cuotas_tour_bus: Pagos fraccionados
 * 
 * 5. TOUR AÉREO
 *    - tour_aereo: Tours aéreos con precios adulto/niño
 *    - ventas_tour_aereo: Ventas principales
 *    - cuotas_venta_tour_aereo: Pagos fraccionados
 * 
 * 6. AGENDAS Y CALENDARIO
 *    - agendas_personales: Agendas personales de usuarios
 *    - recordatorios_agenda: Sistema de alarmas
 * 
 * 7. PLANTILLAS Y CONTENIDO
 *    - info: Plantillas de información (PARTENZE/NOTE)
 *    - routes: Plantillas de rutas (PERCORSI)
 *    - stops: Plantillas de paradas (FERMATE)
 *    - departures: Salidas programadas
 */

async function restoreCompleteSystem() {
  console.log('🚀 INICIANDO RESTAURACIÓN COMPLETA DEL SISTEMA...\n');
  
  try {
    // ========================================
    // PASO 0: VERIFICAR Y LIMPIAR SI ES NECESARIO
    // ========================================
    console.log('🔍 PASO 0: Verificando estado de la base de datos...');
    
    const existingUsers = await prisma.user.count();
    const existingMetodos = await prisma.metodoPagamento.count();
    
    if (existingUsers > 0 || existingMetodos > 0) {
      console.log(`   ⚠️  Base de datos contiene datos: ${existingUsers} usuarios, ${existingMetodos} métodos de pago`);
      console.log('   🗑️  Limpiando datos existentes...');
      
      // Eliminar en orden correcto (respetando foreign keys)
      await prisma.cuotaVentaTourAereo.deleteMany();
      await prisma.ventaTourAereo.deleteMany();
      await prisma.cuotaTourBus.deleteMany();
      await prisma.acompananteTourBus.deleteMany();
      await prisma.ventaTourBus.deleteMany();
      await prisma.ventaAsiento.deleteMany();
      await prisma.asientoBus.deleteMany();
      await prisma.tourBus.deleteMany();
      await prisma.tourAereo.deleteMany();
      await prisma.cuota.deleteMany();
      await prisma.pasajeroBiglietteria.deleteMany();
      await prisma.biglietteria.deleteMany();
      await prisma.recordatorioAgenda.deleteMany();
      await prisma.agendaPersonal.deleteMany();
      await prisma.client.deleteMany();
      await prisma.departure.deleteMany();
      await prisma.info.deleteMany();
      await prisma.route.deleteMany();
      await prisma.stop.deleteMany();
      await prisma.metodoPagamento.deleteMany();
      await prisma.iata.deleteMany();
      await prisma.servizio.deleteMany();
      await prisma.fermataBus.deleteMany();
      await prisma.statoBus.deleteMany();
      await prisma.pagamento.deleteMany();
      await prisma.user.deleteMany();
      
      console.log('   ✅ Datos existentes eliminados');
    } else {
      console.log('   ✅ Base de datos vacía, procediendo con la restauración');
    }
    
    // ========================================
    // PASO 1: CREAR USUARIOS
    // ========================================
    console.log('\n👥 PASO 1: Creando usuarios del sistema...');
    
    const userAdmin = await prisma.user.create({
      data: {
        clerkId: 'user_admin_temp_' + Date.now(),
        email: 'admin@gibravotravel.com',
        firstName: 'Admin',
        lastName: 'Sistema',
        role: 'ADMIN',
        isActive: true,
      },
    });
    console.log('   ✅ Usuario ADMIN creado:', userAdmin.email);

    const userTI = await prisma.user.create({
      data: {
        clerkId: 'user_ti_temp_' + Date.now(),
        email: 'ti@gibravotravel.com',
        firstName: 'TI',
        lastName: 'Soporte',
        role: 'TI',
        isActive: true,
      },
    });
    console.log('   ✅ Usuario TI creado:', userTI.email);

    const userAgente1 = await prisma.user.create({
      data: {
        clerkId: 'user_agente1_temp_' + Date.now(),
        email: 'agente1@gibravotravel.com',
        firstName: 'María',
        lastName: 'González',
        role: 'USER',
        isActive: true,
      },
    });
    console.log('   ✅ Usuario AGENTE 1 creado:', userAgente1.email);

    const userAgente2 = await prisma.user.create({
      data: {
        clerkId: 'user_agente2_temp_' + Date.now(),
        email: 'agente2@gibravotravel.com',
        firstName: 'Carlos',
        lastName: 'Rodríguez',
        role: 'USER',
        isActive: true,
      },
    });
    console.log('   ✅ Usuario AGENTE 2 creado:', userAgente2.email);

    // ========================================
    // PASO 2: CONFIGURACIÓN BÁSICA
    // ========================================
    console.log('\n⚙️  PASO 2: Creando configuración básica...');
    
    // Métodos de pago
    const metodosPagamento = [
      'Efectivo',
      'Transferencia Bancaria',
      'Tarjeta de Crédito',
      'Tarjeta de Débito',
      'PayPal',
      'Bizum',
      'Stripe'
    ];
    
    for (const metodo of metodosPagamento) {
      await prisma.metodoPagamento.create({
        data: { metodoPagamento: metodo }
      });
    }
    console.log(`   ✅ ${metodosPagamento.length} métodos de pago creados`);

    // Códigos IATA
    const iatas = [
      'MAD', 'BCN', 'FCO', 'MXP', 'CDG', 
      'LHR', 'AMS', 'FRA', 'VCE', 'NAP',
      'PMI', 'AGP', 'SVQ', 'VLC', 'BIO'
    ];
    
    for (const iata of iatas) {
      await prisma.iata.create({
        data: { iata }
      });
    }
    console.log(`   ✅ ${iatas.length} códigos IATA creados`);

    // Servicios
    const servicios = [
      'Vuelo',
      'Hotel',
      'Transfer',
      'Seguro',
      'Excursión',
      'Alquiler de coche',
      'Tren',
      'Ferry'
    ];
    
    for (const servizio of servicios) {
      await prisma.servizio.create({
        data: { servizio }
      });
    }
    console.log(`   ✅ ${servicios.length} servicios creados`);

    // Paradas de bus
    const fermate = [
      'Roma Termini',
      'Milano Centrale',
      'Firenze Santa Maria Novella',
      'Venezia Mestre',
      'Bologna Centrale',
      'Napoli Centrale',
      'Torino Porta Nuova',
      'Genova Piazza Principe'
    ];
    
    for (const fermata of fermate) {
      await prisma.fermataBus.create({
        data: { fermata }
      });
    }
    console.log(`   ✅ ${fermate.length} paradas de bus creadas`);

    // Estados de bus
    const stati = ['Libero', 'Prenotato', 'Venduto', 'Ocupado', 'Bloqueado'];
    
    for (const stato of stati) {
      await prisma.statoBus.create({
        data: { stato }
      });
    }
    console.log(`   ✅ ${stati.length} estados de bus creados`);

    // Estados de pago
    const pagamenti = ['Pendiente', 'Pagado', 'Parcial', 'Cancelado', 'Reembolsado'];
    
    for (const pagamento of pagamenti) {
      await prisma.pagamento.create({
        data: { pagamento }
      });
    }
    console.log(`   ✅ ${pagamenti.length} estados de pago creados`);

    // ========================================
    // PASO 3: CLIENTES DE EJEMPLO
    // ========================================
    console.log('\n👥 PASO 3: Creando clientes de ejemplo...');
    
    const clientes = [
      {
        firstName: 'Mario',
        lastName: 'Rossi',
        fiscalCode: 'RSSMRA80A01H501Z',
        address: 'Via Roma 123, 00100 Roma',
        phoneNumber: '+39 333 1234567',
        email: 'mario.rossi@example.com',
        birthPlace: 'Roma',
        birthDate: new Date('1980-01-01'),
        createdBy: userAgente1.clerkId
      },
      {
        firstName: 'Giulia',
        lastName: 'Bianchi',
        fiscalCode: 'BNCGLI85B02H501Z',
        address: 'Piazza Navona 10, 00100 Roma',
        phoneNumber: '+39 333 7654321',
        email: 'giulia.bianchi@example.com',
        birthPlace: 'Milano',
        birthDate: new Date('1985-02-02'),
        createdBy: userAgente1.clerkId
      },
      {
        firstName: 'Luca',
        lastName: 'Verdi',
        fiscalCode: 'VRDLCU90C03H501Z',
        address: 'Corso Vittorio Emanuele 45, 20100 Milano',
        phoneNumber: '+39 333 9876543',
        email: 'luca.verdi@example.com',
        birthPlace: 'Firenze',
        birthDate: new Date('1990-03-03'),
        createdBy: userAgente2.clerkId
      },
      {
        firstName: 'Sofia',
        lastName: 'Ferrari',
        fiscalCode: 'FRRSFO88D04H501Z',
        address: 'Via Dante 78, 50100 Firenze',
        phoneNumber: '+39 333 5551234',
        email: 'sofia.ferrari@example.com',
        birthPlace: 'Venezia',
        birthDate: new Date('1988-04-04'),
        createdBy: userAgente2.clerkId
      }
    ];

    for (const cliente of clientes) {
      await prisma.client.create({ data: cliente });
    }
    console.log(`   ✅ ${clientes.length} clientes creados`);

    // ========================================
    // PASO 4: TOURS BUS
    // ========================================
    console.log('\n🚌 PASO 4: Creando tours de bus...');
    
    const tourBus1 = await prisma.tourBus.create({
      data: {
        titulo: 'Tour Roma - París - Barcelona',
        precioAdulto: 1500.00,
        precioNino: 750.00,
        cantidadAsientos: 53,
        fechaViaje: new Date('2024-08-15T08:00:00Z'),
        fechaFin: new Date('2024-08-25T18:00:00Z'),
        acc: 'Tour completo por Europa',
        bus: 5000.00,
        pasti: 1200.00,
        parking: 300.00,
        coordinatore1: 400.00,
        coordinatore2: 300.00,
        ztl: 150.00,
        hotel: 2500.00,
        polizza: 200.00,
        tkt: 100.00,
        autoservicio: 'Bus Mercedes 53 plazas',
        feeAgv: 0,
        descripcion: 'Tour de 10 días visitando las principales ciudades europeas',
        createdBy: userAdmin.clerkId,
      },
    });
    console.log('   ✅ Tour Bus 1 creado:', tourBus1.titulo);

    // Crear asientos para el tour
    console.log('   🪑 Creando 53 asientos...');
    for (let i = 1; i <= 53; i++) {
      const fila = Math.ceil(i / 4);
      const columna = ['A', 'B', 'C', 'D'][(i - 1) % 4];
      
      await prisma.asientoBus.create({
        data: {
          tourBusId: tourBus1.id,
          numeroAsiento: i,
          fila: fila,
          columna: columna,
          tipo: i === 1 ? 'CONDUCTOR' : 'NORMAL',
          stato: 'Libero',
        },
      });
    }
    console.log('   ✅ 53 asientos creados para Tour Bus 1');

    const tourBus2 = await prisma.tourBus.create({
      data: {
        titulo: 'Tour Italia del Norte',
        precioAdulto: 800.00,
        precioNino: 400.00,
        cantidadAsientos: 53,
        fechaViaje: new Date('2024-09-10T09:00:00Z'),
        fechaFin: new Date('2024-09-15T19:00:00Z'),
        acc: 'Recorrido por el norte de Italia',
        bus: 3000.00,
        pasti: 800.00,
        parking: 150.00,
        coordinatore1: 300.00,
        ztl: 100.00,
        hotel: 1500.00,
        polizza: 150.00,
        tkt: 80.00,
        autoservicio: 'Bus Iveco 53 plazas',
        feeAgv: 0,
        descripcion: 'Tour de 5 días por Milán, Venecia, Florencia',
        createdBy: userAdmin.clerkId,
      },
    });
    console.log('   ✅ Tour Bus 2 creado:', tourBus2.titulo);

    // Crear asientos para el segundo tour
    for (let i = 1; i <= 53; i++) {
      const fila = Math.ceil(i / 4);
      const columna = ['A', 'B', 'C', 'D'][(i - 1) % 4];
      
      await prisma.asientoBus.create({
        data: {
          tourBusId: tourBus2.id,
          numeroAsiento: i,
          fila: fila,
          columna: columna,
          tipo: i === 1 ? 'CONDUCTOR' : 'NORMAL',
          stato: 'Libero',
        },
      });
    }
    console.log('   ✅ 53 asientos creados para Tour Bus 2');

    // ========================================
    // PASO 5: TOUR AÉREO
    // ========================================
    console.log('\n✈️  PASO 5: Creando tours aéreos...');
    
    const tourAereo1 = await prisma.tourAereo.create({
      data: {
        titulo: 'Tour Madrid - Barcelona',
        precioAdulto: 900.00,
        precioNino: 450.00,
        fechaViaje: new Date('2024-10-05T10:00:00Z'),
        fechaFin: new Date('2024-10-12T16:00:00Z'),
        meta: 100,
        acc: 'Tour aéreo por España',
        guidaLocale: 200.00,
        coordinatore: 300.00,
        transporte: 150.00,
        feeAgv: 0,
        notas: 'Tour incluye visitas guiadas',
        notasCoordinador: 'Coordinar con guías locales',
        descripcion: 'Tour de 7 días por las principales ciudades españolas',
        createdBy: userAdmin.clerkId,
      },
    });
    console.log('   ✅ Tour Aéreo 1 creado:', tourAereo1.titulo);

    const tourAereo2 = await prisma.tourAereo.create({
      data: {
        titulo: 'Tour París - Londres',
        precioAdulto: 1200.00,
        precioNino: 600.00,
        fechaViaje: new Date('2024-11-15T11:00:00Z'),
        fechaFin: new Date('2024-11-22T17:00:00Z'),
        meta: 80,
        acc: 'Tour por capitales europeas',
        guidaLocale: 250.00,
        coordinatore: 350.00,
        transporte: 200.00,
        feeAgv: 0,
        notas: 'Tour premium con hoteles 4 estrellas',
        notasCoordinador: 'Verificar reservas de hoteles',
        descripcion: 'Tour de 7 días visitando París y Londres',
        createdBy: userAdmin.clerkId,
      },
    });
    console.log('   ✅ Tour Aéreo 2 creado:', tourAereo2.titulo);

    // ========================================
    // PASO 6: PLANTILLAS DE CONTENIDO
    // ========================================
    console.log('\n📄 PASO 6: Creando plantillas de contenido...');
    
    // Info (PARTENZE/NOTE)
    await prisma.info.create({
      data: {
        title: 'Información General de Viajes 2024',
        textContent: 'Información importante sobre nuestros tours y servicios para el año 2024.',
        createdBy: userAdmin.clerkId,
      },
    });
    console.log('   ✅ Plantilla INFO creada');

    // Routes (PERCORSI)
    await prisma.route.create({
      data: {
        title: 'Ruta Europa Central',
        textContent: 'Recorrido completo por las principales ciudades de Europa Central.',
        createdBy: userAdmin.clerkId,
      },
    });
    console.log('   ✅ Plantilla ROUTE creada');

    // Stops (FERMATE)
    await prisma.stop.create({
      data: {
        title: 'Paradas Principales Italia',
        textContent: 'Listado de paradas principales en territorio italiano.',
        createdBy: userAdmin.clerkId,
      },
    });
    console.log('   ✅ Plantilla STOP creada');

    // Departures
    await prisma.departure.create({
      data: {
        title: 'Salida Verano 2024',
        description: 'Salidas programadas para la temporada de verano',
        departureDate: new Date('2024-07-01T08:00:00Z'),
        returnDate: new Date('2024-07-15T18:00:00Z'),
        price: 1500.00,
        capacity: 50,
        available: true,
      },
    });
    console.log('   ✅ Departure creada');

    // ========================================
    // RESUMEN FINAL
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ ¡RESTAURACIÓN COMPLETA EXITOSA!');
    console.log('='.repeat(60));
    
    const stats = {
      usuarios: await prisma.user.count(),
      clientes: await prisma.client.count(),
      metodosPagamento: await prisma.metodoPagamento.count(),
      iatas: await prisma.iata.count(),
      servicios: await prisma.servizio.count(),
      fermate: await prisma.fermataBus.count(),
      stati: await prisma.statoBus.count(),
      pagamenti: await prisma.pagamento.count(),
      toursBus: await prisma.tourBus.count(),
      asientos: await prisma.asientoBus.count(),
      toursAereo: await prisma.tourAereo.count(),
      info: await prisma.info.count(),
      routes: await prisma.route.count(),
      stops: await prisma.stop.count(),
      departures: await prisma.departure.count(),
    };

    console.log('\n📊 RESUMEN DE DATOS CREADOS:');
    console.log('─'.repeat(60));
    console.log(`👥 Usuarios:                    ${stats.usuarios}`);
    console.log(`👥 Clientes:                    ${stats.clientes}`);
    console.log(`💳 Métodos de pago:             ${stats.metodosPagamento}`);
    console.log(`✈️  Códigos IATA:                ${stats.iatas}`);
    console.log(`🎫 Servicios:                   ${stats.servicios}`);
    console.log(`🚏 Paradas de bus:              ${stats.fermate}`);
    console.log(`📊 Estados de bus:              ${stats.stati}`);
    console.log(`💰 Estados de pago:             ${stats.pagamenti}`);
    console.log(`🚌 Tours Bus:                   ${stats.toursBus}`);
    console.log(`🪑 Asientos de bus:             ${stats.asientos}`);
    console.log(`✈️  Tours Aéreo:                 ${stats.toursAereo}`);
    console.log(`📄 Plantillas Info:             ${stats.info}`);
    console.log(`🗺️  Plantillas Routes:           ${stats.routes}`);
    console.log(`🚏 Plantillas Stops:            ${stats.stops}`);
    console.log(`📅 Departures:                  ${stats.departures}`);
    console.log('─'.repeat(60));

    console.log('\n⚠️  IMPORTANTE:');
    console.log('   Los usuarios tienen clerkId temporales.');
    console.log('   Debes actualizar los clerkId con tus cuentas reales de Clerk.');
    console.log('   Usuarios creados:');
    console.log(`   - ADMIN:   ${userAdmin.email} (clerkId: ${userAdmin.clerkId})`);
    console.log(`   - TI:      ${userTI.email} (clerkId: ${userTI.clerkId})`);
    console.log(`   - AGENTE1: ${userAgente1.email} (clerkId: ${userAgente1.clerkId})`);
    console.log(`   - AGENTE2: ${userAgente2.email} (clerkId: ${userAgente2.clerkId})`);

    console.log('\n🎯 PRÓXIMOS PASOS:');
    console.log('   1. Actualizar clerkId con tus cuentas reales');
    console.log('   2. Verificar que todas las APIs funcionan correctamente');
    console.log('   3. Probar el sistema completo');
    console.log('   4. Crear ventas de prueba para validar funcionalidades');
    console.log('   5. Configurar backups automáticos');

  } catch (error) {
    console.error('\n❌ ERROR DURANTE LA RESTAURACIÓN:');
    console.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar restauración
restoreCompleteSystem()
  .then(() => {
    console.log('\n✅ Script finalizado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script finalizado con errores');
    console.error(error);
    process.exit(1);
  });

