import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener agendas personales del usuario
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Buscar el usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const agendas = await prisma.agendaPersonal.findMany({
      where: { 
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
      },
      orderBy: { fechaInicio: 'asc' }
    });

    return NextResponse.json({ 
      success: true,
      agendas 
    });

  } catch (error) {
    console.error('Error fetching personal agendas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}

// POST - Crear nueva agenda personal
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Buscar el usuario en la base de datos
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

    // Validaciones
    if (!titulo || !fecha) {
      return NextResponse.json(
        { error: 'Título y fecha son requeridos' },
        { status: 400 }
      );
    }

    // Crear la agenda
    const agenda = await prisma.agendaPersonal.create({
      data: {
        titulo,
        descripcion: descripcion || null,
        fecha: new Date(fecha),
        tipo: tipo || 'PERSONAL',
        visibilidad: visibilidad || 'PRIVADO',
        createdBy: user.id
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

    // Crear recordatorio si se especifica
    if (recordatorio && recordatorio.diasAntes !== undefined) {
      await prisma.recordatorioAgenda.create({
        data: {
          agendaId: agenda.id,
          diasAntes: recordatorio.diasAntes,
          isActivo: recordatorio.isActivo !== false
        }
      });
    }

    return NextResponse.json({ 
      success: true,
      agenda,
      message: 'Agenda creada exitosamente' 
    });

  } catch (error) {
    console.error('Error creating personal agenda:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}
