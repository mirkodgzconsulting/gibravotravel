import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// POST - Marcar todas las notificaciones como leídas
export async function POST(request: NextRequest) {
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

    // Marcar todas las notificaciones no leídas como leídas
    await prisma.notificacion.updateMany({
      where: { 
        userId: user.id,
        isLeida: false 
      },
      data: { isLeida: true }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Todas las notificaciones marcadas como leídas' 
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}


