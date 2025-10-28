import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

// GET - Listar todos los estados
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Sin verificación de rol - cualquier usuario autenticado puede ver
    const stati = await prisma.statoBus.findMany({
      where: { isActive: true },
      orderBy: { stato: 'asc' }
    });

    return NextResponse.json({ stati });

  } catch (error) {
    console.error('Error fetching stati:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Crear nuevo estado
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user || !['TI', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 });
    }

    const body = await request.json();
    const { stato } = body;

    if (!stato || stato.trim() === '') {
      return NextResponse.json({ error: 'El campo stato es obligatorio' }, { status: 400 });
    }

    const existente = await prisma.statoBus.findUnique({
      where: { stato: stato.trim() }
    });

    if (existente) {
      return NextResponse.json({ error: 'Este stato ya existe' }, { status: 400 });
    }

    const nuevoStato = await prisma.statoBus.create({
      data: { stato: stato.trim() }
    });

    return NextResponse.json({ 
      stato: nuevoStato,
      message: 'Stato creado exitosamente' 
    });

  } catch (error) {
    console.error('Error creating stato:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

