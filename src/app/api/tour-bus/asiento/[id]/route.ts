import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

// PUT - Vender/Reservar un asiento
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { 
      clienteNombre, 
      clienteTelefono, 
      clienteEmail, 
      precioVenta, 
      metodoPago, 
      observaciones 
    } = body;

    // Validaciones
    if (!clienteNombre || !precioVenta) {
      return NextResponse.json({ error: 'Nombre del cliente y precio son obligatorios' }, { status: 400 });
    }

    // Verificar que el asiento existe y no está vendido
    const asiento = await prisma.asientoBus.findUnique({
      where: { id },
      include: { tourBus: true }
    });

    if (!asiento) {
      return NextResponse.json({ error: 'Asiento no encontrado' }, { status: 404 });
    }

    if (asiento.isVendido) {
      return NextResponse.json({ error: 'Este asiento ya está vendido' }, { status: 400 });
    }

    // Verificar que el tour está activo
    if (!asiento.tourBus.isActive) {
      return NextResponse.json({ error: 'Este tour no está activo' }, { status: 400 });
    }

    // Usar transacción para vender el asiento y crear la venta
    const resultado = await prisma.$transaction(async (tx) => {
      // Actualizar el asiento
      const asientoActualizado = await tx.asientoBus.update({
        where: { id },
        data: {
          isVendido: true,
          precioVenta: parseFloat(precioVenta),
          fechaVenta: new Date(),
          clienteNombre,
          clienteTelefono: clienteTelefono || null,
          clienteEmail: clienteEmail || null,
          observaciones: observaciones || null
        }
      });

      // Crear el registro de venta
      const venta = await tx.ventaAsiento.create({
        data: {
          tourBusId: asiento.tourBusId,
          numeroAsiento: asiento.numeroAsiento,
          clienteNombre,
          clienteTelefono: clienteTelefono || null,
          clienteEmail: clienteEmail || null,
          precioVenta: parseFloat(precioVenta),
          metodoPago: metodoPago || null,
          observaciones: observaciones || null,
          createdBy: userId
        }
      });

      return { asientoActualizado, venta };
    });

    return NextResponse.json({ 
      asiento: resultado.asientoActualizado,
      venta: resultado.venta,
      message: 'Asiento vendido exitosamente' 
    });

  } catch (error) {
    console.error('Error selling seat:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Cancelar venta de un asiento
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Verificar que el asiento existe
    const asiento = await prisma.asientoBus.findUnique({
      where: { id },
      include: { tourBus: true }
    });

    if (!asiento) {
      return NextResponse.json({ error: 'Asiento no encontrado' }, { status: 404 });
    }

    // Verificar permisos (solo TI/ADMIN o el creador del tour pueden cancelar ventas)
    if (!['TI', 'ADMIN'].includes(user.role) && asiento.tourBus.createdBy !== userId) {
      return NextResponse.json({ error: 'No tienes permisos para cancelar esta venta' }, { status: 403 });
    }

    if (!asiento.isVendido) {
      return NextResponse.json({ error: 'Este asiento no está vendido' }, { status: 400 });
    }

    // Usar transacción para cancelar la venta
    await prisma.$transaction(async (tx) => {
      // Actualizar el asiento
      await tx.asientoBus.update({
        where: { id },
        data: {
          isVendido: false,
          precioVenta: null,
          fechaVenta: null,
          clienteNombre: null,
          clienteTelefono: null,
          clienteEmail: null,
          observaciones: null
        }
      });

      // Eliminar el registro de venta
      await tx.ventaAsiento.deleteMany({
        where: {
          tourBusId: asiento.tourBusId,
          numeroAsiento: asiento.numeroAsiento
        }
      });
    });

    return NextResponse.json({ 
      message: 'Venta cancelada exitosamente' 
    });

  } catch (error) {
    console.error('Error canceling sale:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
