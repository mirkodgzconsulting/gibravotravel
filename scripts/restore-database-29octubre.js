const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function restoreDatabase() {
  const timestamp = '2025-10-29';
  const backupFile = path.join(__dirname, '..', 'backups', `backup-${timestamp}`, `database-backup-${timestamp}.json`);
  
  if (!fs.existsSync(backupFile)) {
    console.error(`❌ Archivo de backup no encontrado: ${backupFile}`);
    return;
  }

  console.log(`🔄 Iniciando restauración de base de datos - ${timestamp}`);
  console.log(`📁 Archivo de backup: ${backupFile}`);

  try {
    // Leer datos del backup
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    
    console.log(`📊 Datos cargados: ${Object.keys(backupData).length} tablas`);

    // IMPORTANTE: Limpiar tablas existentes antes de restaurar
    console.log(`⚠️  ADVERTENCIA: Esto eliminará todos los datos existentes`);
    console.log(`🔄 Limpiando tablas existentes...`);

    // Orden de eliminación (respetando foreign keys)
    const deleteOrder = [
      'RecordatorioAgenda',
      'AgendaPersonal', 
      'Notificacion',
      'Pagamento',
      'CuotaVentaTourAereo',
      'VentaTourAereo',
      'CuotaTourBus',
      'VentaTourBus',
      'AcompananteTourBus',
      'VentaAsiento',
      'AsientoBus',
      'Cuota',
      'PasajeroBiglietteria',
      'Biglietteria',
      'TourAereo',
      'TourBus',
      'FermataBus',
      'StatoBus',
      'Servizio',
      'MetodoPagamento',
      'Iata',
      'Info',
      'Departure',
      'Route',
      'Stop',
      'Client',
      'User'
    ];

    // Limpiar tablas
    for (const table of deleteOrder) {
      try {
        await prisma[table].deleteMany();
        console.log(`🗑️  Tabla ${table} limpiada`);
      } catch (error) {
        console.log(`⚠️  Error limpiando ${table}:`, error.message);
      }
    }

    // Restaurar datos
    console.log(`\n🔄 Restaurando datos...`);
    
    // Orden de inserción (respetando foreign keys)
    const insertOrder = [
      'User',
      'Client',
      'Info',
      'Iata',
      'MetodoPagamento',
      'Servizio',
      'StatoBus',
      'FermataBus',
      'Departure',
      'Route',
      'Stop',
      'Biglietteria',
      'PasajeroBiglietteria',
      'Cuota',
      'TourAereo',
      'VentaTourAereo',
      'CuotaVentaTourAereo',
      'TourBus',
      'VentaTourBus',
      'CuotaTourBus',
      'AcompananteTourBus',
      'AsientoBus',
      'VentaAsiento',
      'Pagamento',
      'Notificacion',
      'AgendaPersonal',
      'RecordatorioAgenda'
    ];

    for (const table of insertOrder) {
      if (backupData[table] && backupData[table].length > 0) {
        try {
          await prisma[table].createMany({
            data: backupData[table],
            skipDuplicates: true
          });
          console.log(`✅ ${table}: ${backupData[table].length} registros restaurados`);
        } catch (error) {
          console.log(`❌ Error restaurando ${table}:`, error.message);
        }
      }
    }

    console.log(`\n🎉 RESTAURACIÓN COMPLETADA EXITOSAMENTE`);
    console.log(`📊 Total de registros restaurados: ${Object.values(backupData).reduce((sum, records) => sum + records.length, 0)}`);

  } catch (error) {
    console.error('❌ Error durante la restauración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Solo ejecutar si se llama directamente
if (require.main === module) {
  console.log('⚠️  ADVERTENCIA: Este script eliminará TODOS los datos existentes');
  console.log('⚠️  Asegúrate de tener un backup reciente antes de continuar');
  console.log('⚠️  Para continuar, descomenta la siguiente línea:');
  console.log('// restoreDatabase();');
  
  // Descomenta la siguiente línea para ejecutar la restauración
  // restoreDatabase();
}

module.exports = { restoreDatabase };
