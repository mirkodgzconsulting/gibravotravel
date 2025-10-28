const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function recreateRecordatorios() {
  try {
    console.log('🔄 Recreando recordatorios...');
    
    // Obtener todas las agendas personales
    const agendas = await prisma.agendaPersonal.findMany({
      where: { isActive: true }
    });
    
    console.log(`📊 Total de agendas: ${agendas.length}`);
    
    for (const agenda of agendas) {
      // Verificar si ya existe un recordatorio
      const existingRecordatorio = await prisma.recordatorioAgenda.findUnique({
        where: { agendaId: agenda.id }
      });
      
      if (existingRecordatorio) {
        console.log(`  └─ Agenda ${agenda.id} ya tiene recordatorio, actualizando...`);
        
        // Actualizar a diasAntes = 0 (mismo día)
        await prisma.recordatorioAgenda.update({
          where: { agendaId: agenda.id },
          data: { diasAntes: 0 }
        });
      } else {
        console.log(`  └─ Agenda ${agenda.id} creando nuevo recordatorio...`);
        
        // Crear nuevo recordatorio con diasAntes = 0 (mismo día)
        await prisma.recordatorioAgenda.create({
          data: {
            agendaId: agenda.id,
            diasAntes: 0,
            isActivo: false
          }
        });
      }
    }
    
    console.log('✅ Recordatorios recreados exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la recreación:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

recreateRecordatorios();


