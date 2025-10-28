import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST - Cron job para generar notificaciones de agendas
// Este endpoint se debe llamar diariamente (ej: a las 00:00)
export async function POST(request: NextRequest) {
  try {
    // Verificar que viene de un cron job (opcional, para seguridad)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Si existe CRON_SECRET en .env, validar. Si no, permitir acceso (solo dev)
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log('🔔 Iniciando generación de notificaciones...');
    
    // Obtener todas las agendas personales activas con recordatorios activos
    const agendasConRecordatorios = await prisma.agendaPersonal.findMany({
      where: { 
        isActive: true 
      },
      include: {
        recordatorio: {
          where: {
            isActivo: true
          }
        },
        creator: {
          select: {
            id: true
          }
        }
      }
    });

    console.log(`📊 Total de agendas con recordatorios: ${agendasConRecordatorios.length}`);

    let notificacionesCreadas = 0;

    for (const agenda of agendasConRecordatorios) {
      if (!agenda.recordatorio || !agenda.recordatorio.isActivo) {
        continue;
      }

      const diasAntes = agenda.recordatorio.diasAntes;
      const fechaAgenda = new Date(agenda.fecha);
      const hoy = new Date();
      
      // Normalizar fechas para comparar solo día, mes y año
      hoy.setHours(0, 0, 0, 0);
      fechaAgenda.setHours(0, 0, 0, 0);
      
      // Calcular la fecha de inicio de notificaciones (fecha agenda - diasAntes)
      const fechaInicioNotif = new Date(fechaAgenda);
      fechaInicioNotif.setDate(fechaAgenda.getDate() - diasAntes);
      fechaInicioNotif.setHours(0, 0, 0, 0);
      
      // Verificar si estamos en el rango de notificación (desde diasAntes hasta la fecha del evento)
      // y que aún no haya pasado la fecha de la agenda
      if (hoy.getTime() >= fechaInicioNotif.getTime() && hoy.getTime() <= fechaAgenda.getTime()) {
        // Calcular cuántos días faltan para la agenda
        const diasFaltantes = Math.ceil((fechaAgenda.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        
        // Verificar si ya existe una notificación para esta agenda HOY
        const existeNotificacionHoy = await prisma.notificacion.findFirst({
          where: {
            agendaId: agenda.id,
            userId: agenda.creator.id,
            createdAt: {
              gte: new Date(hoy)
            }
          }
        });

        if (!existeNotificacionHoy) {
          // Crear mensaje personalizado según días faltantes
          let mensaje = '';
          if (diasFaltantes === 0) {
            mensaje = `📅 Hoy: "${agenda.titulo}"`;
          } else if (diasFaltantes === 1) {
            mensaje = `📅 Mañana: "${agenda.titulo}"`;
          } else {
            mensaje = `📅 En ${diasFaltantes} días: "${agenda.titulo}"`;
          }

          // Crear la notificación
          await prisma.notificacion.create({
            data: {
              userId: agenda.creator.id,
              agendaId: agenda.id,
              mensaje: mensaje,
              tipo: 'AGENDA',
              isLeida: false
            }
          });

          console.log(`  ✅ Notificación creada: ${mensaje}`);
          notificacionesCreadas++;
        }
      }
    }

    console.log(`✅ Proceso completado. Notificaciones creadas: ${notificacionesCreadas}`);

    return NextResponse.json({ 
      success: true,
      notificacionesCreadas,
      message: `Se crearon ${notificacionesCreadas} notificaciones` 
    });

  } catch (error) {
    console.error('❌ Error en cron de notificaciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}
