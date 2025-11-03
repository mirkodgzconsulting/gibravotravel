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
    const notificaciones = await prisma.notificacion.findMany({
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

    // Contar las no leídas
    const noLeidas = notificaciones.filter(n => !n.isLeida).length;

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