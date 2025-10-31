import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET - Listar todos los servizios
export async function GET() {
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
      return NextResponse.json({ error: 'No tienes permisos para acceder' }, { status: 403 });
    }

    const servizios = await prisma.servizio.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ servizios });

  } catch (error) {
    console.error('Error fetching servizios:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Crear nuevo servizio
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
    const { servizio } = body;

    // Validaciones
    if (!servizio || servizio.trim() === '') {
      return NextResponse.json({ error: 'El campo servizio es obligatorio' }, { status: 400 });
    }

    // Verificar si ya existe
    const existente = await prisma.servizio.findUnique({
      where: { servizio: servizio.trim() }
    });

    if (existente) {
      return NextResponse.json({ error: 'Este servizio ya existe' }, { status: 400 });
    }

    // Crear el servizio
    const nuevoServizio = await prisma.servizio.create({
      data: {
        servizio: servizio.trim()
      }
    });

    return NextResponse.json({ 
      servizio: nuevoServizio,
      message: 'Servizio creado exitosamente' 
    });

  } catch (error) {
    console.error('Error creating servizio:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}




