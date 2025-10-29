const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function backupDatabase() {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const backupDir = path.join(__dirname, '..', 'backups', `backup-${timestamp}`);
  
  // Crear directorio de backup si no existe
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log(`🗄️ Iniciando backup de base de datos - ${timestamp}`);
  console.log(`📁 Directorio de backup: ${backupDir}`);

  try {
    // Backup de todas las tablas principales
    const tables = [
      'User',
      'Client', 
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
      'Departure',
      'Route',
      'Stop',
      'FermataBus',
      'StatoBus',
      'Servizio',
      'MetodoPagamento',
      'Iata',
      'Info',
      'Pagamento',
      'Notificacion',
      'AgendaPersonal',
      'RecordatorioAgenda'
    ];

    const backupData = {};

    for (const table of tables) {
      try {
        console.log(`📊 Exportando tabla: ${table}`);
        const data = await prisma[table].findMany();
        backupData[table] = data;
        console.log(`✅ ${table}: ${data.length} registros exportados`);
      } catch (error) {
        console.log(`❌ Error exportando ${table}:`, error.message);
        backupData[table] = [];
      }
    }

    // Guardar backup completo
    const backupFile = path.join(backupDir, `database-backup-${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    // Crear resumen del backup
    const summary = {
      timestamp: new Date().toISOString(),
      tables: Object.keys(backupData).map(table => ({
        name: table,
        records: backupData[table].length
      })),
      totalRecords: Object.values(backupData).reduce((sum, records) => sum + records.length, 0)
    };

    const summaryFile = path.join(backupDir, `backup-summary-${timestamp}.json`);
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

    console.log(`\n🎉 BACKUP COMPLETADO EXITOSAMENTE`);
    console.log(`📁 Archivo principal: ${backupFile}`);
    console.log(`📋 Resumen: ${summaryFile}`);
    console.log(`📊 Total de registros: ${summary.totalRecords}`);
    console.log(`🗂️ Tablas exportadas: ${summary.tables.length}`);

    // Mostrar resumen por tabla
    console.log(`\n📋 RESUMEN POR TABLA:`);
    summary.tables.forEach(table => {
      console.log(`  ${table.name}: ${table.records} registros`);
    });

  } catch (error) {
    console.error('❌ Error durante el backup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backupDatabase();
