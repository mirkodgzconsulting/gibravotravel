const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestAgenda() {
  try {
    console.log('🧪 Creando agenda de prueba...\n');
    
    // Buscar usuario TI
    const user = await prisma.user.findFirst({
      where: { email: 'ti@test.com' }
    });
    
    if (!user) {
      console.error('❌ Usuario no encontrado');
      return;
    }
    
    // Crear agenda para mañana
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    manana.setHours(10, 0, 0, 0);
    
    const agenda = await prisma.agendaPersonal.create({
      data: {
        titulo: 'TEST - Reunión Mañana',
        descripcion: 'Esta es una agenda de prueba',
        fecha: manana,
        tipo: 'CITA',
        createdBy: user.id
      }
    });
    
    console.log('✅ Agenda creada:', agenda.id);
    
    // Crear recordatorio de 1 día
    const recordatorio = await prisma.recordatorioAgenda.create({
      data: {
        agendaId: agenda.id,
        diasAntes: 1,
        isActivo: true
      }
    });
    
    console.log('✅ Recordatorio creado:', recordatorio.id);
    console.log('\n📋 La notificación se creará HOY para la agenda de MAÑANA');
    console.log('   Ejecuta el cron con: node scripts/test-cron-notificaciones.js');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestAgenda();


