import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener fechas de viaje para el calendario
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Buscar el usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Ejecutar todas las consultas en paralelo para optimizar rendimiento
    const [busTours, aereoTours, agendasPersonales] = await Promise.all([
      // Obtener tours de bus con fechas
      prisma.tourBus.findMany({
        where: { 
          isActive: true,
          fechaViaje: { not: null }
        },
        select: {
          id: true,
          titulo: true,
          fechaViaje: true,
          fechaFin: true
        },
        orderBy: { fechaViaje: 'asc' }
      }),

      // Obtener tours aéreos con fechas
      prisma.tourAereo.findMany({
        where: { 
          isActive: true,
          fechaViaje: { not: null }
        },
        select: {
          id: true,
          titulo: true,
          fechaViaje: true,
          fechaFin: true
        },
        orderBy: { fechaViaje: 'asc' }
      }),

      // Obtener agendas personales del usuario (privadas) + agendas públicas de todos los usuarios
      prisma.agendaPersonal.findMany({
        where: { 
          OR: [
            { createdBy: user.id, isActive: true }, // Agendas del usuario actual
            { visibilidad: 'PUBLICO', isActive: true } // Agendas públicas de todos los usuarios
          ]
        },
        select: {
          id: true,
          titulo: true,
          fecha: true,
          tipo: true,
          color: true,
          visibilidad: true,
          createdBy: true,
          creator: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          recordatorio: {
            select: {
              diasAntes: true,
              isActivo: true
            }
          }
        },
        orderBy: { fecha: 'asc' }
      })
    ]);

    // Mapa de colores para optimizar asignación
    const agendaColors = {
      'PERSONAL': 'bg-purple-200 text-gray-800',
      'REUNION': 'bg-green-200 text-gray-800',
      'CITA': 'bg-orange-200 text-gray-800',
      'RECORDATORIO': 'bg-yellow-200 text-gray-800',
      'TAREA': 'bg-pink-200 text-gray-800'
    } as const;

    // Procesar todos los eventos en una sola pasada para optimizar rendimiento
    const allEvents = [
      // Procesar eventos de bus
      ...busTours.map(tour => ({
        id: `bus-${tour.id}`,
        title: tour.titulo,
        fechaViaje: tour.fechaViaje,
        fechaFin: tour.fechaFin,
        tipo: 'TOUR_BUS' as const,
        color: 'bg-blue-200 text-gray-800'
      })),
      
      // Procesar eventos aéreos
      ...aereoTours.map(tour => ({
        id: `aereo-${tour.id}`,
        title: tour.titulo,
        fechaViaje: tour.fechaViaje,
        fechaFin: tour.fechaFin,
        tipo: 'TOUR_AEREO' as const,
        color: 'bg-emerald-200 text-gray-800'
      })),
      
      // Procesar agendas personales
      ...agendasPersonales.map(agenda => {
        const isOwnAgenda = agenda.createdBy === user.id;
        const creatorName = agenda.creator 
          ? `${agenda.creator.firstName || ''} ${agenda.creator.lastName || ''}`.trim() || agenda.creator.email
          : 'Usuario';
        
        return {
          id: `personal-${agenda.id}`,
          title: agenda.visibilidad === 'PUBLICO' && !isOwnAgenda 
            ? `${agenda.titulo} (por ${creatorName})`
            : agenda.titulo,
          fechaViaje: agenda.fecha,
          fechaFin: null,
          tipo: 'AGENDA_PERSONAL' as const,
          color: agendaColors[agenda.tipo as keyof typeof agendaColors] || 'bg-purple-200 text-gray-800',
          agendaTipo: agenda.tipo,
          visibilidad: agenda.visibilidad,
          isOwn: isOwnAgenda,
          creator: creatorName,
          recordatorio: agenda.recordatorio
        };
      })
    ];

    // Calcular estadísticas de manera eficiente
    const stats = allEvents.reduce((acc, event) => {
      acc.total++;
      if (event.tipo === 'TOUR_BUS') acc.bus++;
      else if (event.tipo === 'TOUR_AEREO') acc.aereo++;
      else if (event.tipo === 'AGENDA_PERSONAL') acc.personal++;
      return acc;
    }, { total: 0, bus: 0, aereo: 0, personal: 0 });

    return NextResponse.json({
      success: true,
      events: allEvents,
      stats
    });

  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}
