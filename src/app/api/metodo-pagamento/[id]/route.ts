import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

// PUT - Actualizar metodo de pagamento
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { metodoPagamento } = body;

    // Validaciones
    if (!metodoPagamento || metodoPagamento.trim() === '') {
      return NextResponse.json({ error: 'El campo metodo di pagamento es obligatorio' }, { status: 400 });
    }

    // Verificar que existe
    const existente = await prisma.metodoPagamento.findUnique({
      where: { id }
    });

    if (!existente) {
      return NextResponse.json({ error: 'Metodo di pagamento no encontrado' }, { status: 404 });
    }

    // Verificar si el nuevo nombre ya existe (excluyendo el actual)
    const duplicado = await prisma.metodoPagamento.findFirst({
      where: {
        metodoPagamento: metodoPagamento.trim(),
        id: { not: id }
      }
    });

    if (duplicado) {
      return NextResponse.json({ error: 'Este metodo di pagamento ya existe' }, { status: 400 });
    }

    // Actualizar
    const metodoPagamentoActualizado = await prisma.metodoPagamento.update({
      where: { id },
      data: {
        metodoPagamento: metodoPagamento.trim()
      }
    });

    return NextResponse.json({ 
      metodoPagamento: metodoPagamentoActualizado,
      message: 'Metodo di pagamento actualizado exitosamente' 
    });

  } catch (error) {
    console.error('Error updating metodo pagamento:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Eliminar metodo de pagamento (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Verificar que existe
    const existente = await prisma.metodoPagamento.findUnique({
      where: { id }
    });

    if (!existente) {
      return NextResponse.json({ error: 'Metodo di pagamento no encontrado' }, { status: 404 });
    }

    // Soft delete
    await prisma.metodoPagamento.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ 
      message: 'Metodo di pagamento eliminado exitosamente' 
    });

  } catch (error) {
    console.error('Error deleting metodo pagamento:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}




