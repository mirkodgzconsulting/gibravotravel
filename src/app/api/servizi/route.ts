import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// GET - Obtener todos los servicios activos
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const servizi = await prisma.servizio.findMany({
      where: { isActive: true },
      select: {
        id: true,
        servizio: true,
        isActive: true
      },
      orderBy: {
        servizio: 'asc'
      }
    });

    return NextResponse.json(servizi);

  } catch (error) {
    console.error('Error fetching servizi:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

