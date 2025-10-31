import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// PUT - Actualizar pagamento
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
    const { pagamento } = body;

    // Validaciones
    if (!pagamento || pagamento.trim() === '') {
      return NextResponse.json({ error: 'El campo pagamento es obligatorio' }, { status: 400 });
    }

    // Verificar que existe
    const existente = await prisma.pagamento.findUnique({
      where: { id }
    });

    if (!existente) {
      return NextResponse.json({ error: 'Pagamento no encontrado' }, { status: 404 });
    }

    // Verificar si el nuevo nombre ya existe (excluyendo el actual)
    const duplicado = await prisma.pagamento.findFirst({
      where: {
        pagamento: pagamento.trim(),
        id: { not: id }
      }
    });

    if (duplicado) {
      return NextResponse.json({ error: 'Este pagamento ya existe' }, { status: 400 });
    }

    // Actualizar
    const pagamentoActualizado = await prisma.pagamento.update({
      where: { id },
      data: {
        pagamento: pagamento.trim()
      }
    });

    return NextResponse.json({ 
      pagamento: pagamentoActualizado,
      message: 'Pagamento actualizado exitosamente' 
    });

  } catch (error) {
    console.error('Error updating pagamento:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Eliminar pagamento (soft delete)
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
    const existente = await prisma.pagamento.findUnique({
      where: { id }
    });

    if (!existente) {
      return NextResponse.json({ error: 'Pagamento no encontrado' }, { status: 404 });
    }

    // Soft delete
    await prisma.pagamento.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ 
      message: 'Pagamento eliminado exitosamente' 
    });

  } catch (error) {
    console.error('Error deleting pagamento:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}




