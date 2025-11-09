import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { Prisma } from '@prisma/client';

const parseDate = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existingDetalle = await prisma.pasajeroServicioBiglietteria.findUnique({
      where: { id },
      include: {
        pasajero: {
          select: {
            id: true,
            nombrePasajero: true,
            estado: true,
            fechaPago: true,
            fechaActivacion: true,
            notas: true,
          },
        },
      },
    });

    if (!existingDetalle) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (!user || !['TI', 'ADMIN', 'USER'].includes(user.role)) {
      return NextResponse.json(
        { error: 'No tienes permisos para editar este registro' },
        { status: 403 }
      );
    }

    const updateData: Prisma.PasajeroServicioBiglietteriaUpdateInput = {};

    if (body.estado !== undefined) {
      updateData.estado = body.estado;
    }

    if (body.fechaPago !== undefined) {
      updateData.fechaPago = parseDate(body.fechaPago);
    }

    if (body.fechaActivacion !== undefined) {
      updateData.fechaActivacion = parseDate(body.fechaActivacion);
    }

    if (body.notas !== undefined) {
      updateData.notas = body.notas || null;
    }

    if (body.metodoDiAcquisto !== undefined) {
      updateData.metodoDiAcquisto = body.metodoDiAcquisto || null;
    }

    if (body.neto !== undefined) {
      const neto = parseFloat(body.neto);
      updateData.neto = Number.isNaN(neto) ? null : neto;
    }

    if (body.venduto !== undefined) {
      const venduto = parseFloat(body.venduto);
      updateData.venduto = Number.isNaN(venduto) ? null : venduto;
    }

    if (body.iata !== undefined) {
      updateData.iata = body.iata || null;
    }

    const updatedDetalle = await prisma.pasajeroServicioBiglietteria.update({
      where: { id },
      data: updateData,
      include: {
        pasajero: {
          select: {
            id: true,
            nombrePasajero: true,
            estado: true,
            fechaPago: true,
            fechaActivacion: true,
            notas: true,
          },
        },
      },
    });

    return NextResponse.json(updatedDetalle);
  } catch (error) {
    console.error('Error updating pasajero-servicio:', error);
    return NextResponse.json(
      {
        error: 'Error al actualizar el registro',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

