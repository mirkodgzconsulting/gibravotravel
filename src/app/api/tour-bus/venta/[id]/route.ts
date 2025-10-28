import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

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
    const body = await request.json();

    const {
      // Datos del cliente principal
      clienteId,
      clienteNombre,
      codiceFiscale,
      indirizzo,
      email,
      numeroTelefono,
      fechaNacimiento,
      fermata,
      numeroAsiento,
      tieneMascotas,
      numeroMascotas,
      // Infantes (informativo)
      tieneInfantes,
      numeroInfantes,
      // Acompañantes
      acompanantes,
      // Datos de pago
      totalAPagar,
      acconto,
      daPagare,
      metodoPagamento,
      estadoPago,
      // Cuotas
      cuotas
    } = body;

    // Verificar que la venta existe
    const existingVenta = await prisma.ventaTourBus.findUnique({
      where: { id },
      include: { acompanantes: true, cuotas: true }
    });

    if (!existingVenta) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    // Verificar que el tour existe
    const tour = await prisma.tourBus.findUnique({
      where: { id: existingVenta.tourBusId },
      include: { asientos: true }
    });

    if (!tour) {
      return NextResponse.json({ error: 'Tour no encontrado' }, { status: 404 });
    }

    // Validaciones
    if (!clienteNombre || !codiceFiscale || !fermata || !numeroAsiento) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // Validar mascotas si está marcado
    if (tieneMascotas && (!numeroMascotas || numeroMascotas < 1)) {
      return NextResponse.json({ error: 'Debe indicar el número de mascotas' }, { status: 400 });
    }

    // Verificar que el asiento principal está disponible (o es el mismo)
    const asientoPrincipal = tour.asientos.find(a => a.numeroAsiento === numeroAsiento);
    if (!asientoPrincipal) {
      return NextResponse.json({ error: 'Asiento no encontrado' }, { status: 404 });
    }
    
    // Solo validar si el asiento está vendido si es diferente al actual
    if (numeroAsiento !== existingVenta.numeroAsiento && asientoPrincipal.isVendido) {
      return NextResponse.json({ error: 'El asiento ya está vendido' }, { status: 400 });
    }

    // Obtener asientos actuales de acompañantes
    const asientosActualesAcomp = existingVenta.acompanantes.map(a => a.numeroAsiento);

    // Verificar que los asientos de acompañantes están disponibles
    if (acompanantes && acompanantes.length > 0) {
      for (const acomp of acompanantes) {
        const asientoAcomp = tour.asientos.find(a => a.numeroAsiento === acomp.numeroAsiento);
        if (!asientoAcomp) {
          return NextResponse.json({ error: `Asiento ${acomp.numeroAsiento} no encontrado` }, { status: 404 });
        }
        // Solo validar si el asiento está vendido si no era uno de los asientos actuales
        if (!asientosActualesAcomp.includes(acomp.numeroAsiento) && asientoAcomp.isVendido) {
          return NextResponse.json({ error: `Asiento ${acomp.numeroAsiento} ya está vendido` }, { status: 400 });
        }
      }
    }

    // Actualizar la venta con transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Liberar asiento principal anterior si cambió
      if (numeroAsiento !== existingVenta.numeroAsiento) {
        const asientoAnterior = tour.asientos.find(a => a.numeroAsiento === existingVenta.numeroAsiento);
        if (asientoAnterior) {
          await tx.asientoBus.update({
            where: { id: asientoAnterior.id },
            data: {
              isVendido: false,
              stato: "Libero",
              precioVenta: null,
              fechaVenta: null,
              clienteNombre: null,
              clienteTelefono: null,
              clienteEmail: null
            }
          });
        }
      }

      // 2. Liberar asientos de acompañantes que ya no están
      const nuevosAsientosAcomp = acompanantes?.map((a: any) => a.numeroAsiento) || [];
      const asientosALiberar = asientosActualesAcomp.filter(a => !nuevosAsientosAcomp.includes(a));
      
      for (const numAsiento of asientosALiberar) {
        const asientoALiberar = tour.asientos.find(a => a.numeroAsiento === numAsiento);
        if (asientoALiberar) {
          await tx.asientoBus.update({
            where: { id: asientoALiberar.id },
            data: {
              isVendido: false,
              stato: "Libero",
              precioVenta: null,
              fechaVenta: null,
              clienteNombre: null,
              clienteTelefono: null,
              clienteEmail: null
            }
          });
        }
      }

      // 3. Actualizar la venta principal
      const ventaActualizada = await tx.ventaTourBus.update({
        where: { id },
        data: {
          clienteId: clienteId || null,
          clienteNombre,
          codiceFiscale,
          indirizzo,
          email,
          numeroTelefono,
          fechaNacimiento: new Date(fechaNacimiento),
          fermata,
          numeroAsiento,
          tieneMascotas: tieneMascotas || false,
          numeroMascotas: tieneMascotas ? (parseInt(numeroMascotas) || null) : null,
          tieneInfantes: tieneInfantes || false,
          numeroInfantes: tieneInfantes ? (parseInt(numeroInfantes) || null) : null,
          totalAPagar: parseFloat(totalAPagar),
          acconto: parseFloat(acconto),
          daPagare: parseFloat(daPagare),
          metodoPagamento,
          estadoPago,
          numeroAcompanantes: acompanantes?.length || 0,
          numeroCuotas: cuotas?.length || null,
        }
      });

      // 4. Marcar el asiento principal como vendido
      await tx.asientoBus.update({
        where: { id: asientoPrincipal.id },
        data: {
          isVendido: true,
          stato: estadoPago, // Guardar el estado del pago
          precioVenta: tour.precioAdulto, // Cliente principal siempre es adulto
          fechaVenta: new Date(),
          clienteNombre,
          clienteTelefono: numeroTelefono,
          clienteEmail: email
        }
      });

      // 5. Eliminar acompañantes existentes
      await tx.acompananteTourBus.deleteMany({
        where: { ventaTourBusId: id }
      });

      // 6. Crear nuevos acompañantes y marcar sus asientos
      if (acompanantes && acompanantes.length > 0) {
        for (const acomp of acompanantes) {
          // Crear acompañante
          await tx.acompananteTourBus.create({
            data: {
              ventaTourBusId: id,
              clienteId: acomp.clienteId || null,
              nombreCompleto: acomp.nombreCompleto,
              telefono: acomp.telefono || null,
              codiceFiscale: acomp.codiceFiscale || null,
              esAdulto: acomp.esAdulto !== undefined ? acomp.esAdulto : true,
              fermata: acomp.fermata,
              numeroAsiento: acomp.numeroAsiento
            }
          });

          // Marcar asiento como vendido
          const asientoAcomp = tour.asientos.find(a => a.numeroAsiento === acomp.numeroAsiento);
          if (asientoAcomp) {
            const precioAplicado = acomp.esAdulto ? tour.precioAdulto : tour.precioNino;
            await tx.asientoBus.update({
              where: { id: asientoAcomp.id },
              data: {
                isVendido: true,
                stato: estadoPago, // Guardar el estado del pago
                precioVenta: precioAplicado,
                fechaVenta: new Date(),
                clienteNombre: acomp.nombreCompleto,
                clienteTelefono: acomp.telefono,
                clienteEmail: null
              }
            });
          }
        }
      }

      // 7. Eliminar cuotas existentes
      await tx.cuotaTourBus.deleteMany({
        where: { ventaTourBusId: id }
      });

      // 8. Crear nuevas cuotas si existen
      if (cuotas && cuotas.length > 0) {
        for (const cuota of cuotas) {
          await tx.cuotaTourBus.create({
            data: {
              ventaTourBusId: id,
              fechaPago: new Date(cuota.fechaPago),
              precioPagar: parseFloat(cuota.precioPagar),
              metodoPagamento: cuota.metodoPagamento
            }
          });
        }
      }

      return ventaActualizada;
    });

    // Obtener la venta actualizada con todas las relaciones
    const ventaCompleta = await prisma.ventaTourBus.findUnique({
      where: { id },
      include: {
        acompanantes: true,
        cuotas: true
      }
    });

    return NextResponse.json(ventaCompleta);

  } catch (error) {
    console.error('Error updating venta:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

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

    // Verificar que la venta exists
    const existingVenta = await prisma.ventaTourBus.findUnique({
      where: { id },
      include: { acompanantes: true }
    });

    if (!existingVenta) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    // Obtener el tour para acceder a los asientos
    const tour = await prisma.tourBus.findUnique({
      where: { id: existingVenta.tourBusId },
      include: { asientos: true }
    });

    if (!tour) {
      return NextResponse.json({ error: 'Tour no encontrado' }, { status: 404 });
    }

    // Eliminar con transacción
    await prisma.$transaction(async (tx) => {
      // 1. Liberar asiento principal
      const asientoPrincipal = tour.asientos.find(a => a.numeroAsiento === existingVenta.numeroAsiento);
      if (asientoPrincipal) {
        await tx.asientoBus.update({
          where: { id: asientoPrincipal.id },
          data: {
            isVendido: false,
            precioVenta: null,
            fechaVenta: null,
            clienteNombre: null,
            clienteTelefono: null,
            clienteEmail: null
          }
        });
      }

      // 2. Liberar asientos de acompañantes
      for (const acomp of existingVenta.acompanantes) {
        const asientoAcomp = tour.asientos.find(a => a.numeroAsiento === acomp.numeroAsiento);
        if (asientoAcomp) {
          await tx.asientoBus.update({
            where: { id: asientoAcomp.id },
            data: {
              isVendido: false,
              precioVenta: null,
              fechaVenta: null,
              clienteNombre: null,
              clienteTelefono: null,
              clienteEmail: null
            }
          });
        }
      }

      // 3. Eliminar acompañantes
      await tx.acompananteTourBus.deleteMany({
        where: { ventaTourBusId: id }
      });

      // 4. Eliminar cuotas
      await tx.cuotaTourBus.deleteMany({
        where: { ventaTourBusId: id }
      });

      // 5. Eliminar la venta principal
      await tx.ventaTourBus.delete({
        where: { id }
      });
    });

    return NextResponse.json({ message: 'Venta eliminada correctamente' });

  } catch (error) {
    console.error('Error deleting venta:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
