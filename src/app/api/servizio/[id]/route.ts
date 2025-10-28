import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

// PUT - Actualizar servizio
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
    const { servizio } = body;

    // Validaciones
    if (!servizio || servizio.trim() === '') {
      return NextResponse.json({ error: 'El campo servizio es obligatorio' }, { status: 400 });
    }

    // Verificar que existe
    const existente = await prisma.servizio.findUnique({
      where: { id }
    });

    if (!existente) {
      return NextResponse.json({ error: 'Servizio no encontrado' }, { status: 404 });
    }

    // Verificar si el nuevo nombre ya existe (excluyendo el actual)
    const duplicado = await prisma.servizio.findFirst({
      where: {
        servizio: servizio.trim(),
        id: { not: id }
      }
    });

    if (duplicado) {
      return NextResponse.json({ error: 'Este servizio ya existe' }, { status: 400 });
    }

    // Actualizar
    const servizioActualizado = await prisma.servizio.update({
      where: { id },
      data: {
        servizio: servizio.trim()
      }
    });

    return NextResponse.json({ 
      servizio: servizioActualizado,
      message: 'Servizio actualizado exitosamente' 
    });

  } catch (error) {
    console.error('Error updating servizio:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Eliminar servizio (soft delete)
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
    const existente = await prisma.servizio.findUnique({
      where: { id }
    });

    if (!existente) {
      return NextResponse.json({ error: 'Servizio no encontrado' }, { status: 404 });
    }

    // Soft delete
    await prisma.servizio.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ 
      message: 'Servizio eliminado exitosamente' 
    });

  } catch (error) {
    console.error('Error deleting servizio:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}




