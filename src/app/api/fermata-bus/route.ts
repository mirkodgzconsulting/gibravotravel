import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

// GET - Listar todas las fermate
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Sin verificación de rol - cualquier usuario autenticado puede ver
    const fermate = await prisma.fermataBus.findMany({
      where: { isActive: true },
      orderBy: { fermata: 'asc' }
    });

    return NextResponse.json({ fermate });

  } catch (error) {
    console.error('Error fetching fermate:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Crear nueva fermata
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario es TI o ADMIN
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user || !['TI', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 });
    }

    const body = await request.json();
    const { fermata } = body;

    if (!fermata || fermata.trim() === '') {
      return NextResponse.json({ error: 'El campo fermata es obligatorio' }, { status: 400 });
    }

    const existente = await prisma.fermataBus.findUnique({
      where: { fermata: fermata.trim() }
    });

    if (existente) {
      return NextResponse.json({ error: 'Esta fermata ya existe' }, { status: 400 });
    }

    const nuevaFermata = await prisma.fermataBus.create({
      data: { fermata: fermata.trim() }
    });

    return NextResponse.json({ 
      fermata: nuevaFermata,
      message: 'Fermata creada exitosamente' 
    });

  } catch (error) {
    console.error('Error creating fermata:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

