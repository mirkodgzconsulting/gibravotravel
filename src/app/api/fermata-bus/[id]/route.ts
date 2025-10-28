import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

// PUT - Actualizar fermata
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
    const { fermata } = body;

    if (!fermata || fermata.trim() === '') {
      return NextResponse.json({ error: 'El campo fermata es obligatorio' }, { status: 400 });
    }

    const existente = await prisma.fermataBus.findUnique({ where: { id } });
    if (!existente) {
      return NextResponse.json({ error: 'Fermata no encontrada' }, { status: 404 });
    }

    const duplicado = await prisma.fermataBus.findFirst({
      where: { fermata: fermata.trim(), id: { not: id } }
    });

    if (duplicado) {
      return NextResponse.json({ error: 'Esta fermata ya existe' }, { status: 400 });
    }

    const fermataActualizada = await prisma.fermataBus.update({
      where: { id },
      data: { fermata: fermata.trim() }
    });

    return NextResponse.json({ 
      fermata: fermataActualizada,
      message: 'Fermata actualizada exitosamente' 
    });

  } catch (error) {
    console.error('Error updating fermata:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Eliminar fermata (soft delete)
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
    const existente = await prisma.fermataBus.findUnique({ where: { id } });
    
    if (!existente) {
      return NextResponse.json({ error: 'Fermata no encontrada' }, { status: 404 });
    }

    await prisma.fermataBus.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ message: 'Fermata eliminada exitosamente' });

  } catch (error) {
    console.error('Error deleting fermata:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}




