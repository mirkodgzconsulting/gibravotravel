import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET - Listar todos los Acquisto activos
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo verificar que el usuario esté autenticado (igual que clients y pagamento)
    // No restringir por rol para que funcione en el formulario

    const acquistiRecords = await prisma.acquisto.findMany({
      where: { isActive: true },
      orderBy: { acquisto: 'asc' }
    });

    return NextResponse.json({ acquisti: acquistiRecords });

  } catch (error) {
    console.error('Error fetching Acquisto records:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Crear nuevo Acquisto
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Para crear Acquisto, mantener restricción de rol
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user || !['TI', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'No tienes permisos para crear Acquisto' }, { status: 403 });
    }

    const body = await request.json();
    const { acquisto } = body;

    // Validaciones
    if (!acquisto || acquisto.trim() === '') {
      return NextResponse.json({ error: 'El campo Acquisto es obligatorio' }, { status: 400 });
    }

    // Verificar si ya existe
    const existente = await prisma.acquisto.findFirst({
      where: { acquisto: acquisto.trim() }
    });

    if (existente) {
      return NextResponse.json({ error: 'Este Acquisto ya existe' }, { status: 400 });
    }

    // Crear el Acquisto
    const nuevoAcquisto = await prisma.acquisto.create({
      data: {
        acquisto: acquisto.trim()
      }
    });

    return NextResponse.json({ 
      acquisto: nuevoAcquisto,
      message: 'Acquisto creado exitosamente' 
    });

  } catch (error) {
    console.error('Error creating Acquisto:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
