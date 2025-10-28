import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// POST - Marcar notificación como leída
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    
    // Buscar el usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Verificar que la notificación pertenece al usuario
    const notificacion = await prisma.notificacion.findFirst({
      where: { 
        id,
        userId: user.id 
      }
    });

    if (!notificacion) {
      return NextResponse.json({ error: 'Notificación no encontrada' }, { status: 404 });
    }

    // Marcar como leída
    await prisma.notificacion.update({
      where: { id },
      data: { isLeida: true }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Notificación marcada como leída' 
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}


