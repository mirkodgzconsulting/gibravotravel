import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET - Listar todos los pagamentos
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo verificar que el usuario esté autenticado (igual que clients)
    // No restringir por rol para que funcione en el formulario

    const pagamentos = await prisma.pagamento.findMany({
      where: { isActive: true },
      orderBy: { pagamento: 'asc' }
    });

    return NextResponse.json(pagamentos);

  } catch (error) {
    console.error('Error fetching pagamentos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Crear nuevo pagamento
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo verificar que el usuario esté autenticado
    // Para crear pagamentos, mantener restricción de rol
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user || !['TI', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'No tienes permisos para crear pagamentos' }, { status: 403 });
    }

    const body = await request.json();
    const { pagamento } = body;

    // Validaciones
    if (!pagamento || pagamento.trim() === '') {
      return NextResponse.json({ error: 'El campo pagamento es obligatorio' }, { status: 400 });
    }

    // Verificar si ya existe
    const existente = await prisma.pagamento.findUnique({
      where: { pagamento: pagamento.trim() }
    });

    if (existente) {
      return NextResponse.json({ error: 'Este pagamento ya existe' }, { status: 400 });
    }

    // Crear el pagamento
    const nuevoPagamento = await prisma.pagamento.create({
      data: {
        pagamento: pagamento.trim()
      }
    });

    return NextResponse.json({ 
      pagamento: nuevoPagamento,
      message: 'Pagamento creado exitosamente' 
    });

  } catch (error) {
    console.error('Error creating pagamento:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}




