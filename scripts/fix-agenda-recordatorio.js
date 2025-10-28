const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAgendaRecordatorio() {
  try {
    console.log('🔧 Ajustando recordatorio de agenda...\n');
    
    // Buscar la agenda que acabamos de crear
    const agendas = await prisma.agendaPersonal.findMany({
      where: {
        titulo: {
          contains: 'Reunión Importante - 27 de Octubre'
        }
      },
      include: {
        recordatorio: true
      }
    });
    
    if (agendas.length === 0) {
      console.log('❌ No se encontró la agenda');
      return;
    }
    
    const agenda = agendas[0];
    console.log(`📋 Agenda encontrada: ${agenda.titulo}`);
    console.log(`   Fecha: ${new Date(agenda.fecha).toLocaleDateString()}`);
    
    // Calcular cuántos días faltan
    const fechaAgenda = new Date(agenda.fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fechaAgenda.setHours(0, 0, 0, 0);
    
    const diasFaltantes = Math.ceil((fechaAgenda.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    console.log(`   Días faltantes: ${diasFaltantes}`);
    
    if (agenda.recordatorio) {
      // Actualizar el recordatorio para que la notificación se cree hoy
      await prisma.recordatorioAgenda.update({
        where: { agendaId: agenda.id },
        data: {
          diasAntes: diasFaltantes - 1, // Si faltan 2 días, notificar en 1 día (hoy)
          isActivo: true
        }
      });
      
      console.log(`\n✅ Recordatorio actualizado a: ${diasFaltantes - 1} días antes`);
      console.log(`   La notificación se creará HOY para la agenda del ${new Date(agenda.fecha).toLocaleDateString()}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAgendaRecordatorio();


