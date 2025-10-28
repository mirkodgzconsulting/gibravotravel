import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

// GET - Listar todos los IATA activos
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo verificar que el usuario esté autenticado (igual que clients y pagamento)
    // No restringir por rol para que funcione en el formulario

    const iataRecords = await prisma.iata.findMany({
      where: { isActive: true },
      orderBy: { iata: 'asc' }
    });

    return NextResponse.json(iataRecords);

  } catch (error) {
    console.error('Error fetching IATA records:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Crear nuevo IATA
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Para crear IATA, mantener restricción de rol
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user || !['TI', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'No tienes permisos para crear IATA' }, { status: 403 });
    }

    const body = await request.json();
    const { iata } = body;

    // Validaciones
    if (!iata || iata.trim() === '') {
      return NextResponse.json({ error: 'El campo IATA es obligatorio' }, { status: 400 });
    }

    // Verificar si ya existe
    const existente = await prisma.iata.findFirst({
      where: { iata: iata.trim() }
    });

    if (existente) {
      return NextResponse.json({ error: 'Este IATA ya existe' }, { status: 400 });
    }

    // Crear el IATA
    const nuevoIata = await prisma.iata.create({
      data: {
        iata: iata.trim()
      }
    });

    return NextResponse.json({ 
      iata: nuevoIata,
      message: 'IATA creado exitosamente' 
    });

  } catch (error) {
    console.error('Error creating IATA:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}