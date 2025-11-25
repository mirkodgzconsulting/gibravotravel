import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';

// Configurar Cloudinary
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    secure: true
  });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dskliu1ig',
    api_key: process.env.CLOUDINARY_API_KEY || '538724966551851',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'Q1fP7-pH6iiltPbFNkqPn0d93no',
  });
}

// Función para recalcular feeAgv de un tour
async function recalcularFeeAgv(tourId: string) {
  try {
    const tour = await prisma.tourBus.findUnique({
      where: { id: tourId },
      include: {
        ventasTourBus: true
      }
    });

    if (!tour) return;

    // Calcular SPESA TOTALE (suma de todos los costos)
    const spesaTotale = (tour.bus || 0) + (tour.pasti || 0) + (tour.parking || 0) + 
                       (tour.coordinatore1 || 0) + (tour.coordinatore2 || 0) + 
                       (tour.ztl || 0) + (tour.hotel || 0) + (tour.polizza || 0) + (tour.tkt || 0);

    // Calcular RICAVO TOTALE (suma de todos los accontos)
    const ricavoTotale = tour.ventasTourBus.reduce((sum, venta) => sum + (venta.acconto || 0), 0);

    // Calcular FEE/AGV
    const feeAgv = ricavoTotale - spesaTotale;

    // Actualizar el tour
    await prisma.tourBus.update({
      where: { id: tourId },
      data: { feeAgv }
    });

    return feeAgv;
  } catch (error) {
    console.error('Error recalculating feeAgv:', error);
    return 0;
  }
}

// POST - Crear nueva venta de Tour Bus
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener el usuario real por clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Leer FormData
    const formData = await request.formData();
    
    // Extraer datos del formulario
    const tourBusId = formData.get('tourBusId') as string;
    const clienteId = formData.get('clienteId') as string | null;
    const clienteNombre = formData.get('clienteNombre') as string;
    const codiceFiscale = formData.get('codiceFiscale') as string;
    const indirizzo = formData.get('indirizzo') as string;
    const email = formData.get('email') as string;
    const numeroTelefono = formData.get('numeroTelefono') as string;
    const fechaNacimiento = formData.get('fechaNacimiento') as string;
    const fermata = formData.get('fermata') as string;
    const numeroAsiento = parseInt(formData.get('numeroAsiento') as string);
    const tieneMascotas = formData.get('tieneMascotas') === 'true';
    const numeroMascotasRaw = formData.get('numeroMascotas') as string;
    const numeroMascotas = numeroMascotasRaw ? parseInt(numeroMascotasRaw) : null;
    const tieneInfantes = formData.get('tieneInfantes') === 'true';
    const numeroInfantesRaw = formData.get('numeroInfantes') as string;
    const numeroInfantes = numeroInfantesRaw ? parseInt(numeroInfantesRaw) : null;
    const totalAPagarRaw = formData.get('totalAPagar') as string;
    const totalAPagar = parseFloat(totalAPagarRaw);
    const accontoRaw = formData.get('acconto') as string;
    const acconto = parseFloat(accontoRaw);
    const daPagareRaw = formData.get('daPagare') as string;
    const daPagare = parseFloat(daPagareRaw);
    const metodoPagamento = formData.get('metodoPagamento') as string;
    const estadoPago = formData.get('estadoPago') as string;
    const notaEsternaRicevuta = formData.get('notaEsternaRicevuta') as string | null;
    const notaInterna = formData.get('notaInterna') as string | null;
    
    // Parsear acompañantes y cuotas desde JSON
    const acompanantesJson = formData.get('acompanantes') as string;
    const acompanantes = acompanantesJson ? JSON.parse(acompanantesJson) : [];
    const cuotasJson = formData.get('cuotas') as string;
    const cuotas = cuotasJson ? JSON.parse(cuotasJson) : [];
    
    // Manejar archivo adjunto
    const fileEntry = formData.get('file');
    const file = fileEntry instanceof File ? fileEntry : null;
    let attachedFileUrl: string | null = null;
    let attachedFileName: string | null = null;
    
    if (file && file.size > 0) {
      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileExtension = file.name.toLowerCase().split('.').pop();
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension ?? '');
        const resourceType = isImage ? 'image' : 'raw';
        
        const result = await new Promise<UploadApiResponse>((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: 'gibravotravel/tour-bus/ventas',
                resource_type: resourceType,
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result as UploadApiResponse);
              }
            )
            .end(buffer);
        });
        
        attachedFileUrl = result.secure_url;
        attachedFileName = file.name;
      } catch (error) {
        console.error('Error uploading file:', error);
        // No fallar la venta por error de archivo, solo registrar
      }
    }

    // Validaciones
    if (!tourBusId || !clienteNombre || !fermata || !numeroAsiento) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // Validar mascotas si está marcado
    if (tieneMascotas && (!numeroMascotas || numeroMascotas < 1)) {
      return NextResponse.json({ error: 'Debe indicar el número de mascotas' }, { status: 400 });
    }

    // Validar infantes si está marcado
    if (tieneInfantes && (!numeroInfantes || numeroInfantes < 1)) {
      return NextResponse.json({ error: 'Debe indicar el número de infantes' }, { status: 400 });
    }

    // Verificar que el tour existe y está activo
    const tour = await prisma.tourBus.findUnique({
      where: { id: tourBusId },
      include: { asientos: true }
    });

    if (!tour || !tour.isActive) {
      return NextResponse.json({ error: 'Tour no encontrado o inactivo' }, { status: 404 });
    }

    // Verificar que el asiento principal está disponible
    const asientoPrincipal = tour.asientos.find(a => a.numeroAsiento === numeroAsiento);
    if (!asientoPrincipal) {
      return NextResponse.json({ error: 'Asiento no encontrado' }, { status: 404 });
    }
    if (asientoPrincipal.isVendido) {
      return NextResponse.json({ error: 'El asiento ya está vendido' }, { status: 400 });
    }

    // Verificar que los asientos de acompañantes están disponibles
    if (acompanantes && acompanantes.length > 0) {
      for (const acomp of acompanantes) {
        const asientoAcomp = tour.asientos.find(a => a.numeroAsiento === acomp.numeroAsiento);
        if (!asientoAcomp) {
          return NextResponse.json({ error: `Asiento ${acomp.numeroAsiento} no encontrado` }, { status: 404 });
        }
        if (asientoAcomp.isVendido) {
          return NextResponse.json({ error: `Asiento ${acomp.numeroAsiento} ya está vendido` }, { status: 400 });
        }
      }
    }

    // Crear la venta con transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Crear la venta principal
      const sanitizedCodiceFiscale = (codiceFiscale ?? '').trim();
      const sanitizedIndirizzo = (indirizzo ?? '').trim();
      const sanitizedEmail = (email ?? '').trim();
      const sanitizedTelefono = (numeroTelefono ?? '').trim();
      const sanitizedFechaNacimiento = fechaNacimiento && fechaNacimiento.trim() !== ''
        ? new Date(fechaNacimiento)
        : new Date('1900-01-01T00:00:00.000Z');

      const venta = await tx.ventaTourBus.create({
        data: {
          tourBusId,
          clienteId: clienteId || null,
          clienteNombre,
          codiceFiscale: sanitizedCodiceFiscale,
          indirizzo: sanitizedIndirizzo,
          email: sanitizedEmail,
          numeroTelefono: sanitizedTelefono,
          fechaNacimiento: sanitizedFechaNacimiento,
          fermata,
          numeroAsiento,
          tieneMascotas: tieneMascotas || false,
          numeroMascotas: tieneMascotas ? numeroMascotas : null,
          tieneInfantes: tieneInfantes || false,
          numeroInfantes: tieneInfantes ? numeroInfantes : null,
          totalAPagar: totalAPagar,
          acconto: acconto,
          daPagare: daPagare,
          metodoPagamento,
          estadoPago,
          notaEsternaRicevuta: notaEsternaRicevuta || null,
          notaInterna: notaInterna || null,
          attachedFile: attachedFileUrl,
          attachedFileName: attachedFileName,
          numeroAcompanantes: acompanantes?.length || 0,
          numeroCuotas: cuotas?.length || null,
          createdBy: user.id
        } as any
      });

      // 2. Marcar el asiento principal como vendido
      await tx.asientoBus.update({
        where: { id: asientoPrincipal.id },
        data: {
          isVendido: true,
          stato: estadoPago, // Guardar el estado del pago
          precioVenta: tour.precioAdulto, // Cliente principal siempre es adulto
          fechaVenta: new Date(),
          clienteNombre,
          clienteTelefono: sanitizedTelefono || null,
          clienteEmail: sanitizedEmail || null
        }
      });

      // 3. Crear registros de acompañantes y marcar sus asientos
      if (acompanantes && acompanantes.length > 0) {
        for (const acomp of acompanantes) {
          const sanitizedAcompTelefono = (acomp.telefono ?? '').trim();
          const sanitizedAcompCodice = (acomp.codiceFiscale ?? '').trim();

          // Crear acompañante
          await tx.acompananteTourBus.create({
            data: {
              ventaTourBusId: venta.id,
              clienteId: acomp.clienteId || null,
              nombreCompleto: acomp.nombreCompleto,
              telefono: sanitizedAcompTelefono || null,
              codiceFiscale: sanitizedAcompCodice || null,
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
                clienteTelefono: sanitizedAcompTelefono,
                clienteEmail: null
              }
            });
          }
        }
      }

      // 4. Crear cuotas si existen
      if (cuotas && cuotas.length > 0) {
        for (let i = 0; i < cuotas.length; i++) {
          const cuota = cuotas[i];
          await tx.cuotaTourBus.create({
            data: {
              ventaTourBusId: venta.id,
              numeroCuota: i + 1,
              fechaPago: cuota.fechaPago ? new Date(cuota.fechaPago) : null,
              precioPagar: parseFloat(cuota.precioPagar),
              metodoPagamento: cuota.metodoPagamento,
              isPagado: false
            }
          });
        }
      }

      return venta;
    });

    // Recalcular feeAgv del tour
    try {
      await recalcularFeeAgv(tourBusId);
    } catch (error) {
      console.error('Error recalculating feeAgv:', error);
      // No fallar la venta por este error
    }

    return NextResponse.json({ 
      venta: resultado,
      message: 'Venta creada exitosamente' 
    });

  } catch (error: any) {
    console.error('Error creating venta:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message,
      code: error.code
    }, { status: 500 });
  }
}

