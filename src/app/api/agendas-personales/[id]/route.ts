import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener agenda específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const agenda = await prisma.agendaPersonal.findFirst({
      where: { 
        id,
        createdBy: user.id,
        isActive: true 
      },
      include: {
        recordatorio: true,
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!agenda) {
      return NextResponse.json({ error: 'Agenda no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      agenda 
    });

  } catch (error) {
    console.error('Error fetching agenda:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}

// PUT - Actualizar agenda
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { 
      titulo, 
      descripcion, 
      fecha, 
      tipo, 
      visibilidad,
      recordatorio 
    } = body;

    // Verificar que la agenda existe y pertenece al usuario
    const agendaExistente = await prisma.agendaPersonal.findFirst({
      where: { 
        id,
        createdBy: user.id,
        isActive: true 
      }
    });

    if (!agendaExistente) {
      return NextResponse.json({ error: 'Agenda no encontrada' }, { status: 404 });
    }

    // Actualizar la agenda
    const agenda = await prisma.agendaPersonal.update({
      where: { id },
      data: {
        titulo: titulo || agendaExistente.titulo,
        descripcion: descripcion !== undefined ? descripcion : agendaExistente.descripcion,
        fecha: fecha ? new Date(fecha) : agendaExistente.fecha,
        tipo: tipo || agendaExistente.tipo,
        visibilidad: visibilidad || agendaExistente.visibilidad || 'PRIVADO'
      },
      include: {
        recordatorio: true,
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Actualizar o crear recordatorio
    if (recordatorio) {
      await prisma.recordatorioAgenda.upsert({
        where: { agendaId: id },
        update: {
          diasAntes: recordatorio.diasAntes,
          isActivo: recordatorio.isActivo !== false
        },
        create: {
          agendaId: id,
          diasAntes: recordatorio.diasAntes,
          isActivo: recordatorio.isActivo !== false
        }
      });
    }

    return NextResponse.json({ 
      success: true,
      agenda,
      message: 'Agenda actualizada exitosamente' 
    });

  } catch (error) {
    console.error('Error updating agenda:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}

// DELETE - Eliminar agenda (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Verificar que la agenda existe y pertenece al usuario
    const agendaExistente = await prisma.agendaPersonal.findFirst({
      where: { 
        id,
        createdBy: user.id,
        isActive: true 
      }
    });

    if (!agendaExistente) {
      return NextResponse.json({ error: 'Agenda no encontrada' }, { status: 404 });
    }

    // Soft delete
    await prisma.agendaPersonal.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Agenda eliminada exitosamente' 
    });

  } catch (error) {
    console.error('Error deleting agenda:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}
