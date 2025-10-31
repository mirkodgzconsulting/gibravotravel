import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// PUT - Actualizar stato
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { stato } = body;

    if (!stato || stato.trim() === '') {
      return NextResponse.json({ error: 'El campo stato es obligatorio' }, { status: 400 });
    }

    const existente = await prisma.statoBus.findUnique({ where: { id } });
    if (!existente) {
      return NextResponse.json({ error: 'Stato no encontrado' }, { status: 404 });
    }

    const duplicado = await prisma.statoBus.findFirst({
      where: { stato: stato.trim(), id: { not: id } }
    });

    if (duplicado) {
      return NextResponse.json({ error: 'Este stato ya existe' }, { status: 400 });
    }

    const statoActualizado = await prisma.statoBus.update({
      where: { id },
      data: { stato: stato.trim() }
    });

    return NextResponse.json({ 
      stato: statoActualizado,
      message: 'Stato actualizado exitosamente' 
    });

  } catch (error) {
    console.error('Error updating stato:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Eliminar stato (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const existente = await prisma.statoBus.findUnique({ where: { id } });
    
    if (!existente) {
      return NextResponse.json({ error: 'Stato no encontrado' }, { status: 404 });
    }

    await prisma.statoBus.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ message: 'Stato eliminado exitosamente' });

  } catch (error) {
    console.error('Error deleting stato:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}




