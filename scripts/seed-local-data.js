#!/usr/bin/env node

/**
 * 🌱 GIBRAVO TRAVEL - SEED DATOS DE PRUEBA LOCAL
 * =============================================
 * 
 * Este script llena la base de datos local con datos de prueba
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedLocalData() {
  console.log('🌱 Sembrando datos de prueba en base de datos local...\n');

  try {
    // 1. Limpiar datos existentes
    console.log('🧹 Limpiando datos existentes...');
    await prisma.biglietteria.deleteMany();
    await prisma.client.deleteMany();
    await prisma.user.deleteMany();
    
    // Limpiar tablas de referencia
    await prisma.pagamento.deleteMany();
    await prisma.iata.deleteMany();
    await prisma.servizio.deleteMany();
    await prisma.metodoPagamento.deleteMany();
    await prisma.origine.deleteMany();

    // 2. Crear datos de referencia
    console.log('📋 Creando datos de referencia...');
    
    const pagamenti = await prisma.pagamento.createMany({
      data: [
        { pagamento: 'acconto' },
        { pagamento: 'acconto ricevuto' },
        { pagamento: 'verificare' },
        { pagamento: 'ricevuto' },
        { pagamento: 'da pagare' },
      ]
    });

    const iata = await prisma.iata.createMany({
      data: [
        { iata: 'suema' },
        { iata: 'ryan air' },
        { iata: 'flight genius' },
        { iata: 'kkm' },
        { iata: 'safer' },
        { iata: 'booking' },
      ]
    });

    const servizi = await prisma.servizio.createMany({
      data: [
        { servizio: 'biglietto' },
        { servizio: 'express' },
        { servizio: 'hotel' },
        { servizio: 'bagaglio' },
        { servizio: 'cambio data' },
        { servizio: 'polizza' },
        { servizio: 'lettera di invito' },
      ]
    });

    const metodiPagamento = await prisma.metodoPagamento.createMany({
      data: [
        { metodoPagamento: 'cash' },
        { metodoPagamento: 'PostePay' },
        { metodoPagamento: 'bonifico' },
        { metodoPagamento: 'POS' },
        { metodoPagamento: 'Western' },
        { metodoPagamento: 'RIA' },
      ]
    });

    const origini = await prisma.origine.createMany({
      data: [
        { origine: 'WhatsApp' },
        { origine: 'Facebook' },
        { origine: 'Cliente' },
        { origine: 'Passaparola' },
      ]
    });

    // 3. Crear usuario de prueba
    console.log('👤 Creando usuario de prueba...');
    const testUser = await prisma.user.create({
      data: {
        clerkId: 'test_user_local_dev',
        email: 'admin@gibravo.local',
        firstName: 'Admin',
        lastName: 'Local',
        role: 'ADMIN',
        isActive: true,
      }
    });

    // 4. Crear clientes de prueba
    console.log('👥 Creando clientes de prueba...');
    const clientes = await Promise.all([
      prisma.client.create({
        data: {
          firstName: 'Mario',
          lastName: 'Rossi',
          fiscalCode: 'RSSMRA80A01H501U',
          address: 'Via Roma 123, Milano',
          phoneNumber: '+39 333 123 4567',
          email: 'mario.rossi@email.com',
          birthPlace: 'Milano',
          birthDate: new Date('1980-01-01'),
          createdBy: testUser.clerkId,
        }
      }),
      prisma.client.create({
        data: {
          firstName: 'Giulia',
          lastName: 'Bianchi',
          fiscalCode: 'BNCGLI85B02H501V',
          address: 'Corso Italia 456, Roma',
          phoneNumber: '+39 333 987 6543',
          email: 'giulia.bianchi@email.com',
          birthPlace: 'Roma',
          birthDate: new Date('1985-02-15'),
          createdBy: testUser.clerkId,
        }
      }),
    ]);

    // 5. Crear tours de bus de prueba
    console.log('🚌 Creando tours de bus...');
    const tourBuses = await Promise.all([
      prisma.tourBus.create({
        data: {
          titulo: 'Tour Roma Clásica',
          descripcion: 'Visita guiada por los monumentos más importantes de Roma: Coliseo, Foro Romano, Palatino, Fontana de Trevi y Panteón.',
          acc: 'ROMA001',
          precioAdulto: 150.00,
          precioNino: 100.00,
          cantidadAsientos: 53,
          fechaViaje: new Date('2024-06-15'),
          createdBy: testUser.clerkId,
        }
      }),
      prisma.tourBus.create({
        data: {
          titulo: 'Excursión a Venecia',
          descripcion: 'Paseo en góndola por los canales de Venecia, visita a San Marco y tiempo libre para compras.',
          acc: 'VENEZIA002',
          precioAdulto: 200.00,
          precioNino: 150.00,
          cantidadAsientos: 53,
          fechaViaje: new Date('2024-07-20'),
          createdBy: testUser.clerkId,
        }
      }),
    ]);

    // 6. Crear registros de biglietteria de prueba
    console.log('🎫 Creando registros de biglietteria...');
    const biglietteria = await Promise.all([
      prisma.biglietteria.create({
        data: {
          pagamento: 'acconto ricevuto',
          data: new Date('2024-05-15'),
          iata: 'ryan air',
          pnr: 'RY123456',
          passeggero: 'Mario Rossi',
          itinerario: 'Milano - Roma',
          servizio: 'biglietto',
          neto: 80.00,
          venduto: 120.00,
          acconto: 120.00,
          daPagare: 0.00,
          metodoPagamento: 'cash',
          feeAgv: 40.00,
          origine: 'WhatsApp',
          cliente: 'Mario Rossi',
          codiceFiscale: 'RSSMRA80A01H501U',
          indirizzo: 'Via Roma 123, Milano',
          email: 'mario.rossi@email.com',
          numeroTelefono: '+39 333 123 4567',
          creadoPor: 'Admin Local',
        }
      }),
      prisma.biglietteria.create({
        data: {
          pagamento: 'da pagare',
          data: new Date('2024-05-16'),
          iata: 'flight genius',
          pnr: 'FG789012',
          passeggero: 'Giulia Bianchi',
          itinerario: 'Roma - Parigi',
          servizio: 'biglietto',
          neto: 150.00,
          venduto: 220.00,
          acconto: 50.00,
          daPagare: 170.00,
          metodoPagamento: 'bonifico',
          feeAgv: 70.00,
          origine: 'Facebook',
          cliente: 'Giulia Bianchi',
          codiceFiscale: 'BNCGLI85B02H501V',
          indirizzo: 'Corso Italia 456, Roma',
          email: 'giulia.bianchi@email.com',
          numeroTelefono: '+39 333 987 6543',
          creadoPor: 'Admin Local',
        }
      }),
    ]);

    console.log('\n✅ Datos de prueba creados exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`   - Usuarios: 1 (Admin Local)`);
    console.log(`   - Clientes: ${clientes.length}`);
    console.log(`   - Tours Bus: ${tourBuses.length}`);
    console.log(`   - Biglietteria: ${biglietteria.length}`);
    console.log(`   - Datos de referencia: ${pagamenti.count + iata.count + servizi.count + metodiPagamento.count + origini.count}`);

  } catch (error) {
    console.error('❌ Error sembrando datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedLocalData();
}

module.exports = { seedLocalData };

