const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAgenda27() {
  try {
    console.log('🧪 Creando agenda para el 27 con recordatorio de 3 días...\n');
    
    // Buscar usuario TI
    const user = await prisma.user.findFirst({
      where: { email: 'ti@test.com' }
    });
    
    if (!user) {
      console.error('❌ Usuario no encontrado');
      return;
    }
    
    // Crear agenda para el día 27 (hoy es 25, el 27 es en 2 días)
    const fecha27 = new Date();
    fecha27.setDate(fecha27.getDate() + 2); // 25 + 2 = 27
    fecha27.setHours(14, 0, 0, 0);
    
    console.log(`📅 Fecha de agenda: ${fecha27.toLocaleString()}`);
    
    const agenda = await prisma.agendaPersonal.create({
      data: {
        titulo: 'Reunión Importante - 27 de Octubre',
        descripcion: 'Recordar traer documentación importante',
        fecha: fecha27,
        tipo: 'CITA',
        createdBy: user.id
      }
    });
    
    console.log('✅ Agenda creada:', agenda.id);
    
    // Crear recordatorio de 3 días antes
    const recordatorio = await prisma.recordatorioAgenda.create({
      data: {
        agendaId: agenda.id,
        diasAntes: 3,
        isActivo: true
      }
    });
    
    console.log('✅ Recordatorio creado:', recordatorio.id);
    
    // Calcular fecha de notificación
    const fechaNotificacion = new Date(fecha27);
    fechaNotificacion.setDate(fecha27.getDate() - 3);
    console.log(`\n📬 Fecha de notificación: ${fechaNotificacion.toLocaleDateString()}`);
    console.log(`   (Agenda: ${fecha27.toLocaleDateString()} - 3 días = ${fechaNotificacion.toLocaleDateString()})`);
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fechaNotificacion.setHours(0, 0, 0, 0);
    
    if (fechaNotificacion.getTime() === hoy.getTime()) {
      console.log('✅ HOY es la fecha de notificación - Ejecuta el cron ahora');
    } else if (fechaNotificacion.getTime() < hoy.getTime()) {
      console.log('⚠️  La fecha de notificación YA PASÓ');
    } else {
      console.log('⏳ La notificación se creará el:', fechaNotificacion.toLocaleDateString());
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAgenda27();


