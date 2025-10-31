import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET - Listar todas las ventas de asientos
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tourId = searchParams.get('tourId');

    // Buscar el usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    let whereCondition = {};

    // Si se especifica un tour específico
    if (tourId) {
      whereCondition = { tourBusId: tourId };
    }

    // Los usuarios USER pueden ver todas las ventas para realizar ventas

    const ventas = await prisma.ventaAsiento.findMany({
      where: whereCondition,
      include: {
        tourBus: {
          select: {
            id: true,
            titulo: true,
            precioAdulto: true,
            cantidadAsientos: true
          }
        }
      },
      orderBy: {
        fechaVenta: 'desc'
      }
    });

    return NextResponse.json({ ventas });

  } catch (error) {
    console.error('Error fetching ventas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}






