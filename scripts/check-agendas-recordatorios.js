const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAgendas() {
  try {
    console.log('🔍 Revisando agendas y recordatorios...\n');
    
    const agendas = await prisma.agendaPersonal.findMany({
      include: {
        recordatorio: true,
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    console.log(`📊 Total de agendas: ${agendas.length}\n`);
    
    for (const agenda of agendas) {
      console.log(`📋 Agenda: "${agenda.titulo}"`);
      console.log(`   ID: ${agenda.id}`);
      console.log(`   Fecha: ${agenda.fecha}`);
      console.log(`   Usuario: ${agenda.creator.firstName} ${agenda.creator.lastName} (${agenda.creator.email})`);
      console.log(`   Recordatorio:`, agenda.recordatorio ? '✅' : '❌');
      if (agenda.recordatorio) {
        console.log(`     - Días antes: ${agenda.recordatorio.diasAntes}`);
        console.log(`     - Activo: ${agenda.recordatorio.isActivo ? 'Sí' : 'No'}`);
        
        // Calcular fecha de notificación
        const fechaAgenda = new Date(agenda.fecha);
        const fechaNotificacion = new Date(fechaAgenda);
        fechaNotificacion.setDate(fechaAgenda.getDate() - agenda.recordatorio.diasAntes);
        console.log(`     - Fecha notificación: ${fechaNotificacion.toLocaleDateString()}`);
        
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        fechaNotificacion.setHours(0, 0, 0, 0);
        const coincide = fechaNotificacion.getTime() === hoy.getTime();
        console.log(`     - ¿Hoy es fecha de notificación?: ${coincide ? '✅ SÍ' : '❌ NO'}`);
      }
      console.log('');
    }
    
    // Verificar notificaciones existentes
    const notificaciones = await prisma.notificacion.findMany({
      include: {
        agenda: {
          select: {
            titulo: true
          }
        }
      }
    });
    
    console.log(`📬 Total de notificaciones: ${notificaciones.length}`);
    for (const notif of notificaciones) {
      console.log(`   - ${notif.mensaje} (Leída: ${notif.isLeida ? 'Sí' : 'No'})`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAgendas();


