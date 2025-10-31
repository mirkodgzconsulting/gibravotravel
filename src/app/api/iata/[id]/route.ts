import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// PUT - Actualizar iata
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
    const { iata } = body;

    // Validaciones
    if (!iata || iata.trim() === '') {
      return NextResponse.json({ error: 'El campo IATA es obligatorio' }, { status: 400 });
    }

    // Verificar que existe
    const existente = await prisma.iata.findUnique({
      where: { id }
    });

    if (!existente) {
      return NextResponse.json({ error: 'IATA no encontrado' }, { status: 404 });
    }

    // Verificar si el nuevo nombre ya existe (excluyendo el actual)
    const duplicado = await prisma.iata.findFirst({
      where: {
        iata: iata.trim(),
        id: { not: id }
      }
    });

    if (duplicado) {
      return NextResponse.json({ error: 'Este IATA ya existe' }, { status: 400 });
    }

    // Actualizar
    const iataActualizado = await prisma.iata.update({
      where: { id },
      data: {
        iata: iata.trim()
      }
    });

    return NextResponse.json({ 
      iata: iataActualizado,
      message: 'IATA actualizado exitosamente' 
    });

  } catch (error) {
    console.error('Error updating iata:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Eliminar iata (soft delete)
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
    const existente = await prisma.iata.findUnique({
      where: { id }
    });

    if (!existente) {
      return NextResponse.json({ error: 'IATA no encontrado' }, { status: 404 });
    }

    // Soft delete
    await prisma.iata.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ 
      message: 'IATA eliminado exitosamente' 
    });

  } catch (error) {
    console.error('Error deleting iata:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}




