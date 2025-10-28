import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// GET - Obtener todos los usuarios
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener todos los usuarios activos
    const users = await prisma.user.findMany({
      select: {
        clerkId: true,
        firstName: true,
        lastName: true,
        role: true,
        email: true
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    return NextResponse.json({ users });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}







