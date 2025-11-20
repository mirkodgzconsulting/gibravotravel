import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';

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

// PATCH - Actualizar el estado de una venta específica
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: ventaId } = await params;
    const body = await request.json();
    const { stato, metodoCompra, tkt, polizza } = body;

    if (stato === undefined && metodoCompra === undefined && tkt === undefined && polizza === undefined) {
      return NextResponse.json({ error: 'Ì necessario fornire almeno un campo da aggiornare' }, { status: 400 });
    }

    // Buscar el usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Buscar la venta y verificar permisos
    const venta = await prisma.ventaTourAereo.findUnique({
      where: { id: ventaId },
      include: {
        tourAereo: {
          select: {
            id: true,
            createdBy: true
          }
        }
      }
    });

    if (!venta) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    // Verificar permisos: ADMIN y TI pueden editar cualquier venta,
    // USER solo puede editar sus propias ventas
    // Nota: createdBy almacena el id del usuario, no el clerkId
    const allowedUserStates = new Set(['Acconto', 'Ricevuto']);
    const keys = Object.keys(body);
    const soloActualizaEstado = keys.length === 1 && keys[0] === 'stato';
    const soloActualizaTkt = keys.length === 1 && keys[0] === 'tkt';
    const soloActualizaPolizza = keys.length === 1 && keys[0] === 'polizza';
    const puedeActualizarEstado = soloActualizaEstado && stato !== undefined && allowedUserStates.has(stato);
    if (user.role === 'USER' && venta.createdBy !== user.id) {
      if (!puedeActualizarEstado && !soloActualizaTkt && !soloActualizaPolizza) {
      return NextResponse.json({ error: 'No autorizado para editar esta venta' }, { status: 403 });
      }
    }

    // Actualizar el stato y/o metodoCompra
    const updateData: Record<string, unknown> = {};
    if (stato !== undefined) updateData.stato = stato;
    if (metodoCompra !== undefined) updateData.metodoCompra = metodoCompra;
    if (tkt !== undefined) {
      if (tkt === null || tkt === '') {
        updateData.tkt = null;
      } else {
        const parsedTkt = Number.parseFloat(String(tkt).replace(',', '.'));
        if (Number.isNaN(parsedTkt)) {
          return NextResponse.json({ error: 'Il valore di TKT non è valido' }, { status: 400 });
        }
        updateData.tkt = Math.round(parsedTkt * 100) / 100;
      }
    }
    if (polizza !== undefined) {
      if (polizza === null || polizza === '') {
        updateData.polizza = null;
      } else {
        const parsedPolizza = Number.parseFloat(String(polizza).replace(',', '.'));
        if (Number.isNaN(parsedPolizza)) {
          return NextResponse.json({ error: 'Il valore di polizza non è valido' }, { status: 400 });
        }
        updateData.polizza = Math.round(parsedPolizza * 100) / 100;
      }
    }
    
    const ventaActualizada = await prisma.ventaTourAereo.update({
      where: { id: ventaId },
      data: updateData
    });

    return NextResponse.json({ venta: ventaActualizada });

  } catch (error) {
    console.error('Error updating venta stato:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT - Actualizar una venta completa
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: ventaId } = await params;
    
    // Obtener FormData para manejar archivos
    const formData = await request.formData();

    // Buscar el usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Buscar la venta y verificar permisos
    const venta = await prisma.ventaTourAereo.findUnique({
      where: { id: ventaId },
      include: {
        tourAereo: {
          select: {
            id: true,
            createdBy: true,
            hotel: true
          }
        }
      }
    });

    if (!venta) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    // Verificar permisos: ADMIN y TI pueden editar cualquier venta,
    // USER solo puede editar sus propias ventas
    // Nota: createdBy almacena el id del usuario, no el clerkId
    if (user.role === 'USER' && venta.createdBy !== user.id) {
      return NextResponse.json({ error: 'No autorizado para editar esta venta' }, { status: 403 });
    }

    // Extraer datos del FormData
    const pasajero = formData.get('pasajero') as string;
    const codiceFiscale = formData.get('codiceFiscale') as string;
    const indirizzo = formData.get('indirizzo') as string;
    const email = formData.get('email') as string;
    const numeroTelefono = formData.get('numeroTelefono') as string;
    const paisOrigen = formData.get('paisOrigen') as string;
    const iata = formData.get('iata') as string;
    const pnr = formData.get('pnr') as string;
    const transfer = formData.get('transfer') as string;
    const venduto = formData.get('venduto') as string;
    const acconto = formData.get('acconto') as string;
    const polizzaRaw = formData.get('polizza');
    const metodoPagamento = formData.get('metodoPagamento') as string;
    const metodoCompra = formData.get('metodoCompra') as string;
    const stato = formData.get('stato') as string;
    const cuotasJson = formData.get('cuotas') as string;
    const notaEsternaRicevutaRaw = formData.get('notaEsternaRicevuta');
    const notaInternaRaw = formData.get('notaInterna');
    
    // Procesar archivo principal
    const file = formData.get('file') as File | null;
    let attachedFileUrl = venta.attachedFile;
    let attachedFileName = venta.attachedFileName;
    
    if (file && file.size > 0) {
      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const fileExtension = file.name.toLowerCase().split('.').pop();
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
        const resourceType = isImage ? 'image' : 'raw';
        
        const result = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'gibravotravel/tour-aereo',
              resource_type: resourceType
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });
        
        attachedFileUrl = result.secure_url;
        attachedFileName = file.name;
      } catch (error) {
        console.error('Error uploading main file:', error);
      }
    }

    if (!pasajero || !codiceFiscale || !indirizzo || !email || !numeroTelefono || 
        !paisOrigen || !iata || !venduto || !metodoPagamento || !stato) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Calcular daPagare
    const daPagare = parseFloat(venduto) - parseFloat(acconto || '0');

    // Procesar cuotas con archivos
    const cuotas = cuotasJson ? JSON.parse(cuotasJson) : [];
    const cuotasConArchivos = [];
    
    if (cuotas && cuotas.length > 0) {
      for (let i = 0; i < cuotas.length; i++) {
        const cuota = cuotas[i];
        // IMPORTANTE: Mantener archivos existentes por defecto
        let cuotaAttachedFile = cuota.attachedFile || null;
        let cuotaAttachedFileName = cuota.attachedFileName || null;
        
        // Procesar archivo NUEVO de la cuota si existe
        const cuotaFile = formData.get(`cuotaFile${i}`) as File | null;
        if (cuotaFile && cuotaFile.size > 0) {
          try {
            const bytes = await cuotaFile.arrayBuffer();
            const buffer = Buffer.from(bytes);
            
            const fileExtension = cuotaFile.name.toLowerCase().split('.').pop();
            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
            const resourceType = isImage ? 'image' : 'raw';
            
            const result = await new Promise<any>((resolve, reject) => {
              cloudinary.uploader.upload_stream(
                {
                  folder: 'gibravotravel/tour-aereo/cuotas',
                  resource_type: resourceType
                },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              ).end(buffer);
            });
            
            cuotaAttachedFile = result.secure_url;
            cuotaAttachedFileName = cuotaFile.name;
          } catch (error) {
            console.error(`Error uploading cuota file ${i}:`, error);
          }
        } else {
          // Si no hay archivo nuevo, mantener el existente
          if (cuotaAttachedFile) {
          }
        }
        
        cuotasConArchivos.push({
          numeroCuota: cuota.numeroCuota,
          fechaPago: new Date(cuota.fechaPago),
          monto: parseFloat(cuota.monto),
          nota: cuota.nota || null,
          estado: cuota.estado || "Pendiente",
          attachedFile: cuotaAttachedFile,
          attachedFileName: cuotaAttachedFileName
        });
      }
    }

    const updatePayload: Record<string, unknown> = {
        pasajero,
        codiceFiscale,
        indirizzo,
        email,
        numeroTelefono,
        paisOrigen,
        iata,
        pnr: pnr || null,
      hotel: venta.tourAereo?.hotel ?? null,
      transfer: transfer ? parseFloat(transfer) : null,
        venduto: parseFloat(venduto),
        acconto: parseFloat(acconto || '0'),
        daPagare,
        metodoPagamento,
        metodoCompra: metodoCompra || null,
        stato,
        attachedFile: attachedFileUrl,
      attachedFileName,
    };

    if (notaEsternaRicevutaRaw !== null) {
      const trimmed = String(notaEsternaRicevutaRaw).trim();
      updatePayload.notaEsternaRicevuta = trimmed === '' ? null : trimmed;
    }

    if (notaInternaRaw !== null) {
      const trimmed = String(notaInternaRaw).trim();
      updatePayload.notaInterna = trimmed === '' ? null : trimmed;
    }

    if (polizzaRaw !== null) {
      const sanitizedPolizza = String(polizzaRaw).trim();
      updatePayload.polizza = sanitizedPolizza === '' ? null : parseFloat(sanitizedPolizza);
    }

    const ventaActualizada = await prisma.ventaTourAereo.update({
      where: { id: ventaId },
      data: updatePayload,
    });

    // Actualizar cuotas si se proporcionan
    if (cuotasConArchivos.length > 0) {
      // Eliminar cuotas existentes
      await prisma.cuotaVentaTourAereo.deleteMany({
        where: { ventaTourAereoId: ventaId }
      });

      // Crear nuevas cuotas
      await prisma.cuotaVentaTourAereo.createMany({
        data: cuotasConArchivos.map((cuota: any) => ({
          ventaTourAereoId: ventaId,
          numeroCuota: cuota.numeroCuota,
          fechaPago: cuota.fechaPago,
          monto: cuota.monto,
          nota: cuota.nota,
          estado: cuota.estado,
          attachedFile: cuota.attachedFile,
          attachedFileName: cuota.attachedFileName
        }))
      });
    }

    // Obtener la venta actualizada con todas sus relaciones
    const ventaCompleta = await prisma.ventaTourAereo.findUnique({
      where: { id: ventaId },
      include: {
        cuotas: {
          orderBy: {
            numeroCuota: 'asc'
          }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json({ venta: ventaCompleta });

  } catch (error) {
    console.error('Error updating venta:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Eliminar una venta específica
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: ventaId } = await params;

    // Buscar el usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Buscar la venta y verificar permisos
    const venta = await prisma.ventaTourAereo.findUnique({
      where: { id: ventaId },
      include: {
        tourAereo: {
          select: {
            id: true,
            createdBy: true
          }
        }
      }
    });

    if (!venta) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    // Verificar permisos: ADMIN y TI pueden eliminar cualquier venta,
    // USER solo puede eliminar sus propias ventas
    // Nota: createdBy almacena el id del usuario, no el clerkId
    if (user.role === 'USER' && venta.createdBy !== user.id) {
      return NextResponse.json({ error: 'No autorizado para eliminar esta venta' }, { status: 403 });
    }

    // Eliminar la venta
    await prisma.ventaTourAereo.delete({
      where: { id: ventaId }
    });

    return NextResponse.json({ message: 'Venta eliminada correctamente' });

  } catch (error) {
    console.error('Error deleting venta:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
