import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener las habitaciones y asignaciones de un tour
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: tourId } = await params;

    // Obtener todas las habitaciones del tour con sus asignaciones
    const stanze = await prisma.stanzaTourAereo.findMany({
      where: {
        tourAereoId: tourId,
      },
      include: {
        asignaciones: {
          include: {
            ventaTourAereo: {
              select: {
                id: true,
                pasajero: true,
                email: true,
                numeroTelefono: true,
                paisOrigen: true,
                iata: true,
                pnr: true,
                stato: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json({ stanze });
  } catch (error) {
    console.error('Error fetching stanze:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Guardar las habitaciones y asignaciones de un tour
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: tourId } = await params;
    const body = await request.json();
    const { habitaciones } = body;

    // Validar que el tour existe
    const tour = await prisma.tourAereo.findUnique({
      where: { id: tourId },
    });

    if (!tour) {
      return NextResponse.json(
        { error: 'Tour no encontrado' },
        { status: 404 }
      );
    }

    // Usar transacción para asegurar consistencia
    const result = await prisma.$transaction(async (tx) => {
      // 1. Eliminar todas las habitaciones existentes del tour
      // Gracias a 'onDelete: Cascade' en el schema, esto eliminará automáticamente las asignaciones
      await tx.stanzaTourAereo.deleteMany({
        where: { tourAereoId: tourId },
      });

      // 2. Crear las nuevas habitaciones y asignaciones
      for (const habitacion of habitaciones) {
        // Mapear el tipo a la versión de BD (Family Room -> FamilyRoom)
        const tipoBD = habitacion.tipo === 'Family Room' ? 'FamilyRoom' : habitacion.tipo;

        // Crear la habitación con sus asignaciones en un solo paso
        await tx.stanzaTourAereo.create({
          data: {
            tourAereoId: tourId,
            tipo: tipoBD,
            note: habitacion.note || '',
            asignaciones: {
              create: (habitacion.pasajeros || []).map((pasajeroId: string) => ({
                ventaTourAereoId: pasajeroId,
              })),
            },
          },
        });
      }

      // 3. Obtener todas las habitaciones creadas con sus asignaciones en una sola consulta
      return await tx.stanzaTourAereo.findMany({
        where: { tourAereoId: tourId },
        include: {
          asignaciones: {
            include: {
              ventaTourAereo: {
                select: {
                  id: true,
                  pasajero: true,
                  email: true,
                  numeroTelefono: true,
                  paisOrigen: true,
                  iata: true,
                  pnr: true,
                  stato: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
    }, {
      timeout: 20000 // Aumentar el tiempo de espera a 20 segundos para evitar errores en producción
    });

    return NextResponse.json({
      success: true,
      stanze: result,
      message: 'Organizzazione stanze salvata con successo',
    });
  } catch (error) {
    console.error('Error saving stanze:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

