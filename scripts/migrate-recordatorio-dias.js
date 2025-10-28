const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateRecordatorios() {
  try {
    console.log('🔄 Iniciando migración de recordatorios...');
    
    // Obtener todos los recordatorios existentes
    const recordatorios = await prisma.recordatorioAgenda.findMany();
    
    console.log(`📊 Total de recordatorios: ${recordatorios.length}`);
    
    // Convertir minutos a días (asumiendo que si es >= 1440 minutos = 1 día)
    for (const recordatorio of recordatorios) {
      // Calcular días basándose en minutos
      // Si minutosAntes >= 1440 (1 día), convertirlo a días
      // Si es menos de 1440, considerarlo "mismo día" (0)
      let diasAntes = 0;
      
      if (recordatorio.minutosAntes >= 1440) {
        diasAntes = Math.floor(recordatorio.minutosAntes / 1440);
        // Limitar a máximo 5 días
        if (diasAntes > 5) diasAntes = 5;
      }
      
      console.log(`  └─ Recordatorio ${recordatorio.id}: ${recordatorio.minutosAntes} minutos → ${diasAntes} días`);
      
      // Actualizar con el nuevo campo diasAntes
      await prisma.$executeRaw`
        UPDATE recordatorios_agenda 
        SET "diasAntes" = ${diasAntes}
        WHERE id = ${recordatorio.id}
      `;
    }
    
    console.log('✅ Migración completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateRecordatorios();


