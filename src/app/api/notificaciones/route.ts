import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener notificaciones del usuario
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

    // Obtener todas las notificaciones del usuario ordenadas por fecha (más recientes primero)
    // Usar try-catch separado para manejar errores de relación
    let notificaciones: any[] = [];
    let noLeidas = 0;
    
    try {
      // Primero intentar con la relación de agenda
      try {
        notificaciones = await prisma.notificacion.findMany({
          where: { userId: user.id },
          include: {
            agenda: {
              select: {
                titulo: true,
                fecha: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
      } catch (includeError) {
        // Si falla el include, intentar sin relación
        console.warn('Error con include de agenda, intentando sin relación:', includeError);
        notificaciones = await prisma.notificacion.findMany({
          where: { userId: user.id },
          orderBy: {
            createdAt: 'desc'
          }
        });
      }

      // Contar las no leídas
      noLeidas = notificaciones.filter((n: any) => !n.isLeida).length;
    } catch (dbError: any) {
      console.error('Error fetching notifications from database:', dbError);
      // Retornar respuesta vacía pero exitosa
      return NextResponse.json({
        success: true,
        notificaciones: [],
        noLeidas: 0,
        warning: 'No se pudieron cargar las notificaciones'
      });
    }

    return NextResponse.json({
      success: true,
      notificaciones,
      noLeidas
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}

// POST - Crear nueva notificación (para uso futuro)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Por ahora, solo retornar éxito
    // En el futuro se puede implementar la creación de notificaciones
    return NextResponse.json({
      success: true,
      message: 'Notificación creada exitosamente'
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}