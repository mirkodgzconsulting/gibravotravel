import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

// GET - Listar todos los MetodoPagamento activos
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo verificar que el usuario esté autenticado (igual que clients y pagamento)
    // No restringir por rol para que funcione en el formulario

    const metodoPagamentoRecords = await prisma.metodoPagamento.findMany({
      where: { isActive: true },
      orderBy: { metodoPagamento: 'asc' }
    });

    return NextResponse.json({ metodosPagamento: metodoPagamentoRecords });

  } catch (error) {
    console.error('Error fetching MetodoPagamento records:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Crear nuevo MetodoPagamento
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Para crear MetodoPagamento, mantener restricción de rol
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user || !['TI', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'No tienes permisos para crear MetodoPagamento' }, { status: 403 });
    }

    const body = await request.json();
    const { metodoPagamento } = body;

    // Validaciones
    if (!metodoPagamento || metodoPagamento.trim() === '') {
      return NextResponse.json({ error: 'El campo MetodoPagamento es obligatorio' }, { status: 400 });
    }

    // Verificar si ya existe
    const existente = await prisma.metodoPagamento.findFirst({
      where: { metodoPagamento: metodoPagamento.trim() }
    });

    if (existente) {
      return NextResponse.json({ error: 'Este MetodoPagamento ya existe' }, { status: 400 });
    }

    // Crear el MetodoPagamento
    const nuevoMetodoPagamento = await prisma.metodoPagamento.create({
      data: {
        metodoPagamento: metodoPagamento.trim()
      }
    });

    return NextResponse.json({ 
      metodoPagamento: nuevoMetodoPagamento,
      message: 'MetodoPagamento creado exitosamente' 
    });

  } catch (error) {
    console.error('Error creating MetodoPagamento:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}