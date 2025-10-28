const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function backupDatabase() {
  console.log('🗄️ Iniciando backup completo de la base de datos...');
  
  const backupData = {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    tables: {}
  };

  try {
    // 1. Usuarios
    console.log('📊 Respaldando usuarios...');
    backupData.tables.users = await prisma.user.findMany();
    console.log(`✅ ${backupData.tables.users.length} usuarios respaldados`);

    // 2. Clientes
    console.log('👥 Respaldando clientes...');
    backupData.tables.clients = await prisma.client.findMany();
    console.log(`✅ ${backupData.tables.clients.length} clientes respaldados`);

    // 3. Biglietteria
    console.log('🎫 Respaldando biglietteria...');
    backupData.tables.biglietteria = await prisma.biglietteria.findMany({
      include: {
        pasajeros: true,
        cuotas: true,
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    console.log(`✅ ${backupData.tables.biglietteria.length} registros de biglietteria respaldados`);

    // 4. Tours Bus
    console.log('🚌 Respaldando tours bus...');
    backupData.tables.tourBuses = await prisma.tourBus.findMany({
      include: {
        asientos: true,
        ventas: true,
        ventasTourBus: {
          include: {
            acompanantes: true,
            cuotas: true
          }
        },
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    console.log(`✅ ${backupData.tables.tourBuses.length} tours bus respaldados`);

    // 5. Tours Aereo
    console.log('✈️ Respaldando tours aereo...');
    backupData.tables.tourAereos = await prisma.tourAereo.findMany({
      include: {
        ventas: {
          include: {
            cuotas: true
          }
        },
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    console.log(`✅ ${backupData.tables.tourAereos.length} tours aereo respaldados`);

    // 6. Agendas Personales
    console.log('📅 Respaldando agendas personales...');
    backupData.tables.agendasPersonales = await prisma.agendaPersonal.findMany({
      include: {
        recordatorio: true,
        notificaciones: true,
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    console.log(`✅ ${backupData.tables.agendasPersonales.length} agendas respaldadas`);

    // 7. Notificaciones
    console.log('🔔 Respaldando notificaciones...');
    backupData.tables.notificaciones = await prisma.notificacion.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        agenda: {
          select: {
            id: true,
            titulo: true
          }
        }
      }
    });
    console.log(`✅ ${backupData.tables.notificaciones.length} notificaciones respaldadas`);

    // 8. Datos maestros
    console.log('📋 Respaldando datos maestros...');
    backupData.tables.pagamentos = await prisma.pagamento.findMany();
    backupData.tables.iata = await prisma.iata.findMany();
    backupData.tables.servizios = await prisma.servizio.findMany();
    backupData.tables.metodoPagamentos = await prisma.metodoPagamento.findMany();
    backupData.tables.fermataBuses = await prisma.fermataBus.findMany();
    backupData.tables.statoBuses = await prisma.statoBus.findMany();
    backupData.tables.info = await prisma.info.findMany();
    backupData.tables.routes = await prisma.route.findMany();
    backupData.tables.stops = await prisma.stop.findMany();

    console.log(`✅ Datos maestros respaldados:`);
    console.log(`   - Pagamentos: ${backupData.tables.pagamentos.length}`);
    console.log(`   - IATA: ${backupData.tables.iata.length}`);
    console.log(`   - Servizios: ${backupData.tables.servizios.length}`);
    console.log(`   - Metodo Pagamentos: ${backupData.tables.metodoPagamentos.length}`);
    console.log(`   - Fermata Buses: ${backupData.tables.fermataBuses.length}`);
    console.log(`   - Stato Buses: ${backupData.tables.statoBuses.length}`);
    console.log(`   - Info: ${backupData.tables.info.length}`);
    console.log(`   - Routes: ${backupData.tables.routes.length}`);
    console.log(`   - Stops: ${backupData.tables.stops.length}`);

    // 9. Guardar backup
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup-completo-${timestamp}.json`);
    
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    console.log(`\n🎉 Backup completo guardado en: ${backupFile}`);
    console.log(`📊 Resumen del backup:`);
    console.log(`   - Usuarios: ${backupData.tables.users.length}`);
    console.log(`   - Clientes: ${backupData.tables.clients.length}`);
    console.log(`   - Biglietteria: ${backupData.tables.biglietteria.length}`);
    console.log(`   - Tours Bus: ${backupData.tables.tourBuses.length}`);
    console.log(`   - Tours Aereo: ${backupData.tables.tourAereos.length}`);
    console.log(`   - Agendas: ${backupData.tables.agendasPersonales.length}`);
    console.log(`   - Notificaciones: ${backupData.tables.notificaciones.length}`);
    
    const fileSize = (fs.statSync(backupFile).size / 1024 / 1024).toFixed(2);
    console.log(`   - Tamaño del archivo: ${fileSize} MB`);

  } catch (error) {
    console.error('❌ Error durante el backup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar backup
backupDatabase()
  .then(() => {
    console.log('\n✅ Backup completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error en el backup:', error);
    process.exit(1);
  });
